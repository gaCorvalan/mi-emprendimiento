import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import {
  PAGE_SIZE,
  cardView,
  catalogPagePath,
  pageSlice,
  prendasLabel,
  showingLabel,
  type CardView,
} from './catalog.ts'
import { formatArs, type StockProduct, type StockVariant } from './stock.ts'

function variant(partial: StockVariant): StockVariant {
  return partial
}

const body: StockProduct = {
  base_price: 18900,
  pieza_unica: false,
  product_variants: [
    variant({ size: '0-3 m', color: 'Crudo', stock_quantity: 4, price: null }),
    variant({ size: '3-6 m', color: 'Rosa viejo', stock_quantity: 1, price: 19900 }),
    variant({ size: '6-9 m', color: 'Rosa viejo', stock_quantity: 0, price: null }),
  ],
}

const gorrito: StockProduct = {
  base_price: 7500,
  pieza_unica: false,
  product_variants: [
    variant({ size: 'Talle único', color: 'Natural', stock_quantity: 5, price: null }),
  ],
}

const manta: StockProduct = {
  base_price: 24000,
  pieza_unica: false,
  product_variants: [
    variant({ size: '0-3 m', color: 'Gris', stock_quantity: 0, price: null }),
    variant({ size: '3-6 m', color: 'Gris', stock_quantity: 0, price: 22000 }),
  ],
}

const bordado: StockProduct = {
  base_price: 32000,
  pieza_unica: true,
  product_variants: [
    variant({ size: '3-6 m', color: 'Verde salvia', stock_quantity: 1, price: null }),
  ],
}

function labelOf(product: StockProduct): CardView['label'] {
  return cardView(product).label
}

describe('precio de la tarjeta', () => {
  it('usa el menor y antepone desde solo si las variantes no cuestan lo mismo', () => {
    assert.equal(cardView(body).priceText, `desde ${formatArs(18900)}`)
    assert.equal(cardView(body).priceMuted, false)
  })

  it('no antepone desde si todas salen igual, aunque el precio de la variante sea null', () => {
    assert.equal(cardView(gorrito).priceText, formatArs(7500))
    const nulos: StockProduct = {
      base_price: 18900,
      pieza_unica: false,
      product_variants: [
        variant({ size: '0-3 m', color: 'Crudo', stock_quantity: 2, price: null }),
        variant({ size: '3-6 m', color: 'Rosa', stock_quantity: 3, price: null }),
      ],
    }
    assert.equal(cardView(nulos).priceText, formatArs(18900))
    assert.equal(cardView(nulos).label, null)
  })

  it('un precio 0 de la variante puede ser el menor y no cae al base_price', () => {
    const product: StockProduct = {
      base_price: 1000,
      pieza_unica: false,
      product_variants: [
        variant({ size: '0-3 m', color: 'Crudo', stock_quantity: 2, price: 0 }),
        variant({ size: '3-6 m', color: 'Rosa', stock_quantity: 2, price: 1000 }),
      ],
    }
    assert.equal(cardView(product).priceText, `desde ${formatArs(0)}`)
  })

  it('sin variantes muestra el base_price, sin desde', () => {
    const product: StockProduct = { base_price: 5000, pieza_unica: false, product_variants: [] }
    assert.equal(cardView(product).priceText, formatArs(5000))
  })

  it('sin stock también usa el menor si los precios difieren, y el precio queda apagado', () => {
    const view = cardView(manta)
    assert.equal(view.label, 'SIN STOCK')
    assert.equal(view.priceMuted, true)
    assert.equal(view.priceText, `desde ${formatArs(22000)}`)
  })
})

describe('etiqueta de la tarjeta', () => {
  it('elige la palabra según el estado, y disponible no lleva etiqueta', () => {
    assert.equal(labelOf(bordado), 'PIEZA ÚNICA')
    assert.equal(labelOf(gorrito), null)
    assert.equal(labelOf(manta), 'SIN STOCK')
    assert.equal(cardView(bordado).priceMuted, false)
    assert.equal(cardView(gorrito).priceMuted, false)
  })

  it('última unidad es el total 1, y pieza única gana aunque quede una sola', () => {
    const una: StockProduct = {
      base_price: 1500,
      pieza_unica: false,
      product_variants: [
        variant({ size: '0-3 m', color: 'Crudo', stock_quantity: 1, price: 1500 }),
      ],
    }
    const view = cardView(una)
    assert.equal(view.label, 'ÚLTIMA UNIDAD')
    assert.equal(view.priceText, formatArs(1500))
    assert.equal(view.priceMuted, false)
    assert.equal(labelOf(bordado), 'PIEZA ÚNICA')
  })
})

describe('textos del catálogo', () => {
  it('cuenta prendas y arma la línea de la página', () => {
    assert.equal(prendasLabel(0), '0 prendas')
    assert.equal(prendasLabel(1), '1 prenda')
    assert.equal(prendasLabel(4), '4 prendas')
    assert.equal(prendasLabel(50), '50 prendas')
    assert.equal(showingLabel(4, 8), 'Mostrando 4 de 8')
    assert.equal(showingLabel(24, 50), 'Mostrando 24 de 50')
    assert.equal(showingLabel(2, 50), 'Mostrando 2 de 50')
  })
})

describe('páginas', () => {
  const cincuenta = Array.from({ length: 50 }, (_, index) => index)

  it('la primera página es el inicio y el resto va en /pagina/n', () => {
    assert.equal(PAGE_SIZE, 24)
    assert.equal(catalogPagePath(1), '/')
    assert.equal(catalogPagePath(0), '/')
    assert.equal(catalogPagePath(2), '/pagina/2')
    assert.equal(catalogPagePath(3), '/pagina/3')
  })

  it('parte 50 prendas en tres páginas de 24', () => {
    const primera = pageSlice(cincuenta, 1)
    assert.equal(primera.shown, 24)
    assert.equal(primera.total, 50)
    assert.equal(primera.currentPage, 1)
    assert.equal(primera.lastPage, 3)
    assert.equal(primera.prev, undefined)
    assert.equal(primera.next, '/pagina/2')
    assert.deepEqual(primera.data, cincuenta.slice(0, 24))

    const segunda = pageSlice(cincuenta, 2)
    assert.equal(segunda.shown, 24)
    assert.equal(segunda.prev, '/')
    assert.equal(segunda.next, '/pagina/3')
    assert.deepEqual(segunda.data, cincuenta.slice(24, 48))

    const tercera = pageSlice(cincuenta, 3)
    assert.equal(tercera.shown, 2)
    assert.equal(tercera.prev, '/pagina/2')
    assert.equal(tercera.next, undefined)
    assert.equal(showingLabel(tercera.shown, tercera.total), 'Mostrando 2 de 50')
  })

  it('un catálogo chico entra en una sola página, sin anterior ni siguiente', () => {
    const cuatro = pageSlice([1, 2, 3, 4], 1)
    assert.equal(cuatro.shown, 4)
    assert.equal(cuatro.lastPage, 1)
    assert.equal(cuatro.prev, undefined)
    assert.equal(cuatro.next, undefined)
    assert.equal(showingLabel(cuatro.shown, cuatro.total), 'Mostrando 4 de 4')
  })

  it('un catálogo vacío es una página vacía', () => {
    const vacio = pageSlice([], 1)
    assert.equal(vacio.shown, 0)
    assert.equal(vacio.total, 0)
    assert.equal(vacio.currentPage, 1)
    assert.equal(vacio.lastPage, 1)
    assert.equal(vacio.next, undefined)
  })

  it('un número de página fuera de rango cae en la primera o la última', () => {
    assert.equal(pageSlice(cincuenta, 0).currentPage, 1)
    assert.equal(pageSlice(cincuenta, 9).currentPage, 3)
    assert.equal(pageSlice(cincuenta, 9).shown, 2)
  })
})
