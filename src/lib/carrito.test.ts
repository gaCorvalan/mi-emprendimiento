import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import { formatArs } from './stock.ts'
import {
  CART_KEY,
  addItem,
  emptyCart,
  parseCart,
  linePrice,
  quedaUnoTexto,
  removeItem,
  setQuantity,
  totalPrice,
  totalUnits,
  variantLine,
  type CartItem,
  type NewCartItem,
} from './carrito.ts'

function nuevo(partial: Partial<NewCartItem> = {}): NewCartItem {
  return {
    slug: 'body-de-algodon',
    variantId: 2,
    name: 'Body de algodón',
    size: '3-6 m',
    color: 'Rosa viejo',
    unitPrice: 19900,
    quantity: 1,
    maxStock: 1,
    imageUrl: 'https://cms.example/rosa.jpg',
    piezaUnica: false,
    ...partial,
  }
}

function item(partial: Partial<CartItem> = {}): CartItem {
  const base = nuevo()
  return {
    slug: base.slug,
    variantId: base.variantId,
    name: base.name,
    size: base.size,
    color: base.color,
    unitPrice: base.unitPrice,
    quantity: 1,
    maxStock: 1,
    imageUrl: 'https://cms.example/rosa.jpg',
    piezaUnica: false,
    ...partial,
  }
}

describe('parsear el carrito', () => {
  it('usa la clave versionada', () => {
    assert.equal(CART_KEY, 'carrito:v1')
  })

  it('un dato roto o vacío vuelve vacío', () => {
    assert.deepEqual(parseCart(null), emptyCart())
    assert.deepEqual(parseCart(undefined), emptyCart())
    assert.deepEqual(parseCart(''), emptyCart())
    assert.deepEqual(parseCart('no es json'), emptyCart())
    assert.deepEqual(parseCart('[]'), emptyCart())
    assert.deepEqual(parseCart('{}'), emptyCart())
    assert.deepEqual(parseCart('{"items":null}'), emptyCart())
    assert.deepEqual(parseCart({ items: 'no' }), emptyCart())
    assert.deepEqual(parseCart(3), emptyCart())
  })

  it('se queda con las líneas válidas y descarta el resto', () => {
    const cart = parseCart({
      items: [
        null,
        { slug: '' },
        item({ variantId: 5, quantity: 2, maxStock: 4, imageUrl: 'javascript:alert(1)' }),
        item({ variantId: 5, quantity: 9, maxStock: 4 }),
        { ...item({ variantId: 8 }), quantity: 0 },
        { ...item({ variantId: 9 }), maxStock: 0 },
      ],
    })
    assert.deepEqual(cart.items, [
      item({ variantId: 5, quantity: 2, maxStock: 4, imageUrl: null }),
    ])
  })

  it('si la cantidad guardada pasa el tope, la baja', () => {
    const cart = parseCart(JSON.stringify({ items: [item({ quantity: 5, maxStock: 2 })] }))
    assert.equal(cart.items[0].quantity, 2)
    assert.equal(cart.items[0].maxStock, 2)
  })

  it('pieza única solo si el flag es true', () => {
    const cart = parseCart({ items: [item({ piezaUnica: true }), { ...item({ variantId: 3 }) }] })
    assert.equal(cart.items[0].piezaUnica, true)
    assert.equal(cart.items[1].piezaUnica, false)
  })
})

describe('agregar, cambiar y quitar', () => {
  it('agrega una variante y suma la misma hasta el tope', () => {
    const first = addItem(emptyCart(), nuevo({ quantity: 2, maxStock: 4, unitPrice: 18900 }))
    assert.equal(first.added, true)
    assert.equal(first.cart.items.length, 1)
    assert.equal(first.cart.items[0].quantity, 2)
    assert.equal(first.cart.items[0].unitPrice, 18900)

    const second = addItem(first.cart, nuevo({
      quantity: 3,
      maxStock: 4,
      unitPrice: 19900,
      name: 'Body',
      imageUrl: '/foto.jpg',
    }))
    assert.equal(second.added, true)
    assert.equal(second.cart.items.length, 1)
    assert.equal(second.cart.items[0].quantity, 4)
    assert.equal(second.cart.items[0].unitPrice, 19900)
    assert.equal(second.cart.items[0].name, 'Body')
    assert.equal(second.cart.items[0].imageUrl, '/foto.jpg')
    assert.equal(second.cart.items[0].maxStock, 4)
  })

  it('otra variante queda en otra línea', () => {
    const cart = addItem(
      addItem(emptyCart(), nuevo()).cart,
      nuevo({ variantId: 7, slug: 'gorrito', name: 'Gorrito', size: 'Talle único', color: 'Natural', maxStock: 5, quantity: 2, unitPrice: 7500 }),
    ).cart
    assert.deepEqual(cart.items.map((entry) => entry.variantId), [2, 7])
    assert.equal(totalUnits(cart), 3)
    assert.equal(totalPrice(cart), 19900 + 7500 * 2)
  })

  it('no agrega si no hay stock o el dato no sirve', () => {
    const sinStock = addItem(emptyCart(), nuevo({ maxStock: 0, quantity: 1 }))
    assert.equal(sinStock.added, false)
    assert.deepEqual(sinStock.cart, emptyCart())

    const base = emptyCart()
    const basura = addItem(base, nuevo({ quantity: 0, name: '  ' }))
    assert.equal(basura.added, false)
    assert.equal(basura.cart, base)
  })

  it('la cantidad queda entre 1 y el tope', () => {
    const cart = addItem(emptyCart(), nuevo({ maxStock: 3, quantity: 2 })).cart
    assert.equal(setQuantity(cart, 2, 0).items[0].quantity, 1)
    assert.equal(setQuantity(cart, 2, 1.9).items[0].quantity, 1)
    assert.equal(setQuantity(cart, 2, 99).items[0].quantity, 3)
    assert.equal(setQuantity(cart, 2, 2), cart)
    assert.equal(setQuantity(cart, 99, 1), cart)
    assert.equal(setQuantity(cart, 2, Number.NaN), cart)
  })

  it('quitar saca solo esa variante', () => {
    const cart = addItem(
      addItem(emptyCart(), nuevo()).cart,
      nuevo({ variantId: 7, maxStock: 5 }),
    ).cart
    const next = removeItem(cart, 2)
    assert.deepEqual(next.items.map((entry) => entry.variantId), [7])
    assert.equal(removeItem(next, 2), next)
    assert.deepEqual(removeItem(next, 7), emptyCart())
  })
})

describe('textos', () => {
  it('arma la línea de talle y color', () => {
    assert.equal(variantLine(item()), 'Talle 3-6 m · Color Rosa viejo')
    assert.equal(
      variantLine(item({ size: 'Talle único', color: 'Natural' })),
      'Talle único · Color Natural',
    )
  })

  it('Queda 1 solo si el tope es 1 y no es pieza única', () => {
    assert.equal(quedaUnoTexto(item({ maxStock: 1, piezaUnica: false })), 'Queda 1')
    assert.equal(quedaUnoTexto(item({ maxStock: 1, piezaUnica: true })), null)
    assert.equal(quedaUnoTexto(item({ maxStock: 4, piezaUnica: false })), null)
  })

  it('el total de un carrito vacío es cero', () => {
    assert.equal(totalUnits(emptyCart()), 0)
    assert.equal(totalPrice(emptyCart()), 0)
  })

  it('con una unidad el precio es el de la unidad', () => {
    assert.deepEqual(linePrice(item({ unitPrice: 19900, quantity: 1 })), {
      main: formatArs(19900),
      each: null,
    })
  })

  it('con más de una unidad muestra el subtotal y el precio por unidad', () => {
    assert.deepEqual(linePrice(item({ unitPrice: 19900, quantity: 2, maxStock: 4 })), {
      main: formatArs(39800),
      each: `${formatArs(19900)} c/u`,
    })
  })
})
