/**
 * Lee y escribe `carrito:v1`, el contador del encabezado y el aviso de agregado.
 * El botón de la ficha ya dispara `agregar-al-carrito`. Acá se guarda y listo.
 */

import { prendasLabel } from '../lib/catalog.ts'
import {
  CART_KEY,
  addItem,
  parseCart,
  totalUnits,
  type Cart,
  type NewCartItem,
} from '../lib/carrito.ts'

const TOAST_MS = 4000

interface DatosPrenda {
  slug?: string
  name?: string
  imageUrl?: string | null
  pieza_unica?: boolean
  product_variants?: { id?: number; stock_quantity?: number }[]
}

function storage(): Storage | null {
  try {
    return window.localStorage
  } catch {
    return null
  }
}

export function readCart(): Cart {
  const store = storage()
  if (!store) return { items: [] }
  try {
    return parseCart(store.getItem(CART_KEY))
  } catch {
    return { items: [] }
  }
}

export function writeCart(cart: Cart): void {
  const store = storage()
  if (!store) return
  try {
    store.setItem(CART_KEY, JSON.stringify(cart))
  } catch {
    return
  }
  paintBadge(cart)
  window.dispatchEvent(new CustomEvent('carrito-cambio'))
}

function paintBadge(cart: Cart): void {
  const link = document.querySelector<HTMLAnchorElement>('[data-carrito-enlace]')
  const badge = document.querySelector<HTMLElement>('[data-carrito-cuenta]')
  if (!link || !badge) return

  const units = totalUnits(cart)
  const visible = units > 0
  badge.classList.toggle('hidden', !visible)
  badge.classList.toggle('inline-flex', visible)
  badge.textContent = visible ? String(units) : ''
  link.setAttribute('aria-label', visible ? `Carrito, ${prendasLabel(units)}` : 'Carrito')
}

let toastTimer = 0

function showToast(): void {
  const toast = document.querySelector<HTMLElement>('[data-aviso-carrito]')
  if (!toast) return
  toast.hidden = false
  window.clearTimeout(toastTimer)
  toastTimer = window.setTimeout(() => {
    toast.hidden = true
  }, TOAST_MS)
}

function datosPrenda(): DatosPrenda | null {
  const node = document.querySelector('#prenda-datos')
  if (!node?.textContent) return null
  try {
    return JSON.parse(node.textContent) as DatosPrenda
  } catch {
    return null
  }
}

function onAdd(event: Event): void {
  if (!(event instanceof CustomEvent)) return
  const detail = event.detail
  if (!detail || typeof detail !== 'object') return
  const data = detail as Record<string, unknown>
  if (typeof data.slug !== 'string') return
  if (typeof data.variantId !== 'number' || !Number.isInteger(data.variantId)) return
  if (typeof data.size !== 'string' || typeof data.color !== 'string') return
  if (typeof data.quantity !== 'number' || typeof data.price !== 'number') return

  const datos = datosPrenda()
  if (!datos || datos.slug !== data.slug) return
  const variant = datos.product_variants?.find((entry) => entry.id === data.variantId)
  if (!variant || typeof variant.stock_quantity !== 'number') return

  const fromDom = document.querySelector('[data-prenda] h1')?.textContent?.trim() ?? ''
  const name = typeof datos.name === 'string' && datos.name.trim() !== '' ? datos.name : fromDom
  const nuevo: NewCartItem = {
    slug: data.slug,
    variantId: data.variantId,
    name,
    size: data.size,
    color: data.color,
    unitPrice: data.price,
    quantity: data.quantity,
    maxStock: variant.stock_quantity,
    imageUrl: typeof datos.imageUrl === 'string' ? datos.imageUrl : null,
    piezaUnica: datos.pieza_unica === true,
  }

  const result = addItem(readCart(), nuevo)
  if (!result.added) return
  writeCart(result.cart)
  showToast()
}

export function initCarrito(): void {
  if (document.documentElement.dataset.carritoListo === 'si') return
  document.documentElement.dataset.carritoListo = 'si'

  paintBadge(readCart())
  window.addEventListener('agregar-al-carrito', onAdd)
  window.addEventListener('carrito-cambio', () => {
    paintBadge(readCart())
  })
  window.addEventListener('storage', (event) => {
    if (event.key !== null && event.key !== CART_KEY) return
    paintBadge(readCart())
  })
}
