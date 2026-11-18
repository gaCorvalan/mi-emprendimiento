/**
 * Datos de la tarjeta y de las páginas del catálogo.
 * Sin red ni Astro: el precio sale de `stock.ts`.
 */

import { formatArs, productStatus, variantPrice, type StockProduct } from './stock.ts'

export const PAGE_SIZE = 24

export type CardLabel = 'PIEZA ÚNICA' | 'ÚLTIMA UNIDAD' | 'SIN STOCK'

export interface CardView {
  /** null cuando el estado es disponible: no hay etiqueta. */
  label: CardLabel | null
  /** Precio en pesos. Lleva "desde" solo si las variantes no cuestan lo mismo. */
  priceText: string
  /** Sin stock: el precio va en texto secundario. */
  priceMuted: boolean
}

/**
 * Precio que muestra la tarjeta: el menor entre las variantes.
 * Si no hay variantes, es el `base_price`. Un 0 de la variante cuenta.
 */
export function cardPrice(product: StockProduct): number {
  if (product.product_variants.length === 0) return product.base_price
  let lowest = variantPrice(product, product.product_variants[0])
  for (const variant of product.product_variants) {
    const amount = variantPrice(product, variant)
    if (amount < lowest) lowest = amount
  }
  return lowest
}

/**
 * Etiqueta de la tarjeta. La palabra sale del estado; el color no alcanza.
 * `disponible` no lleva etiqueta. Pieza única gana, igual que en productStatus.
 */
export function cardView(product: StockProduct): CardView {
  const status = productStatus(product)
  const label: CardLabel | null =
    status === 'pieza-unica' ? 'PIEZA ÚNICA'
    : status === 'ultima-unidad' ? 'ÚLTIMA UNIDAD'
    : status === 'sin-stock' ? 'SIN STOCK'
    : null

  const lowest = cardPrice(product)
  const differ = product.product_variants.some((variant) => variantPrice(product, variant) !== lowest)

  return {
    label,
    priceText: differ ? `desde ${formatArs(lowest)}` : formatArs(lowest),
    priceMuted: status === 'sin-stock',
  }
}

export function prendasLabel(count: number): string {
  return count === 1 ? '1 prenda' : `${count} prendas`
}

/** X es cuántas prendas hay en esta página. Y es el total del catálogo. */
export function showingLabel(shown: number, total: number): string {
  return `Mostrando ${shown} de ${total}`
}

/** La primera página es el inicio. El resto va en /pagina/2, /pagina/3, … */
export function catalogPagePath(page: number): string {
  if (page <= 1) return '/'
  return `/pagina/${page}`
}

export interface CatalogPage<T> {
  data: T[]
  shown: number
  total: number
  currentPage: number
  lastPage: number
  prev?: string
  next?: string
}

export function pageCount(total: number, pageSize = PAGE_SIZE): number {
  if (total <= 0) return 1
  return Math.ceil(total / pageSize)
}

export function pageSlice<T>(items: readonly T[], page: number, pageSize = PAGE_SIZE): CatalogPage<T> {
  const total = items.length
  const lastPage = pageCount(total, pageSize)
  const requested = Math.trunc(page)
  const currentPage = Math.min(Math.max(requested || 1, 1), lastPage)
  const start = (currentPage - 1) * pageSize
  const data = items.slice(start, start + pageSize)

  return {
    data: [...data],
    shown: data.length,
    total,
    currentPage,
    lastPage,
    ...(currentPage > 1 ? { prev: catalogPagePath(currentPage - 1) } : {}),
    ...(currentPage < lastPage ? { next: catalogPagePath(currentPage + 1) } : {}),
  }
}
