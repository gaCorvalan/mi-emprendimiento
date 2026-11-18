/**
 * Loader de Content Layer para el catálogo de Strapi 5.
 * Los tipos de cada entrada salen de los schemas Zod en `src/content.config.ts`.
 *
 * Las colecciones piden las relaciones por nombre (`populate[product_variants]`,
 * no `populate=*`). El tipo único Tienda no trae paginación: si no está
 * publicado, el build sigue sin esa entrada.
 */

const PAGE_SIZE = 25

export interface StrapiLoaderOptions {
  /** Relaciones de primer nivel. Cada una sale como `populate[clave]=true`. */
  populate: readonly string[]
}

interface StrapiPagination {
  page: number
  pageSize: number
  pageCount: number
  total: number
}

interface StrapiListResponse {
  data: unknown
  meta?: {
    pagination?: StrapiPagination
  }
}

function isEntry(value: unknown): value is { id: number | string } & Record<string, unknown> {
  if (typeof value !== 'object' || value === null) return false
  const id = (value as { id?: unknown }).id
  return typeof id === 'number' || typeof id === 'string'
}

/**
 * El proveedor local devuelve `/uploads/...`. Cloudinary ya manda https.
 * Una ruta relativa en el HTML apunta al host de Astro, no al CMS.
 */
export function absoluteMediaUrl(url: string, strapiUrl: string): string {
  if (url.startsWith('/') && !url.startsWith('//')) {
    return `${strapiUrl}${url}`
  }
  return url
}

function prefixRelativeMedia(entry: Record<string, unknown>, strapiUrl: string) {
  const image = entry.image
  if (!image || typeof image !== 'object') return
  const media = image as Record<string, unknown>
  if (typeof media.url === 'string') {
    media.url = absoluteMediaUrl(media.url, strapiUrl)
  }
  const formats = media.formats
  if (!formats || typeof formats !== 'object') return
  for (const format of Object.values(formats as Record<string, unknown>)) {
    if (!format || typeof format !== 'object') continue
    const file = format as Record<string, unknown>
    if (typeof file.url === 'string') {
      file.url = absoluteMediaUrl(file.url, strapiUrl)
    }
  }
}

export function strapiBaseUrl(): string {
  let fromAstro: string | undefined
  try {
    const value = import.meta.env.STRAPI_URL
    if (typeof value === 'string' && value) fromAstro = value
  } catch {
    fromAstro = undefined
  }
  const configured = fromAstro || process.env.STRAPI_URL || 'http://localhost:1337'
  return configured.replace(/\/$/, '')
}

function toEntry(item: { id: number | string } & Record<string, unknown>, strapiUrl: string) {
  const { id, ...rest } = item
  prefixRelativeMedia(rest, strapiUrl)
  return {
    id: String(id),
    ...rest,
  }
}

function applyPopulate(params: URLSearchParams, populate: readonly string[]) {
  for (const key of populate) {
    params.set(`populate[${key}]`, 'true')
  }
}

/**
 * Trae todas las páginas de un content-type. Strapi corta en 25 si no se pide
 * la página siguiente, así que un catálogo más grande se perdería en el build.
 */
export function strapiLoader(endpoint: string, options: StrapiLoaderOptions) {
  return async () => {
    const baseUrl = strapiBaseUrl()
    const items: Array<Record<string, unknown> & { id: string }> = []
    let page = 1
    let pageCount = 1
    let total = 0

    try {
      do {
        const params = new URLSearchParams({
          'pagination[page]': String(page),
          'pagination[pageSize]': String(PAGE_SIZE),
        })
        applyPopulate(params, options.populate)
        const url = `${baseUrl}/api/${endpoint}?${params}`

        console.log(`[StrapiLoader] Fetching: ${url}`)

        const response = await fetch(url)

        if (!response.ok) {
          throw new Error(`HTTP Error: ${response.status} ${response.statusText} for ${url}`)
        }

        let data: StrapiListResponse
        try {
          data = await response.json()
        } catch (parseError) {
          throw new Error(`JSON Parse Error for ${url}: ${parseError}`)
        }

        if (!data.data || !Array.isArray(data.data)) {
          throw new Error(`Invalid Strapi response structure for ${url}. Expected { data: [] }, got: ${JSON.stringify(data)}`)
        }

        const pagination = data.meta?.pagination
        if (!pagination || typeof pagination.pageCount !== 'number' || typeof pagination.total !== 'number') {
          throw new Error(`Invalid Strapi response for ${url}. Expected meta.pagination so the full catalog can be loaded.`)
        }

        for (const item of data.data) {
          if (!isEntry(item)) {
            throw new Error(`Invalid Strapi entry in ${url}: missing id`)
          }
          items.push(toEntry(item, baseUrl))
        }

        pageCount = pagination.pageCount
        total = pagination.total
        page += 1
      } while (page <= pageCount)

      if (items.length !== total) {
        throw new Error(`Incomplete catalog for ${endpoint}: expected ${total} items, got ${items.length}`)
      }

      console.log(`[StrapiLoader] Successfully fetched ${items.length} items from ${endpoint} (${pageCount} page${pageCount === 1 ? '' : 's'})`)

      return items
    } catch (error) {
      console.error(`[StrapiLoader] Error loading ${endpoint}:`, error)

      if (error instanceof Error) {
        throw new Error(`Failed to load ${endpoint} from Strapi: ${error.message}`)
      }
      throw new Error(`Failed to load ${endpoint} from Strapi: Unknown error`)
    }
  }
}

/**
 * Tipo único de Strapi (`GET /api/tienda`). No tiene paginación ni `findOne`.
 * `data: null` o un 404 (todavía no publicado) dejan la colección vacía:
 * el whatsapp nulo, si la entrada existe, no es un error.
 */
export function strapiSingleLoader(endpoint: string) {
  return async () => {
    const baseUrl = strapiBaseUrl()
    const url = `${baseUrl}/api/${endpoint}`

    try {
      console.log(`[StrapiLoader] Fetching single type: ${url}`)
      const response = await fetch(url)

      if (response.status === 404) {
        console.warn(`[StrapiLoader] Single type ${endpoint} is not published. Continuing without it.`)
        return []
      }

      if (!response.ok) {
        throw new Error(`HTTP Error: ${response.status} ${response.statusText} for ${url}`)
      }

      let body: { data?: unknown }
      try {
        body = await response.json()
      } catch (parseError) {
        throw new Error(`JSON Parse Error for ${url}: ${parseError}`)
      }

      if (body.data == null) {
        console.warn(`[StrapiLoader] Single type ${endpoint} has no published entry. Continuing without it.`)
        return []
      }

      if (!isEntry(body.data)) {
        throw new Error(`Invalid Strapi single type ${url}: missing id`)
      }

      const entry = toEntry(body.data, baseUrl)
      console.log(`[StrapiLoader] Successfully fetched single type ${endpoint}`)
      return [entry]
    } catch (error) {
      console.error(`[StrapiLoader] Error loading single type ${endpoint}:`, error)

      if (error instanceof Error) {
        throw new Error(`Failed to load ${endpoint} from Strapi: ${error.message}`)
      }
      throw new Error(`Failed to load ${endpoint} from Strapi: Unknown error`)
    }
  }
}
