/**
 * Ficha de la prenda: talles y colores según lo elegido, precio y tope.
 * Sin red ni Astro. El stock y el peso en pesos salen de `stock.ts`.
 */

import { cardView, cardPrice } from './catalog.ts'
import {
  formatArs,
  quedaUna,
  totalStock,
  variantPrice,
  type StockProduct,
  type StockVariant,
} from './stock.ts'

export interface PrendaVariant extends StockVariant {
  id: number
}

export interface PrendaProduct extends StockProduct {
  slug: string
  product_variants: readonly PrendaVariant[]
}

export interface Selection {
  size: string | null
  color: string | null
}

export interface Choice {
  value: string
  enabled: boolean
  /** Código de la muestra. En talles queda null. */
  colorHex: string | null
}

const emptySelection: Selection = { size: null, color: null }

function sizesInOrder(product: PrendaProduct): string[] {
  const sizes: string[] = []
  for (const variant of product.product_variants) {
    if (!sizes.includes(variant.size)) sizes.push(variant.size)
  }
  return sizes
}

function colorsInOrder(product: PrendaProduct): Choice[] {
  const colors: Choice[] = []
  for (const variant of product.product_variants) {
    const existing = colors.find((choice) => choice.value === variant.color)
    if (existing) {
      if (!existing.colorHex && variant.color_hex) existing.colorHex = variant.color_hex
      continue
    }
    colors.push({
      value: variant.color,
      enabled: false,
      colorHex: variant.color_hex ?? null,
    })
  }
  return colors
}

function hasStock(product: PrendaProduct, size: string, color?: string | null): boolean {
  return product.product_variants.some((variant) => {
    if (variant.size !== size) return false
    if (color && variant.color !== color) return false
    return variant.stock_quantity > 0
  })
}

/** Talles de la prenda, en el orden de las variantes. El agotado sigue en la lista. */
export function sizeChoices(product: PrendaProduct, selection: Selection = emptySelection): Choice[] {
  return sizesInOrder(product).map((size) => ({
    value: size,
    enabled: hasStock(product, size, selection.color),
    colorHex: null,
  }))
}

/** Colores de la prenda, con muestra. Un talle elegido deja sin stock al resto. */
export function colorChoices(product: PrendaProduct, selection: Selection = emptySelection): Choice[] {
  return colorsInOrder(product).map((choice) => ({
    ...choice,
    enabled: product.product_variants.some((variant) => {
      if (variant.color !== choice.value) return false
      if (selection.size && variant.size !== selection.size) return false
      return variant.stock_quantity > 0
    }),
  }))
}

/**
 * Si hay un solo talle o un solo color, queda elegido.
 * Un valor único se elige aunque esa variante esté en cero.
 */
export function initialSelection(product: PrendaProduct): Selection {
  const sizes = sizesInOrder(product)
  const colors = colorsInOrder(product)
  return {
    size: sizes.length === 1 ? sizes[0] : null,
    color: colors.length === 1 ? colors[0].value : null,
  }
}

/** La variante de ese talle y color. Si hay dos, prefiere la que tiene stock. */
export function findVariant(product: PrendaProduct, size: string, color: string): PrendaVariant | null {
  const matches = product.product_variants.filter((variant) => variant.size === size && variant.color === color)
  if (matches.length === 0) return null
  return matches.find((variant) => variant.stock_quantity > 0) ?? matches[0]
}

export function selectedVariant(product: PrendaProduct, selection: Selection): PrendaVariant | null {
  if (!selection.size || !selection.color) return null
  return findVariant(product, selection.size, selection.color)
}

/** Todas las variantes en cero, o ninguna variante. */
export function isSoldOut(product: PrendaProduct): boolean {
  return totalStock(product) <= 0
}

/**
 * Precio de la variante elegida. Sin talle y color, el mismo texto que la tarjeta
 * (con "desde" si las variantes no cuestan lo mismo).
 */
export function priceText(product: PrendaProduct, selection: Selection = emptySelection): string {
  const variant = selectedVariant(product, selection)
  if (!variant) return cardView(product).priceText
  return formatArs(variantPrice(product, variant))
}

/** Importe de la selección. Sin variante elegida, el menor, como la tarjeta. */
export function priceAmount(product: PrendaProduct, selection: Selection = emptySelection): number {
  const variant = selectedVariant(product, selection)
  if (!variant) return cardPrice(product)
  return variantPrice(product, variant)
}

/** Sin stock, el precio se apaga. También si la variante elegida está en cero. */
export function priceMuted(product: PrendaProduct, selection: Selection = emptySelection): boolean {
  const variant = selectedVariant(product, selection)
  if (variant) return variant.stock_quantity <= 0
  return cardView(product).priceMuted
}

/** Tope del "+". Sin variante elegida, 0: no se puede subir. */
export function quantityCap(product: PrendaProduct, selection: Selection): number {
  const variant = selectedVariant(product, selection)
  if (!variant) return 0
  return variant.stock_quantity
}

/** Deja la cantidad entre 1 y el tope. Sin tope, queda en 1. */
export function clampQuantity(quantity: number, cap: number): number {
  if (cap <= 0) return 1
  const whole = Math.trunc(quantity)
  if (whole < 1) return 1
  if (whole > cap) return cap
  return whole
}

/**
 * "Queda 1" cuando la variante elegida tiene una unidad.
 * Pieza única no lo muestra: la etiqueta ya lo dice.
 */
export function quedaUnoTexto(product: PrendaProduct, selection: Selection): 'Queda 1' | null {
  if (product.pieza_unica) return null
  const variant = selectedVariant(product, selection)
  if (!variant || !quedaUna(variant)) return null
  return 'Queda 1'
}

/** Sin stock, el stepper queda apagado: no se puede bajar ni subir. */
export function stepperMuted(product: PrendaProduct): boolean {
  return isSoldOut(product)
}

export function canAdd(product: PrendaProduct, selection: Selection): boolean {
  const variant = selectedVariant(product, selection)
  return variant !== null && variant.stock_quantity > 0
}

export function addButtonLabel(product: PrendaProduct): 'Sin stock' | 'Agregar al carrito' {
  return isSoldOut(product) ? 'Sin stock' : 'Agregar al carrito'
}

/** El aviso de elegir talle y color. No aparece si la prenda no tiene stock. */
export function showChooseHint(product: PrendaProduct, selection: Selection): boolean {
  return !isSoldOut(product) && !canAdd(product, selection)
}

export interface AddToCartDetail {
  slug: string
  variantId: number
  size: string
  color: string
  quantity: number
  price: number
}

/** Datos del evento. Null si todavía no se puede agregar. */
export function addToCartDetail(
  product: PrendaProduct,
  selection: Selection,
  quantity: number,
): AddToCartDetail | null {
  const variant = selectedVariant(product, selection)
  if (!variant || variant.stock_quantity <= 0) return null
  const amount = clampQuantity(quantity, variant.stock_quantity)
  return {
    slug: product.slug,
    variantId: variant.id,
    size: variant.size,
    color: variant.color,
    quantity: amount,
    price: variantPrice(product, variant),
  }
}
