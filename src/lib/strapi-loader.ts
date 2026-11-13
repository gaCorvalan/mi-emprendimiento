/**
 * Loader de Content Layer para el catálogo de Strapi 5.
 * Los tipos de cada entrada salen de los schemas Zod en `src/content.config.ts`.
 */

const PAGE_SIZE = 25

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

/**
 * Trae todas las páginas de un content-type. Strapi corta en 25 si no se pide
 * la página siguiente, así que un catálogo más grande se perdería en el build.
 */
export function strapiLoader(endpoint: string) {
  return async () => {
    const baseUrl = (import.meta.env.STRAPI_URL || 'http://localhost:1337').replace(/\/$/, '')
    const items: Array<Record<string, unknown> & { id: string }> = []
    let page = 1
    let pageCount = 1
    let total = 0

    try {
      do {
        const params = new URLSearchParams({
          populate: '*',
          'pagination[page]': String(page),
          'pagination[pageSize]': String(PAGE_SIZE),
        })
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
          const { id, ...rest } = item
          prefixRelativeMedia(rest, baseUrl)
          items.push({
            id: String(id),
            ...rest,
          })
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
