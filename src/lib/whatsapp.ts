/**
 * Texto del pedido y link de WhatsApp. Sin red, sin DOM y sin vaciar el carrito.
 * El número es el de la Tienda (solo dígitos, 8 a 15). El mensaje no lleva
 * links, slugs ni ids: nombre, talle, color, cantidad y precios.
 */

import { totalPrice, variantLine, type Cart, type CartItem } from './carrito.ts'
import { formatArs } from './stock.ts'

const DIGITOS = /^[0-9]{8,15}$/

/** null si está vacío o no son entre 8 y 15 dígitos. */
export function whatsappDigits(value: string | null | undefined): string | null {
  if (typeof value !== 'string') return null
  const digits = value.trim()
  if (!DIGITOS.test(digits)) return null
  return digits
}

function lineBlock(item: CartItem): string {
  const precio = formatArs(item.unitPrice * item.quantity)
  return `• ${item.quantity} × ${item.name}\n   ${variantLine(item)} · ${precio}`
}

/** El texto exacto que va en el mensaje. Un bloque por prenda, separados por una línea en blanco. */
export function orderMessage(tienda: string, cart: Cart): string {
  const bloques = cart.items.map((item) => lineBlock(item)).join('\n\n')
  const total = formatArs(totalPrice(cart))
  return [
    `¡Hola, ${tienda}! Quiero hacer este pedido:`,
    '',
    bloques,
    '',
    `Total: ${total}`,
    '',
    '¡Gracias! Quedo atento/a para coordinar el envío.',
  ].join('\n')
}

/**
 * `https://wa.me/{numero}?text={mensaje}`. null si el número no es válido.
 * El mensaje va con encodeURIComponent.
 */
export function whatsappLink(whatsapp: string | null | undefined, message: string): string | null {
  const digits = whatsappDigits(whatsapp)
  if (!digits) return null
  return `https://wa.me/${digits}?text=${encodeURIComponent(message)}`
}
