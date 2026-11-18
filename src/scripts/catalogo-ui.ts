/**
 * Arma la búsqueda y el panel del catálogo en el navegador.
 * Con la query vacía deja la grilla que vino del build.
 */

import { prendasLabel } from '../lib/catalog.ts'
import {
  applyCatalog,
  availableFacets,
  emptyCatalogQuery,
  isCatalogQueryActive,
  isCatalogSort,
  parseCatalogQuery,
  serializeCatalogQuery,
  type CatalogCategorySource,
  type CatalogItem,
  type CatalogQuery,
  type CatalogSort,
} from '../lib/filters.ts'

const ORDENES: { id: CatalogSort, label: string }[] = [
  { id: 'mas-nuevos', label: 'Más nuevos' },
  { id: 'menor-precio', label: 'Menor precio' },
  { id: 'mayor-precio', label: 'Mayor precio' },
]

interface Payload {
  items: CatalogItem[]
  categories: CatalogCategorySource[]
}

interface Draft {
  categorias: string[]
  talles: string[]
  colores: string[]
  orden: CatalogSort
}

const CHIP = 'inline-flex min-h-minimo items-center gap-2 rounded-pastilla border px-3 texto-cuerpo'
const CHIP_ON = `${CHIP} border-acento bg-acento text-acento-texto`
const CHIP_OFF = `${CHIP} border-borde-control bg-superficie text-texto`

function ordenLabel(orden: CatalogSort): string {
  return ORDENES.find((entry) => entry.id === orden)?.label ?? 'Más nuevos'
}

function hexOrNull(value: string | null): string | null {
  return value && /^#[0-9A-Fa-f]{6}$/.test(value) ? value : null
}

function swatch(hex: string | null): HTMLSpanElement {
  const span = document.createElement('span')
  span.className = 'size-4 shrink-0 rounded-chico border border-borde'
  span.setAttribute('aria-hidden', 'true')
  const safe = hexOrNull(hex)
  if (safe) span.style.backgroundColor = safe
  else span.classList.add('bg-superficie-hundida')
  return span
}

function focusable(root: ParentNode): HTMLElement[] {
  const nodes = root.querySelectorAll<HTMLElement>('button, a[href], input, select, textarea')
  return [...nodes].filter((node) => !node.hidden && node.getAttribute('tabindex') !== '-1' && !node.hasAttribute('disabled'))
}

export function initCatalogo(): void {
  const root = document.querySelector<HTMLElement>('[data-catalogo]')
  if (!root || root.dataset.listo === '1') return

  const datos = document.getElementById('catalogo-datos')
  const input = root.querySelector<HTMLInputElement>('[data-buscar]')
  const server = root.querySelector<HTMLElement>('[data-servidor]')
  const client = root.querySelector<HTMLElement>('[data-cliente]')
  const chips = root.querySelector<HTMLElement>('[data-chips]')
  const chipList = root.querySelector<HTMLElement>('[data-chips-lista]')
  const count = root.querySelector<HTMLElement>('[data-cuenta]')
  const gridWrap = root.querySelector<HTMLElement>('[data-grilla-wrap]')
  const grid = root.querySelector<HTMLElement>('[data-grilla]')
  const empty = root.querySelector<HTMLElement>('[data-vacio]')
  const openButton = root.querySelector<HTMLButtonElement>('[data-abrir]')
  const panel = root.querySelector<HTMLElement>('[data-panel]')
  const dialog = root.querySelector<HTMLElement>('#catalogo-dialog')
  const options = root.querySelector<HTMLElement>('[data-opciones]')
  const applyButton = root.querySelector<HTMLButtonElement>('[data-aplicar]')
  const closeButton = root.querySelector<HTMLButtonElement>('[data-cerrar]')
  const template = root.querySelector<HTMLTemplateElement>('[data-tarjetas]')

  if (!datos?.textContent || !input || !server || !client || !chips || !chipList || !count || !gridWrap || !grid || !empty || !openButton || !panel || !dialog || !options || !applyButton || !closeButton || !template) {
    return
  }

  let payload: Payload
  try {
    payload = JSON.parse(datos.textContent) as Payload
  } catch {
    return
  }
  if (!Array.isArray(payload.items) || !Array.isArray(payload.categories)) return

  root.dataset.listo = '1'

  const items = payload.items
  const categories = payload.categories
  const facets = availableFacets(items)
  const cards = new Map<string, HTMLAnchorElement>()
  for (const holder of template.content.querySelectorAll<HTMLElement>('[data-slug]')) {
    const slug = holder.dataset.slug
    const link = holder.querySelector('a')
    if (slug && link) cards.set(slug, link)
  }

  let searchPushed = false
  let draft: Draft = { categorias: [], talles: [], colores: [], orden: 'mas-nuevos' }

  function draftQuery(): CatalogQuery {
    return {
      q: input.value,
      categorias: [...draft.categorias],
      talles: [...draft.talles],
      colores: [...draft.colores],
      orden: draft.orden,
    }
  }

  function writeQuery(query: CatalogQuery, mode: 'search' | 'push'): void {
    const next = serializeCatalogQuery(query)
    if (next === location.search) return
    const url = `${location.pathname}${next}${location.hash}`
    if (mode === 'search' && searchPushed) history.replaceState(null, '', url)
    else history.pushState(null, '', url)
    searchPushed = mode === 'search'
  }

  function paintChips(query: CatalogQuery): void {
    const entries: { tipo: string, valor: string, label: string }[] = []
    for (const slug of query.categorias) {
      const category = categories.find((entry) => entry.slug === slug)
      entries.push({ tipo: 'categoria', valor: slug, label: category?.name || slug })
    }
    for (const size of query.talles) entries.push({ tipo: 'talle', valor: size, label: size })
    for (const color of query.colores) entries.push({ tipo: 'color', valor: color, label: color })
    if (query.orden !== 'mas-nuevos') {
      entries.push({ tipo: 'orden', valor: query.orden, label: ordenLabel(query.orden) })
    }

    chipList.replaceChildren()
    if (entries.length === 0) {
      chips.hidden = true
      return
    }

    for (const entry of entries) {
      const button = document.createElement('button')
      button.type = 'button'
      button.className = 'inline-flex min-h-minimo items-center gap-2 rounded-pastilla border border-borde-control bg-superficie px-3 texto-cuerpo text-texto'
      button.dataset.chip = entry.tipo
      button.dataset.valor = entry.valor
      button.setAttribute('aria-label', `Quitar ${entry.label}`)
      const name = document.createElement('span')
      name.textContent = entry.label
      const mark = document.createElement('span')
      mark.setAttribute('aria-hidden', 'true')
      mark.className = 'text-texto-secundario'
      mark.textContent = '×'
      button.append(name, mark)
      chipList.append(button)
    }

    const clear = document.createElement('button')
    clear.type = 'button'
    clear.className = 'inline-flex min-h-minimo items-center px-2 texto-etiqueta text-texto'
    clear.dataset.limpiar = 'chips'
    clear.textContent = 'Limpiar'
    chipList.append(clear)
    chips.hidden = false
  }

  function render(query: CatalogQuery): void {
    if (!isCatalogQueryActive(query)) {
      server.hidden = false
      client.hidden = true
      chips.hidden = true
      chipList.replaceChildren()
      grid.replaceChildren()
      return
    }

    server.hidden = true
    client.hidden = false
    const results = applyCatalog(items, query)
    count.textContent = prendasLabel(results.length)
    paintChips(query)

    if (results.length === 0) {
      gridWrap.hidden = true
      grid.replaceChildren()
      empty.hidden = false
      return
    }

    empty.hidden = true
    gridWrap.hidden = false
    const fragment = document.createDocumentFragment()
    for (const item of results) {
      const card = cards.get(item.slug)
      if (!card) continue
      const li = document.createElement('li')
      li.className = 'min-w-0'
      li.append(card.cloneNode(true))
      fragment.append(li)
    }
    grid.replaceChildren(fragment)
  }

  function updateCount(): void {
    const total = applyCatalog(items, draftQuery()).length
    applyButton.textContent = `Ver ${prendasLabel(total)}`
  }

  function setSelected(button: HTMLElement, selected: boolean, radio: boolean): void {
    button.className = selected ? CHIP_ON : CHIP_OFF
    if (radio) button.setAttribute('aria-checked', selected ? 'true' : 'false')
    else button.setAttribute('aria-pressed', selected ? 'true' : 'false')
  }

  function optionButton(label: string, tipo: string, valor: string, selected: boolean, radio: boolean): HTMLButtonElement {
    const button = document.createElement('button')
    button.type = 'button'
    button.dataset.tipo = tipo
    button.dataset.valor = valor
    button.className = selected ? CHIP_ON : CHIP_OFF
    if (radio) {
      button.setAttribute('role', 'radio')
      button.setAttribute('aria-checked', selected ? 'true' : 'false')
    } else {
      button.setAttribute('aria-pressed', selected ? 'true' : 'false')
    }
    button.append(document.createTextNode(label))
    return button
  }

  function paintOptions(): void {
    options.replaceChildren()

    const sections: { titulo: string, tipo: string, choices: { valor: string, label: string, hex?: string | null }[] }[] = []
    if (categories.length > 0) {
      sections.push({
        titulo: 'Categoría',
        tipo: 'categoria',
        choices: categories.map((category) => ({
          valor: category.slug,
          label: category.name,
        })),
      })
    }
    if (facets.talles.length > 0) {
      sections.push({
        titulo: 'Talle',
        tipo: 'talle',
        choices: facets.talles.map((size) => ({ valor: size, label: size })),
      })
    }
    if (facets.colores.length > 0) {
      sections.push({
        titulo: 'Color',
        tipo: 'color',
        choices: facets.colores.map((color) => ({ valor: color.name, label: color.name, hex: color.hex })),
      })
    }

    for (const section of sections) {
      const block = document.createElement('section')
      block.className = 'flex flex-col gap-2'
      const title = document.createElement('p')
      title.className = 'texto-etiqueta text-texto'
      title.textContent = section.titulo
      const group = document.createElement('div')
      group.className = 'flex flex-wrap gap-2'
      group.setAttribute('role', 'group')
      group.setAttribute('aria-label', section.titulo)
      for (const choice of section.choices) {
        const selected = section.tipo === 'categoria'
          ? draft.categorias.includes(choice.valor)
          : section.tipo === 'talle'
            ? draft.talles.includes(choice.valor)
            : draft.colores.includes(choice.valor)
        const button = optionButton(choice.label, section.tipo, choice.valor, selected, false)
        if (section.tipo === 'color') button.prepend(swatch(choice.hex ?? null))
        group.append(button)
      }
      block.append(title, group)
      options.append(block)
    }

    const sortBlock = document.createElement('section')
    sortBlock.className = 'flex flex-col gap-2'
    const sortTitle = document.createElement('p')
    sortTitle.className = 'texto-etiqueta text-texto'
    sortTitle.textContent = 'Ordenar'
    const sortGroup = document.createElement('div')
    sortGroup.className = 'flex flex-wrap gap-2'
    sortGroup.setAttribute('role', 'radiogroup')
    sortGroup.setAttribute('aria-label', 'Ordenar')
    for (const orden of ORDENES) {
      sortGroup.append(optionButton(orden.label, 'orden', orden.id, draft.orden === orden.id, true))
    }
    sortBlock.append(sortTitle, sortGroup)
    options.append(sortBlock)
  }

  function lockPage(locked: boolean): void {
    document.documentElement.classList.toggle('overflow-hidden', locked)
    document.body.classList.toggle('overflow-hidden', locked)
  }

  function closePanel(): void {
    const wasOpen = !panel.hidden
    panel.hidden = true
    lockPage(false)
    openButton.setAttribute('aria-expanded', 'false')
    if (wasOpen) openButton.focus()
  }

  function openPanel(): void {
    const query = parseCatalogQuery(location.search)
    draft = {
      categorias: [...query.categorias],
      talles: [...query.talles],
      colores: [...query.colores],
      orden: query.orden,
    }
    paintOptions()
    updateCount()
    panel.hidden = false
    lockPage(true)
    openButton.setAttribute('aria-expanded', 'true')
    closeButton.focus()
  }

  function choose(button: HTMLButtonElement): void {
    const tipo = button.dataset.tipo
    const valor = button.dataset.valor
    if (!tipo || !valor) return

    if (tipo === 'orden') {
      if (!isCatalogSort(valor)) return
      draft.orden = valor
      const group = button.closest('[role="radiogroup"]')
      for (const radio of group?.querySelectorAll<HTMLElement>('[role="radio"]') ?? []) {
        setSelected(radio, radio.dataset.valor === valor, true)
      }
    } else if (tipo === 'categoria') {
      draft.categorias = draft.categorias.includes(valor)
        ? draft.categorias.filter((entry) => entry !== valor)
        : [...draft.categorias, valor]
      setSelected(button, draft.categorias.includes(valor), false)
    } else if (tipo === 'talle') {
      draft.talles = draft.talles.includes(valor)
        ? draft.talles.filter((entry) => entry !== valor)
        : [...draft.talles, valor]
      setSelected(button, draft.talles.includes(valor), false)
    } else if (tipo === 'color') {
      draft.colores = draft.colores.includes(valor)
        ? draft.colores.filter((entry) => entry !== valor)
        : [...draft.colores, valor]
      setSelected(button, draft.colores.includes(valor), false)
    }
    updateCount()
  }

  root.querySelector('[data-buscar-form]')?.addEventListener('submit', (event) => {
    event.preventDefault()
  })

  input.addEventListener('input', () => {
    const query = parseCatalogQuery(location.search)
    query.q = input.value
    writeQuery(query, 'search')
    render(parseCatalogQuery(location.search))
    if (!panel.hidden) updateCount()
  })

  openButton.addEventListener('click', () => {
    if (panel.hidden) openPanel()
    else closePanel()
  })

  closeButton.addEventListener('click', () => {
    closePanel()
  })

  root.querySelector('[data-fondo]')?.addEventListener('click', () => {
    closePanel()
  })

  root.querySelector('[data-limpiar-panel]')?.addEventListener('click', () => {
    draft = { categorias: [], talles: [], colores: [], orden: 'mas-nuevos' }
    paintOptions()
    updateCount()
  })

  applyButton.addEventListener('click', () => {
    const query = draftQuery()
    writeQuery(query, 'push')
    render(parseCatalogQuery(location.search))
    closePanel()
  })

  chipList.addEventListener('click', (event) => {
    const button = (event.target as Element | null)?.closest('button')
    if (!button || !chipList.contains(button)) return
    const query = parseCatalogQuery(location.search)
    if (button.dataset.limpiar === 'chips') {
      query.categorias = []
      query.talles = []
      query.colores = []
      query.orden = 'mas-nuevos'
    } else if (button.dataset.chip === 'categoria') {
      query.categorias = query.categorias.filter((entry) => entry !== button.dataset.valor)
    } else if (button.dataset.chip === 'talle') {
      query.talles = query.talles.filter((entry) => entry !== button.dataset.valor)
    } else if (button.dataset.chip === 'color') {
      query.colores = query.colores.filter((entry) => entry !== button.dataset.valor)
    } else if (button.dataset.chip === 'orden') {
      query.orden = 'mas-nuevos'
    } else {
      return
    }
    writeQuery(query, 'push')
    render(parseCatalogQuery(location.search))
    const next = chipList.querySelector('button')
    if (next instanceof HTMLElement) next.focus()
    else input.focus()
  })

  root.querySelector('[data-limpiar-todo]')?.addEventListener('click', () => {
    input.value = ''
    writeQuery(emptyCatalogQuery(), 'push')
    render(emptyCatalogQuery())
    input.focus()
  })

  options.addEventListener('click', (event) => {
    const button = (event.target as Element | null)?.closest('button')
    if (button instanceof HTMLButtonElement && options.contains(button)) choose(button)
  })

  dialog.addEventListener('keydown', (event) => {
    if (event.key !== 'Tab') {
      const button = (event.target as Element | null)?.closest('[role="radio"]')
      if (!(button instanceof HTMLButtonElement)) return
      if (event.key !== 'ArrowRight' && event.key !== 'ArrowDown' && event.key !== 'ArrowLeft' && event.key !== 'ArrowUp') return
      const radios = [...(button.closest('[role="radiogroup"]')?.querySelectorAll<HTMLButtonElement>('[role="radio"]') ?? [])]
      const index = radios.indexOf(button)
      if (index < 0 || radios.length === 0) return
      const delta = event.key === 'ArrowRight' || event.key === 'ArrowDown' ? 1 : -1
      const next = radios[(index + delta + radios.length) % radios.length]
      event.preventDefault()
      next.focus()
      choose(next)
      return
    }

    const nodes = focusable(dialog)
    if (nodes.length === 0) return
    const first = nodes[0]
    const last = nodes[nodes.length - 1]
    const active = document.activeElement
    if (event.shiftKey && (active === first || !dialog.contains(active))) {
      event.preventDefault()
      last.focus()
    } else if (!event.shiftKey && active === last) {
      event.preventDefault()
      first.focus()
    }
  })

  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && !panel.hidden) {
      event.preventDefault()
      closePanel()
    }
  })

  window.addEventListener('popstate', () => {
    searchPushed = false
    const wasOpen = !panel.hidden
    panel.hidden = true
    lockPage(false)
    openButton.setAttribute('aria-expanded', 'false')
    const query = parseCatalogQuery(location.search)
    input.value = query.q
    render(query)
    if (wasOpen) openButton.focus()
  })

  const initial = parseCatalogQuery(location.search)
  input.value = initial.q
  render(initial)
}
