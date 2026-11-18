/**
 * Búsqueda, filtros y orden del catálogo.
 * Sin red ni Astro: el precio es el de la tarjeta (`cardPrice`).
 *
 * Entre secciones el filtro es AND. Dentro de una sección, OR.
 * Sin stock no se esconde: si coincide, entra.
 */

import { cardPrice } from './catalog.ts'
import { productStatus, type ProductStatus, type StockVariant } from './stock.ts'

export const CATALOG_SORTS = ['mas-nuevos', 'menor-precio', 'mayor-precio'] as const

export type CatalogSort = (typeof CATALOG_SORTS)[number]

export interface CatalogColor {
  name: string
  hex: string | null
}

/** Resumen que viaja en la página. Alcanza para filtrar y ordenar. */
export interface CatalogItem {
  slug: string
  name: string
  price: number
  status: ProductStatus
  categorySlugs: string[]
  sizes: string[]
  colors: CatalogColor[]
  /** publishedAt, o createdAt si no hay fecha de publicación. */
  date: string
}

export interface CatalogQuery {
  q: string
  categorias: string[]
  talles: string[]
  colores: string[]
  orden: CatalogSort
}

export interface CatalogItemSource {
  slug: string
  name: string
  base_price: number
  pieza_unica: boolean
  createdAt?: string | null
  publishedAt?: string | null
  categories?: readonly { slug: string }[] | null
  product_variants?: readonly StockVariant[] | null
}

export interface CatalogCategorySource {
  slug: string
  name: string
  order?: number | null
  active?: boolean
}

const HEX = /^#[0-9A-Fa-f]{6}$/

export function emptyCatalogQuery(): CatalogQuery {
  return { q: '', categorias: [], talles: [], colores: [], orden: 'mas-nuevos' }
}

/** Minúsculas, sin tildes, espacios de más afuera y adentro. */
export function normalizeText(value: string): string {
  return value
    .normalize('NFD')
    .replace(/\p{M}+/gu, '')
    .toLocaleLowerCase('es')
    .replace(/\s+/g, ' ')
    .trim()
}

export function isCatalogSort(value: string | null): value is CatalogSort {
  return CATALOG_SORTS.some((sort) => sort === value)
}

function unique(values: readonly string[]): string[] {
  const result: string[] = []
  for (const value of values) {
    const trimmed = value.trim()
    if (!trimmed || result.includes(trimmed)) continue
    result.push(trimmed)
  }
  return result
}

export function colorHex(value: string | null | undefined): string | null {
  if (value && HEX.test(value)) return value
  return null
}

/**
 * Arma el resumen. El precio es el menor de la tarjeta.
 * Talle y color salen de las variantes, aunque no tengan stock.
 */
export function toCatalogItem(source: CatalogItemSource): CatalogItem {
  const variants = source.product_variants ?? []
  const stockProduct = {
    base_price: source.base_price,
    pieza_unica: source.pieza_unica,
    product_variants: variants,
  }
  const sizes: string[] = []
  const colors: CatalogColor[] = []

  for (const variant of variants) {
    const size = variant.size.trim()
    if (size && !sizes.includes(size)) sizes.push(size)
    const name = variant.color.trim()
    if (name && !colors.some((color) => color.name === name)) {
      colors.push({ name, hex: colorHex(variant.color_hex) })
    }
  }

  const categorySlugs: string[] = []
  for (const category of source.categories ?? []) {
    const slug = category.slug.trim()
    if (slug && !categorySlugs.includes(slug)) categorySlugs.push(slug)
  }

  return {
    slug: source.slug,
    name: source.name,
    price: cardPrice(stockProduct),
    status: productStatus(stockProduct),
    categorySlugs,
    sizes,
    colors,
    date: source.publishedAt || source.createdAt || '',
  }
}

/** Categorías activas del CMS, por `order` y después por nombre. */
export function categoryChoices(
  categories: readonly CatalogCategorySource[],
): { slug: string, name: string }[] {
  return categories
    .filter((category) => category.active !== false && category.slug.trim() && category.name.trim())
    .map((category) => ({
      slug: category.slug.trim(),
      name: category.name.trim(),
      order: category.order ?? Number.POSITIVE_INFINITY,
    }))
    .sort((a, b) => a.order - b.order || a.name.localeCompare(b.name, 'es') || a.slug.localeCompare(b.slug, 'es'))
    .filter((category, index, list) => list.findIndex((entry) => entry.slug === category.slug) === index)
    .map(({ slug, name }) => ({ slug, name }))
}

/** Talles y colores que aparecen en alguna variante. El primero gana el hex. */
export function availableFacets(items: readonly CatalogItem[]): { talles: string[], colores: CatalogColor[] } {
  const talles: string[] = []
  const colores: CatalogColor[] = []
  for (const item of items) {
    for (const size of item.sizes) {
      if (!talles.includes(size)) talles.push(size)
    }
    for (const color of item.colors) {
      if (!colores.some((entry) => entry.name === color.name)) {
        colores.push({ name: color.name, hex: colorHex(color.hex) })
      }
    }
  }
  return { talles, colores }
}

export function parseCatalogQuery(search: string): CatalogQuery {
  const params = new URLSearchParams(search.startsWith('?') ? search.slice(1) : search)
  const orden = params.get('orden')
  return {
    q: (params.get('q') ?? '').trim(),
    categorias: unique(params.getAll('categoria')),
    talles: unique(params.getAll('talle')),
    colores: unique(params.getAll('color')),
    orden: isCatalogSort(orden) ? orden : 'mas-nuevos',
  }
}

/** Vacío si no hay nada que contar. `orden` solo entra si no es el de siempre. */
export function serializeCatalogQuery(query: CatalogQuery): string {
  const params = new URLSearchParams()
  const q = query.q.trim()
  if (q) params.set('q', q)
  for (const slug of unique(query.categorias)) params.append('categoria', slug)
  for (const size of unique(query.talles)) params.append('talle', size)
  for (const color of unique(query.colores)) params.append('color', color)
  if (query.orden !== 'mas-nuevos') params.set('orden', query.orden)
  const text = params.toString()
  return text ? `?${text}` : ''
}

export function isCatalogQueryActive(query: CatalogQuery): boolean {
  return query.q.trim() !== ''
    || query.categorias.length > 0
    || query.talles.length > 0
    || query.colores.length > 0
    || query.orden !== 'mas-nuevos'
}

/** Deja el orden de entrada. No mira el stock. */
export function filterCatalog(items: readonly CatalogItem[], query: CatalogQuery): CatalogItem[] {
  const q = normalizeText(query.q)
  return items.filter((item) => {
    if (q && !normalizeText(item.name).includes(q)) return false
    if (query.categorias.length > 0 && !query.categorias.some((slug) => item.categorySlugs.includes(slug))) {
      return false
    }
    if (query.talles.length > 0 && !query.talles.some((size) => item.sizes.includes(size))) return false
    if (query.colores.length > 0 && !query.colores.some((color) => item.colors.some((entry) => entry.name === color))) {
      return false
    }
    return true
  })
}

function timestamp(value: string): number {
  const parsed = Date.parse(value)
  return Number.isNaN(parsed) ? 0 : parsed
}

/** Empate: se queda el que venía antes. */
export function sortCatalog(items: readonly CatalogItem[], orden: CatalogSort): CatalogItem[] {
  return items
    .map((item, index) => ({ item, index }))
    .sort((a, b) => {
      let diff = 0
      if (orden === 'menor-precio') diff = a.item.price - b.item.price
      else if (orden === 'mayor-precio') diff = b.item.price - a.item.price
      else diff = timestamp(b.item.date) - timestamp(a.item.date)
      if (diff !== 0) return diff
      return a.index - b.index
    })
    .map((entry) => entry.item)
}

export function applyCatalog(items: readonly CatalogItem[], query: CatalogQuery): CatalogItem[] {
  return sortCatalog(filterCatalog(items, query), query.orden)
}
