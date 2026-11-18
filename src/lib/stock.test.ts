import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import {
  availableColors,
  availableSizes,
  formatArs,
  maxQuantity,
  productStatus,
  quedaUna,
  stockFor,
  totalStock,
  variantPrice,
  type StockProduct,
  type StockVariant,
} from './stock.ts'

function variant(partial: StockVariant): StockVariant {
  return partial
}

const body: StockProduct = {
  base_price: 18900,
  pieza_unica: false,
  product_variants: [
    variant({ size: '0-3 m', color: 'Crudo', color_hex: '#F4E1C1', stock_quantity: 4, price: null }),
    variant({ size: '3-6 m', color: 'Rosa viejo', color_hex: '#C47A8A', stock_quantity: 1, price: 19900 }),
    variant({ size: '6-9 m', color: 'Rosa viejo', color_hex: '#C47A8A', stock_quantity: 0, price: null }),
    variant({ size: '9-12 m', color: 'Celeste', color_hex: '#9EC3E6', stock_quantity: 3, price: null }),
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
    variant({ size: '3-6 m', color: 'Gris', stock_quantity: 0, price: null }),
  ],
}

const bordado: StockProduct = {
  base_price: 32000,
  pieza_unica: true,
  product_variants: [
    variant({ size: '3-6 m', color: 'Verde salvia', stock_quantity: 1, price: null }),
  ],
}

describe('talles y colores con stock', () => {
  it('lista talles con stock y omite el agotado', () => {
    assert.deepEqual(availableSizes(body), ['0-3 m', '3-6 m', '9-12 m'])
    assert.deepEqual(availableSizes(gorrito), ['Talle único'])
    assert.deepEqual(availableSizes(manta), [])
  })

  it('lista colores con stock, sin repetir, y filtra por talle', () => {
    assert.deepEqual(availableColors(body), ['Crudo', 'Rosa viejo', 'Celeste'])
    assert.deepEqual(availableColors(body, '3-6 m'), ['Rosa viejo'])
    assert.deepEqual(availableColors(body, '6-9 m'), [])
    assert.deepEqual(availableColors(body, 'no existe'), [])
  })

  it('no repite un talle que aparece dos veces con stock', () => {
    const product: StockProduct = {
      base_price: 1000,
      pieza_unica: false,
      product_variants: [
        variant({ size: '0-3 m', color: 'Crudo', stock_quantity: 1 }),
        variant({ size: '0-3 m', color: 'Rosa', stock_quantity: 2 }),
      ],
    }
    assert.deepEqual(availableSizes(product), ['0-3 m'])
    assert.deepEqual(availableColors(product, '0-3 m'), ['Crudo', 'Rosa'])
  })
})

describe('stock de un talle y un color', () => {
  it('devuelve el stock de la combinación y 0 si no existe', () => {
    assert.equal(stockFor(body, '3-6 m', 'Rosa viejo'), 1)
    assert.equal(stockFor(body, '6-9 m', 'Rosa viejo'), 0)
    assert.equal(stockFor(body, '0-3 m', 'Celeste'), 0)
    assert.equal(stockFor(gorrito, 'Talle único', 'Natural'), 5)
  })

  it('suma si hubiera dos variantes con el mismo talle y color', () => {
    const product: StockProduct = {
      base_price: 1000,
      pieza_unica: false,
      product_variants: [
        variant({ size: '0-3 m', color: 'Crudo', stock_quantity: 1 }),
        variant({ size: '0-3 m', color: 'Crudo', stock_quantity: 2 }),
      ],
    }
    assert.equal(stockFor(product, '0-3 m', 'Crudo'), 3)
  })

  it('el máximo para comprar es el stock de la variante', () => {
    assert.equal(maxQuantity(body.product_variants[0]), 4)
    assert.equal(maxQuantity(body.product_variants[2]), 0)
    assert.equal(maxQuantity(bordado.product_variants[0]), 1)
  })
})

describe('precio', () => {
  it('usa el precio de la variante y, si es null, el base_price', () => {
    assert.equal(variantPrice(body, body.product_variants[1]), 19900)
    assert.equal(variantPrice(body, body.product_variants[0]), 18900)
    assert.equal(variantPrice(gorrito, gorrito.product_variants[0]), 7500)
  })

  it('un precio 0 de la variante no cae al precio del producto', () => {
    const gratis = variant({ size: '0-3 m', color: 'Crudo', stock_quantity: 1, price: 0 })
    assert.equal(variantPrice(body, gratis), 0)
  })
})

describe('estado', () => {
  it('clasifica los cuatro productos de la semilla', () => {
    assert.equal(productStatus(bordado), 'pieza-unica')
    assert.equal(productStatus(body), 'disponible')
    assert.equal(productStatus(gorrito), 'disponible')
    assert.equal(productStatus(manta), 'sin-stock')
  })

  it('marca queda 1 solo en la variante con una unidad', () => {
    assert.deepEqual(body.product_variants.map(quedaUna), [null, 'queda 1', null, null])
    assert.equal(quedaUna(bordado.product_variants[0]), 'queda 1')
    assert.equal(quedaUna(gorrito.product_variants[0]), null)
    assert.equal(quedaUna(manta.product_variants[0]), null)
  })

  it('ultima-unidad es el total 1, y pieza única gana aunque el stock sea 0 o 1', () => {
    const una: StockProduct = {
      base_price: 1000,
      pieza_unica: false,
      product_variants: [variant({ size: '0-3 m', color: 'Crudo', stock_quantity: 1 })],
    }
    assert.equal(totalStock(una), 1)
    assert.equal(productStatus(una), 'ultima-unidad')

    const piezaSinStock: StockProduct = {
      base_price: 1000,
      pieza_unica: true,
      product_variants: [variant({ size: '0-3 m', color: 'Crudo', stock_quantity: 0 })],
    }
    assert.equal(productStatus(piezaSinStock), 'pieza-unica')
    assert.equal(productStatus(bordado), 'pieza-unica')
  })

  it('sin variantes o todo en cero es sin-stock', () => {
    assert.equal(productStatus({ base_price: 1, pieza_unica: false, product_variants: [] }), 'sin-stock')
    assert.equal(totalStock(manta), 0)
    assert.equal(productStatus(manta), 'sin-stock')
  })
})

describe('formatArs', () => {
  it('formatea pesos sin centavos con el separador de es-AR', () => {
    assert.equal(formatArs(18900), '$\u00a018.900')
    assert.equal(formatArs(7500), '$\u00a07.500')
    assert.equal(formatArs(0), '$\u00a00')
    assert.equal(formatArs(1234567), '$\u00a01.234.567')
  })

  it('no muestra centavos', () => {
    assert.equal(formatArs(18900.4), '$\u00a018.900')
    assert.equal(formatArs(18900.6), '$\u00a018.901')
  })
})
