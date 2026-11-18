/**
 * Talle, color y cantidad en la ficha. No guarda el carrito:
 * al agregar dispara `agregar-al-carrito` y no hace nada más.
 */

import {
  addButtonLabel,
  addToCartDetail,
  canAdd,
  clampQuantity,
  colorChoices,
  initialSelection,
  priceMuted,
  priceText,
  quantityCap,
  quedaUnoTexto,
  showChooseHint,
  stepperMuted,
  sizeChoices,
  type PrendaProduct,
  type Selection,
} from '../lib/prenda.ts'

function optionClass(enabled: boolean, selected: boolean): string {
  const base = 'inline-flex min-h-minimo items-center justify-center gap-2 rounded-medio px-3 texto-etiqueta'
  if (!enabled) return `${base} bg-superficie-hundida text-texto-deshabilitado`
  if (selected) return `${base} bg-acento text-acento-texto`
  return `${base} border border-borde-control bg-superficie text-texto`
}

function paintChoices(
  buttons: NodeListOf<HTMLButtonElement>,
  enabled: Map<string, boolean>,
  selected: string | null,
): void {
  for (const button of buttons) {
    const value = button.dataset.valor ?? ''
    const isEnabled = enabled.get(value) === true
    const isSelected = selected === value && isEnabled
    button.className = optionClass(isEnabled, isSelected)
    button.setAttribute('aria-pressed', isSelected ? 'true' : 'false')
    if (isEnabled) button.removeAttribute('aria-disabled')
    else button.setAttribute('aria-disabled', 'true')
    button.querySelector('[data-nombre]')?.classList.toggle('line-through', !isEnabled)
  }
}

function sameOriginReferrer(): boolean {
  if (!document.referrer) return false
  try {
    return new URL(document.referrer).origin === location.origin
  } catch {
    return false
  }
}

function bindGallery(root: HTMLElement): void {
  const gallery = root.querySelector<HTMLElement>('[data-galeria]')
  const dots = [...root.querySelectorAll<HTMLButtonElement>('[data-punto]')]
  if (!gallery || dots.length === 0) return

  const mark = (index: number): void => {
    dots.forEach((dot, dotIndex) => {
      const on = dotIndex === index
      dot.setAttribute('aria-current', on ? 'true' : 'false')
      const pip = dot.querySelector('[data-punto-marca]')
      pip?.classList.toggle('bg-texto', on)
      pip?.classList.toggle('bg-borde', !on)
    })
  }

  mark(0)

  dots.forEach((dot, index) => {
    dot.addEventListener('click', () => {
      const slide = gallery.children.item(index)
      if (slide instanceof HTMLElement) slide.scrollIntoView({ inline: 'start', block: 'nearest' })
      mark(index)
    })
  })

  gallery.addEventListener('scroll', () => {
    const width = gallery.clientWidth || 1
    const index = Math.round(gallery.scrollLeft / width)
    mark(Math.min(Math.max(index, 0), dots.length - 1))
  }, { passive: true })
}

export function initPrenda(): void {
  const root = document.querySelector<HTMLElement>('[data-prenda]')
  if (!root) return

  const dataEl = root.querySelector('#prenda-datos')
  if (!dataEl?.textContent) return
  const product = JSON.parse(dataEl.textContent) as PrendaProduct

  let selection: Selection = initialSelection(product)
  let quantity = 1

  const priceEl = root.querySelector<HTMLElement>('[data-precio]')
  const quedaEl = root.querySelector<HTMLElement>('[data-queda]')
  const countEl = root.querySelector<HTMLElement>('[data-cantidad]')
  const down = root.querySelector<HTMLButtonElement>('[data-bajar]')
  const up = root.querySelector<HTMLButtonElement>('[data-subir]')
  const add = root.querySelector<HTMLButtonElement>('[data-agregar]')
  const hint = root.querySelector<HTMLElement>('[data-ayuda]')
  const sizeButtons = root.querySelectorAll<HTMLButtonElement>('[data-talle]')
  const colorButtons = root.querySelectorAll<HTMLButtonElement>('[data-color]')

  function paint(): void {
    const sizes = new Map(sizeChoices(product, selection).map((choice) => [choice.value, choice.enabled]))
    const colors = new Map(colorChoices(product, selection).map((choice) => [choice.value, choice.enabled]))
    paintChoices(sizeButtons, sizes, selection.size)
    paintChoices(colorButtons, colors, selection.color)

    const cap = quantityCap(product, selection)
    quantity = clampQuantity(quantity, cap)

    if (priceEl) {
      priceEl.textContent = priceText(product, selection)
      priceEl.classList.toggle('text-texto-secundario', priceMuted(product, selection))
      priceEl.classList.toggle('text-texto', !priceMuted(product, selection))
    }

    if (quedaEl) quedaEl.hidden = quedaUnoTexto(product, selection) === null
    if (countEl) {
      countEl.textContent = String(quantity)
      const muted = stepperMuted(product)
      countEl.classList.toggle('text-texto-deshabilitado', muted)
      countEl.classList.toggle('text-texto', !muted)
    }

    const off = stepperMuted(product)
    const box = root.querySelector<HTMLElement>('[data-cantidad-caja]')
    if (box) {
      box.classList.toggle('bg-superficie-hundida', off)
      box.classList.toggle('border-borde', off)
      box.classList.toggle('bg-superficie', !off)
      box.classList.toggle('border-borde-control', !off)
    }

    const downOff = off || quantity <= 1
    const upOff = off || cap <= 0 || quantity >= cap
    if (down) {
      down.setAttribute('aria-disabled', downOff ? 'true' : 'false')
      down.classList.toggle('text-texto-deshabilitado', downOff)
      down.classList.toggle('text-texto', !downOff)
    }
    if (up) {
      up.setAttribute('aria-disabled', upOff ? 'true' : 'false')
      up.classList.toggle('text-texto-deshabilitado', upOff)
      up.classList.toggle('text-texto', !upOff)
    }

    if (add) {
      const ready = canAdd(product, selection)
      add.disabled = !ready
      add.textContent = addButtonLabel(product)
    }
    if (hint) hint.hidden = !showChooseHint(product, selection)
  }

  root.addEventListener('click', (event) => {
    const target = event.target
    if (!(target instanceof Element)) return

    const sizeButton = target.closest<HTMLButtonElement>('[data-talle]')
    if (sizeButton) {
      if (sizeButton.getAttribute('aria-disabled') === 'true') return
      const value = sizeButton.dataset.valor
      if (!value || value === selection.size) return
      selection = { ...selection, size: value }
      quantity = 1
      paint()
      return
    }

    const colorButton = target.closest<HTMLButtonElement>('[data-color]')
    if (colorButton) {
      if (colorButton.getAttribute('aria-disabled') === 'true') return
      const value = colorButton.dataset.valor
      if (!value || value === selection.color) return
      selection = { ...selection, color: value }
      quantity = 1
      paint()
      return
    }

    if (target.closest('[data-bajar]')) {
      if (stepperMuted(product) || quantity <= 1) return
      quantity -= 1
      paint()
      return
    }

    if (target.closest('[data-subir]')) {
      const cap = quantityCap(product, selection)
      if (stepperMuted(product) || cap <= 0 || quantity >= cap) return
      quantity += 1
      paint()
      return
    }

    if (target.closest('[data-agregar]')) {
      const detail = addToCartDetail(product, selection, quantity)
      if (!detail) return
      window.dispatchEvent(new CustomEvent('agregar-al-carrito', { detail }))
    }
  })

  root.querySelector('[data-volver]')?.addEventListener('click', (event) => {
    if (!(event instanceof MouseEvent)) return
    if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return
    if (!sameOriginReferrer()) return
    event.preventDefault()
    history.back()
  })

  bindGallery(root)
  paint()
}
