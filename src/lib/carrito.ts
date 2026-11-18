/**
 * Carrito guardado en el navegador. Sin red ni Astro.
 * La clave versionada es `carrito:v1`. Si lo guardado no se puede leer, queda vacío.
 * El tope es el stock de la variante en el momento de agregar: el sitio estático
 * no vuelve a preguntarle al CMS.
 */

export const CART_KEY = 'carrito:v1'

export interface CartItem {
  slug: string
  variantId: number
  name: string
  size: string
  color: string
  unitPrice: number
  quantity: number
  /** Stock de la variante al agregarla. */
  maxStock: number
  imageUrl: string | null
  /** La pieza única no dice "Queda 1" aunque el tope sea 1. */
  piezaUnica: boolean
}

export interface Cart {
  items: CartItem[]
}

export interface NewCartItem {
  slug: string
  variantId: number
  name: string
  size: string
  color: string
  unitPrice: number
  quantity: number
  maxStock: number
  imageUrl?: string | null
  piezaUnica?: boolean
}

export interface AddResult {
  cart: Cart
  /** False si el dato no sirve o la variante no tiene stock. */
  added: boolean
}

export function emptyCart(): Cart {
  return { items: [] }
}

/**
 * "Talle X · Color Y". Si el talle ya dice "Talle" (talle único), no se repite.
 */
export function variantLine(item: Pick<CartItem, 'size' | 'color'>): string {
  const size = /^talle\b/i.test(item.size) ? item.size : `Talle ${item.size}`
  return `${size} · Color ${item.color}`
}

/**
 * "Queda 1" cuando el tope guardado es 1.
 * Pieza única no lo muestra: la etiqueta de la ficha ya lo dice.
 */
export function quedaUnoTexto(item: Pick<CartItem, 'maxStock' | 'piezaUnica'>): 'Queda 1' | null {
  if (item.piezaUnica) return null
  if (item.maxStock !== 1) return null
  return 'Queda 1'
}

export function totalUnits(cart: Cart): number {
  return cart.items.reduce((sum, item) => sum + item.quantity, 0)
}

export function totalPrice(cart: Cart): number {
  return cart.items.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0)
}

function whole(value: number): number {
  return Math.trunc(value)
}

/** Solo http(s) o una ruta del sitio. Un `javascript:` no se guarda. */
export function safeImageUrl(value: unknown): string | null {
  if (typeof value !== 'string') return null
  const url = value.trim()
  if (url.startsWith('https://') || url.startsWith('http://') || url.startsWith('/')) return url
  return null
}

function parseItem(value: unknown): CartItem | null {
  if (!value || typeof value !== 'object') return null
  const raw = value as Record<string, unknown>
  if (typeof raw.slug !== 'string' || raw.slug.trim() === '') return null
  if (typeof raw.name !== 'string' || raw.name.trim() === '') return null
  if (typeof raw.size !== 'string' || raw.size.trim() === '') return null
  if (typeof raw.color !== 'string' || raw.color.trim() === '') return null
  if (typeof raw.variantId !== 'number' || !Number.isInteger(raw.variantId)) return null
  if (typeof raw.unitPrice !== 'number' || !Number.isFinite(raw.unitPrice) || raw.unitPrice < 0) return null
  if (typeof raw.maxStock !== 'number' || !Number.isInteger(raw.maxStock) || raw.maxStock < 1) return null
  if (typeof raw.quantity !== 'number' || !Number.isFinite(raw.quantity)) return null
  const quantity = whole(raw.quantity)
  if (quantity < 1) return null
  return {
    slug: raw.slug,
    variantId: raw.variantId,
    name: raw.name,
    size: raw.size,
    color: raw.color,
    unitPrice: raw.unitPrice,
    quantity: quantity > raw.maxStock ? raw.maxStock : quantity,
    maxStock: raw.maxStock,
    imageUrl: safeImageUrl(raw.imageUrl),
    piezaUnica: raw.piezaUnica === true,
  }
}

/** String, objeto o basura. Ante cualquier forma inválida, carrito vacío. */
export function parseCart(raw: unknown): Cart {
  let data: unknown = raw
  if (typeof raw === 'string') {
    if (raw.trim() === '') return emptyCart()
    try {
      data = JSON.parse(raw)
    } catch {
      return emptyCart()
    }
  }
  if (!data || typeof data !== 'object' || Array.isArray(data)) return emptyCart()
  const items = (data as { items?: unknown }).items
  if (!Array.isArray(items)) return emptyCart()

  const parsed: CartItem[] = []
  const seen = new Set<number>()
  for (const item of items) {
    const next = parseItem(item)
    if (!next || seen.has(next.variantId)) continue
    seen.add(next.variantId)
    parsed.push(next)
  }
  return { items: parsed }
}

function normalizeNew(item: NewCartItem): CartItem | null {
  if (!item || typeof item !== 'object') return null
  return parseItem({
    slug: item.slug,
    variantId: item.variantId,
    name: item.name,
    size: item.size,
    color: item.color,
    unitPrice: item.unitPrice,
    quantity: item.quantity,
    maxStock: item.maxStock,
    imageUrl: item.imageUrl,
    piezaUnica: item.piezaUnica === true,
  })
}

/**
 * Suma la misma variante y deja la cantidad en el tope.
 * El tope y el precio quedan los de esta vez que se agregó.
 */
export function addItem(cart: Cart, item: NewCartItem): AddResult {
  const next = normalizeNew(item)
  if (!next) return { cart, added: false }

  const index = cart.items.findIndex((existing) => existing.variantId === next.variantId)
  if (index === -1) {
    return { cart: { items: [...cart.items, next] }, added: true }
  }

  const existing = cart.items[index]
  const quantity = Math.min(existing.quantity + next.quantity, next.maxStock)
  const items = cart.items.slice()
  items[index] = { ...next, quantity }
  return { cart: { items }, added: true }
}

/** Entre 1 y el tope. Si la variante no está, el carrito no cambia. */
export function setQuantity(cart: Cart, variantId: number, quantity: number): Cart {
  const index = cart.items.findIndex((item) => item.variantId === variantId)
  if (index === -1) return cart
  if (typeof quantity !== 'number' || !Number.isFinite(quantity)) return cart

  const item = cart.items[index]
  let next = whole(quantity)
  if (next < 1) next = 1
  if (next > item.maxStock) next = item.maxStock
  if (next === item.quantity) return cart

  const items = cart.items.slice()
  items[index] = { ...item, quantity: next }
  return { items }
}

export function removeItem(cart: Cart, variantId: number): Cart {
  if (!cart.items.some((item) => item.variantId === variantId)) return cart
  return { items: cart.items.filter((item) => item.variantId !== variantId) }
}
