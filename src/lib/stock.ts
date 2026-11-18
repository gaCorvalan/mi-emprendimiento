/**
 * Stock y precio, sin red ni Astro.
 * El precio del producto en la API es `base_price`. El de la variante es
 * `price`: si viene null, se usa el del producto.
 */

export type ProductStatus = 'pieza-unica' | 'ultima-unidad' | 'sin-stock' | 'disponible'

export interface StockVariant {
  size: string
  color: string
  color_hex?: string | null
  stock_quantity: number
  price?: number | null
}

export interface StockProduct {
  base_price: number
  pieza_unica: boolean
  product_variants: readonly StockVariant[]
}

export function totalStock(product: StockProduct): number {
  return product.product_variants.reduce((sum, variant) => sum + variant.stock_quantity, 0)
}

/** Talles con al menos una variante con stock. El orden es el de las variantes. */
export function availableSizes(product: StockProduct): string[] {
  const sizes: string[] = []
  for (const variant of product.product_variants) {
    if (variant.stock_quantity <= 0) continue
    if (!sizes.includes(variant.size)) sizes.push(variant.size)
  }
  return sizes
}

/**
 * Colores con stock. Si se pasa un talle, solo cuenta ese talle.
 * Un talle agotado devuelve una lista vacía.
 */
export function availableColors(product: StockProduct, size?: string): string[] {
  const colors: string[] = []
  for (const variant of product.product_variants) {
    if (size !== undefined && variant.size !== size) continue
    if (variant.stock_quantity <= 0) continue
    if (!colors.includes(variant.color)) colors.push(variant.color)
  }
  return colors
}

/** Unidades de un talle y un color. Si no hay esa combinación, 0. */
export function stockFor(product: StockProduct, size: string, color: string): number {
  return product.product_variants.reduce((sum, variant) => {
    if (variant.size !== size || variant.color !== color) return sum
    return sum + variant.stock_quantity
  }, 0)
}

export function variantPrice(product: StockProduct, variant: StockVariant): number {
  return variant.price ?? product.base_price
}

/**
 * Estado del producto. `pieza_unica` gana sobre el stock.
 * `ultima-unidad` es el total de todas las variantes igual a 1.
 */
export function productStatus(product: StockProduct): ProductStatus {
  if (product.pieza_unica) return 'pieza-unica'
  const total = totalStock(product)
  if (product.product_variants.length === 0 || total <= 0) return 'sin-stock'
  if (total === 1) return 'ultima-unidad'
  return 'disponible'
}

/** La variante tiene una sola unidad. Es independiente del estado del producto. */
export function quedaUna(variant: StockVariant): 'queda 1' | null {
  return variant.stock_quantity === 1 ? 'queda 1' : null
}

/** Tope de cantidad para esa variante: su stock. */
export function maxQuantity(variant: StockVariant): number {
  return variant.stock_quantity
}

const arsFormatter = new Intl.NumberFormat('es-AR', {
  style: 'currency',
  currency: 'ARS',
  minimumFractionDigits: 0,
  maximumFractionDigits: 0,
})

/** Pesos argentinos sin centavos. Intl es-AR usa espacio de no separación: "$ 18.900". */
export function formatArs(amount: number): string {
  return arsFormatter.format(amount)
}
