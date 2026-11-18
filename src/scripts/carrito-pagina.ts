/**
 * La página /carrito: lista, cantidad y quitar. No arma el mensaje de WhatsApp.
 */

import {
  CART_KEY,
  quedaUnoTexto,
  removeItem,
  setQuantity,
  totalPrice,
  variantLine,
  type CartItem,
} from '../lib/carrito.ts'
import { formatArs } from '../lib/stock.ts'
import { readCart, writeCart } from './carrito-ui.ts'

function paso(kind: 'bajar' | 'subir', glyph: string, label: string, off: boolean): HTMLButtonElement {
  const button = document.createElement('button')
  button.type = 'button'
  button.dataset[kind] = ''
  button.className = `inline-flex size-minimo items-center justify-center texto-etiqueta ${off ? 'text-texto-deshabilitado' : 'text-texto'}`
  button.textContent = glyph
  button.setAttribute('aria-label', label)
  button.setAttribute('aria-disabled', off ? 'true' : 'false')
  return button
}

function fila(item: CartItem): HTMLLIElement {
  const li = document.createElement('li')
  li.dataset.variante = String(item.variantId)
  li.className = 'flex gap-3 border-b border-borde py-3'

  const foto = document.createElement('div')
  foto.className = 'size-[72px] shrink-0 overflow-hidden rounded-chico bg-superficie-hundida'
  if (item.imageUrl) {
    const img = document.createElement('img')
    img.src = item.imageUrl
    img.alt = ''
    img.className = 'size-full object-cover'
    img.addEventListener('error', () => {
      img.remove()
    })
    foto.append(img)
  }

  const datos = document.createElement('div')
  datos.className = 'flex min-w-0 flex-1 flex-col gap-1'

  const nombre = document.createElement('p')
  nombre.className = 'texto-etiqueta text-texto'
  nombre.textContent = item.name

  const linea = document.createElement('p')
  linea.className = 'texto-cuerpo-chico text-texto-secundario'
  linea.textContent = variantLine(item)

  datos.append(nombre, linea)

  const queda = quedaUnoTexto(item)
  if (queda) {
    const aviso = document.createElement('p')
    aviso.className = 'texto-cuerpo-chico text-aviso'
    aviso.textContent = queda
    datos.append(aviso)
  }

  const downOff = item.quantity <= 1
  const upOff = item.quantity >= item.maxStock
  const caja = document.createElement('div')
  caja.className = 'inline-flex items-center rounded-medio border border-borde-control bg-superficie'
  const cantidad = document.createElement('span')
  cantidad.className = 'min-w-8 text-center texto-etiqueta text-texto tabular-nums'
  cantidad.textContent = String(item.quantity)
  caja.append(
    paso('bajar', '−', `Bajar cantidad de ${item.name}`, downOff),
    cantidad,
    paso('subir', '+', `Subir cantidad de ${item.name}`, upOff),
  )
  caja.setAttribute('aria-label', `Cantidad de ${item.name}`)

  const precio = document.createElement('p')
  precio.className = 'texto-precio text-texto'
  precio.textContent = formatArs(item.unitPrice)

  const controles = document.createElement('div')
  controles.className = 'flex items-center justify-between gap-3'
  controles.append(caja, precio)

  const quitar = document.createElement('button')
  quitar.type = 'button'
  quitar.dataset.quitar = ''
  quitar.className = 'inline-flex min-h-minimo items-center self-start texto-etiqueta text-acento'
  quitar.textContent = 'Quitar'
  quitar.setAttribute('aria-label', `Quitar ${item.name}`)

  datos.append(controles, quitar)
  li.append(foto, datos)
  return li
}

export function initPaginaCarrito(): void {
  const root = document.querySelector<HTMLElement>('[data-carrito-pagina]')
  if (!root) return

  const vacio = root.querySelector<HTMLElement>('[data-vacio]')
  const lleno = root.querySelector<HTMLElement>('[data-lleno]')
  const lista = root.querySelector<HTMLElement>('[data-lista]')
  const total = root.querySelector<HTMLElement>('[data-total]')
  const barra = document.querySelector<HTMLElement>('[data-carrito-barra]')
  if (!vacio || !lleno || !lista || !total) return

  function pintar(): void {
    const cart = readCart()
    const hay = cart.items.length > 0
    vacio.hidden = hay
    lleno.hidden = !hay
    if (barra) barra.hidden = !hay
    total.textContent = formatArs(totalPrice(cart))
    lista.replaceChildren(...cart.items.map((item) => fila(item)))
  }

  lista.addEventListener('click', (event) => {
    const target = event.target
    if (!(target instanceof Element)) return
    const row = target.closest<HTMLElement>('[data-variante]')
    if (!row) return
    const variantId = Number(row.dataset.variante)
    if (!Number.isInteger(variantId)) return

    const cart = readCart()
    const item = cart.items.find((entry) => entry.variantId === variantId)
    if (!item) return

    if (target.closest('[data-quitar]')) {
      writeCart(removeItem(cart, variantId))
      return
    }
    if (target.closest('[data-bajar]')) {
      if (item.quantity <= 1) return
      writeCart(setQuantity(cart, variantId, item.quantity - 1))
      return
    }
    if (target.closest('[data-subir]')) {
      if (item.quantity >= item.maxStock) return
      writeCart(setQuantity(cart, variantId, item.quantity + 1))
    }
  })

  window.addEventListener('carrito-cambio', pintar)
  window.addEventListener('storage', (event) => {
    if (event.key !== null && event.key !== CART_KEY) return
    pintar()
  })
  pintar()
}
