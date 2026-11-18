import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import { cardView } from './catalog.ts'
import {
  addButtonLabel,
  addToCartDetail,
  canAdd,
  clampQuantity,
  colorChoices,
  findVariant,
  initialSelection,
  isSoldOut,
  priceAmount,
  priceMuted,
  priceText,
  quantityCap,
  quedaUnoTexto,
  showChooseHint,
  sizeChoices,
  type PrendaProduct,
  type PrendaVariant,
  type Selection,
} from './prenda.ts'
import { formatArs } from './stock.ts'

function variant(partial: PrendaVariant): PrendaVariant {
  return partial
}

const body: PrendaProduct = {
  slug: 'body-de-algodon',
  base_price: 18900,
  pieza_unica: false,
  product_variants: [
    variant({ id: 1, size: '0-3 m', color: 'Crudo', color_hex: '#F4E1C1', stock_quantity: 4, price: null }),
    variant({ id: 2, size: '3-6 m', color: 'Rosa viejo', color_hex: '#C47A8A', stock_quantity: 1, price: 19900 }),
    variant({ id: 3, size: '6-9 m', color: 'Rosa viejo', color_hex: '#C47A8A', stock_quantity: 0, price: null }),
    variant({ id: 4, size: '9-12 m', color: 'Celeste', color_hex: '#9EC3E6', stock_quantity: 3, price: null }),
  ],
}

const gorrito: PrendaProduct = {
  slug: 'gorrito',
  base_price: 7500,
  pieza_unica: false,
  product_variants: [
    variant({ id: 5, size: 'Talle único', color: 'Natural', color_hex: '#E6D5C3', stock_quantity: 5, price: null }),
  ],
}

const manta: PrendaProduct = {
  slug: 'manta',
  base_price: 24000,
  pieza_unica: false,
  product_variants: [
    variant({ id: 6, size: '0-3 m', color: 'Gris', color_hex: '#BDBDBD', stock_quantity: 0, price: null }),
    variant({ id: 7, size: '3-6 m', color: 'Gris', color_hex: '#BDBDBD', stock_quantity: 0, price: null }),
  ],
}

const bordado: PrendaProduct = {
  slug: 'body-bordado',
  base_price: 32000,
  pieza_unica: true,
  product_variants: [
    variant({ id: 8, size: '3-6 m', color: 'Verde salvia', color_hex: '#8FA58B', stock_quantity: 1, price: null }),
  ],
}

const none: Selection = { size: null, color: null }

describe('opciones según lo elegido', () => {
  it('lista todos los talles y tacha el que está en cero', () => {
    const sizes = sizeChoices(body, none)
    assert.deepEqual(sizes.map((choice) => choice.value), ['0-3 m', '3-6 m', '6-9 m', '9-12 m'])
    assert.deepEqual(sizes.map((choice) => choice.enabled), [true, true, false, true])
  })

  it('un color elegido tacha los talles que no combinan o no tienen stock', () => {
    const sizes = sizeChoices(body, { size: null, color: 'Rosa viejo' })
    assert.deepEqual(
      sizes.map((choice) => [choice.value, choice.enabled]),
      [
        ['0-3 m', false],
        ['3-6 m', true],
        ['6-9 m', false],
        ['9-12 m', false],
      ],
    )
  })

  it('un talle elegido tacha los colores que no existen para ese talle', () => {
    const colors = colorChoices(body, { size: '0-3 m', color: null })
    assert.deepEqual(
      colors.map((choice) => [choice.value, choice.enabled, choice.colorHex]),
      [
        ['Crudo', true, '#F4E1C1'],
        ['Rosa viejo', false, '#C47A8A'],
        ['Celeste', false, '#9EC3E6'],
      ],
    )
  })

  it('no esconde la combinación que no existe: la deja tachada', () => {
    const colors = colorChoices(body, { size: '9-12 m', color: null })
    assert.equal(colors.find((choice) => choice.value === 'Crudo')?.enabled, false)
    assert.equal(colors.find((choice) => choice.value === 'Celeste')?.enabled, true)
    assert.equal(findVariant(body, '0-3 m', 'Celeste'), null)
  })

  it('elige el único talle y el único color', () => {
    assert.deepEqual(initialSelection(gorrito), { size: 'Talle único', color: 'Natural' })
    assert.deepEqual(initialSelection(bordado), { size: '3-6 m', color: 'Verde salvia' })
    assert.deepEqual(initialSelection(body), none)
  })

  it('en la manta elige el único color y deja los talles sin elegir', () => {
    assert.deepEqual(initialSelection(manta), { size: null, color: 'Gris' })
    const sizes = sizeChoices(manta, initialSelection(manta))
    assert.deepEqual(sizes.map((choice) => choice.enabled), [false, false])
    assert.equal(colorChoices(manta, initialSelection(manta))[0]?.enabled, false)
  })
})

describe('precio, tope y queda 1', () => {
  it('sin elegir muestra el mismo precio que la tarjeta', () => {
    assert.equal(priceText(body, none), `desde ${formatArs(18900)}`)
    assert.equal(priceAmount(body, none), 18900)
    assert.equal(priceMuted(body, none), false)
    assert.equal(priceText(gorrito, none), formatArs(7500))
  })

  it('con la variante elegida usa su precio, o el base si no tiene', () => {
    const rosa: Selection = { size: '3-6 m', color: 'Rosa viejo' }
    assert.equal(priceText(body, rosa), formatArs(19900))
    assert.equal(priceAmount(body, rosa), 19900)
    const crudo: Selection = { size: '0-3 m', color: 'Crudo' }
    assert.equal(priceAmount(body, crudo), 18900)
    assert.equal(quedaUnoTexto(body, rosa), 'Queda 1')
    assert.equal(quedaUnoTexto(body, crudo), null)
    assert.equal(quantityCap(body, rosa), 1)
    assert.equal(quantityCap(body, crudo), 4)
    assert.equal(quantityCap(body, none), 0)
  })

  it('la cantidad no baja de 1 ni pasa el stock', () => {
    assert.equal(clampQuantity(0, 4), 1)
    assert.equal(clampQuantity(2.9, 4), 2)
    assert.equal(clampQuantity(9, 1), 1)
    assert.equal(clampQuantity(3, 0), 1)
  })

  it('si hay dos variantes iguales, usa la que tiene stock', () => {
    const product: PrendaProduct = {
      slug: 'doble',
      base_price: 1000,
      pieza_unica: false,
      product_variants: [
        variant({ id: 10, size: '0-3 m', color: 'Crudo', stock_quantity: 0, price: 500 }),
        variant({ id: 11, size: '0-3 m', color: 'Crudo', stock_quantity: 2, price: 800 }),
      ],
    }
    const found = findVariant(product, '0-3 m', 'Crudo')
    assert.equal(found?.id, 11)
    assert.equal(quantityCap(product, { size: '0-3 m', color: 'Crudo' }), 2)
    assert.equal(priceAmount(product, { size: '0-3 m', color: 'Crudo' }), 800)
  })
})

describe('botón de agregar', () => {
  it('no deja agregar hasta elegir talle y color con stock', () => {
    assert.equal(canAdd(body, none), false)
    assert.equal(showChooseHint(body, none), true)
    assert.equal(canAdd(body, { size: '3-6 m', color: null }), false)
    assert.equal(canAdd(body, { size: '3-6 m', color: 'Rosa viejo' }), true)
    assert.equal(showChooseHint(body, { size: '3-6 m', color: 'Rosa viejo' }), false)
    assert.equal(addButtonLabel(body), 'Agregar al carrito')
  })

  it('arma el detalle del evento con la cantidad ya limitada', () => {
    const detail = addToCartDetail(body, { size: '0-3 m', color: 'Crudo' }, 9)
    assert.deepEqual(detail, {
      slug: 'body-de-algodon',
      variantId: 1,
      size: '0-3 m',
      color: 'Crudo',
      quantity: 4,
      price: 18900,
    })
    assert.equal(addToCartDetail(body, none, 1), null)
    assert.equal(addToCartDetail(body, { size: '6-9 m', color: 'Rosa viejo' }, 1), null)
  })

  it('la pieza única no se confunde con última unidad y se puede agregar', () => {
    const selection = initialSelection(bordado)
    assert.equal(cardView(bordado).label, 'PIEZA ÚNICA')
    assert.equal(quedaUnoTexto(bordado, selection), 'Queda 1')
    assert.equal(quantityCap(bordado, selection), 1)
    assert.equal(canAdd(bordado, selection), true)
    assert.equal(addButtonLabel(bordado), 'Agregar al carrito')
    assert.equal(priceText(bordado, selection), formatArs(32000))
  })

  it('sin stock el botón dice Sin stock y no pide elegir', () => {
    assert.equal(isSoldOut(manta), true)
    assert.equal(addButtonLabel(manta), 'Sin stock')
    assert.equal(canAdd(manta, initialSelection(manta)), false)
    assert.equal(showChooseHint(manta, initialSelection(manta)), false)
    assert.equal(priceMuted(manta, initialSelection(manta)), true)
    assert.equal(priceText(manta, initialSelection(manta)), formatArs(24000))
    assert.equal(addToCartDetail(manta, { size: '0-3 m', color: 'Gris' }, 1), null)
  })

  it('una pieza única sin unidades también queda sin stock en el botón', () => {
    const product: PrendaProduct = {
      slug: 'unica-agotada',
      base_price: 1000,
      pieza_unica: true,
      product_variants: [
        variant({ id: 12, size: 'Talle único', color: 'Crudo', stock_quantity: 0, price: null }),
      ],
    }
    assert.equal(cardView(product).label, 'PIEZA ÚNICA')
    assert.equal(addButtonLabel(product), 'Sin stock')
    assert.equal(canAdd(product, initialSelection(product)), false)
    assert.equal(priceMuted(product, initialSelection(product)), true)
  })
})
