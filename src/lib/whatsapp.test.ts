import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import type { CartItem } from './carrito.ts'
import { formatArs } from './stock.ts'
import { orderMessage, whatsappDigits, whatsappLink } from './whatsapp.ts'

/** Número falso, solo para el test. No es un teléfono de la tienda. */
const FALSO = '5490000000000'

function item(partial: Partial<CartItem> = {}): CartItem {
  return {
    slug: 'body-de-algodon',
    variantId: 808080,
    name: 'Body de algodón',
    size: '3-6 m',
    color: 'Rosa viejo',
    unitPrice: 19900,
    quantity: 1,
    maxStock: 4,
    imageUrl: 'https://cms.example/rosa.jpg',
    piezaUnica: false,
    ...partial,
  }
}

describe('mensaje del pedido', () => {
  it('arma una sola prenda con el texto aprobado', () => {
    const message = orderMessage('Mini Gonzi', { items: [item()] })
    assert.equal(
      message,
      [
        '¡Hola, Mini Gonzi! Quiero hacer este pedido:',
        '',
        '• 1 × Body de algodón',
        `   Talle 3-6 m · Color Rosa viejo · ${formatArs(19900)}`,
        '',
        `Total: ${formatArs(19900)}`,
        '',
        '¡Gracias! Quedo atento/a para coordinar el envío.',
      ].join('\n'),
    )
  })

  it('separa varias prendas con una línea en blanco', () => {
    const message = orderMessage('Mini Gonzi', {
      items: [
        item(),
        item({
          slug: 'pantalon-termico',
          variantId: 77,
          name: 'Pantalón térmico',
          size: '6-9 m',
          color: 'Crudo',
          unitPrice: 32000,
          quantity: 1,
        }),
      ],
    })
    assert.equal(
      message,
      [
        '¡Hola, Mini Gonzi! Quiero hacer este pedido:',
        '',
        '• 1 × Body de algodón',
        `   Talle 3-6 m · Color Rosa viejo · ${formatArs(19900)}`,
        '',
        '• 1 × Pantalón térmico',
        `   Talle 6-9 m · Color Crudo · ${formatArs(32000)}`,
        '',
        `Total: ${formatArs(19900 + 32000)}`,
        '',
        '¡Gracias! Quedo atento/a para coordinar el envío.',
      ].join('\n'),
    )
  })

  it('con talle único no repite la palabra Talle', () => {
    const message = orderMessage('Mini Gonzi', {
      items: [item({ size: 'Talle único', color: 'Natural', unitPrice: 7500 })],
    })
    assert.match(message, /   Talle único · Color Natural · /)
    assert.equal(message.includes('Talle Talle'), false)
  })

  it('la cantidad mayor a 1 usa el subtotal de la línea y el total del carrito', () => {
    const message = orderMessage('Mini Gonzi', {
      items: [
        item({ quantity: 2, unitPrice: 19900 }),
        item({
          slug: 'gorrito',
          variantId: 9,
          name: 'Gorrito',
          size: '0-3 m',
          color: 'Arena',
          unitPrice: 7500,
          quantity: 1,
        }),
      ],
    })
    assert.match(message, /• 2 × Body de algodón\n   Talle 3-6 m · Color Rosa viejo · /)
    assert.equal(message.includes(formatArs(19900 * 2)), true)
    assert.equal(message.includes(`Total: ${formatArs(19900 * 2 + 7500)}`), true)
    assert.equal(message.includes(formatArs(19900) + '\n'), false)
  })

  it('no pone links, slugs ni ids', () => {
    const message = orderMessage('Mini Gonzi', {
      items: [
        item(),
        item({
          slug: 'gorrito-lino',
          variantId: 909090,
          name: 'Gorrito',
          size: 'Talle único',
          color: 'Arena',
          unitPrice: 7500,
          quantity: 3,
          imageUrl: 'https://cdn.example/gorrito.jpg',
        }),
      ],
    })
    assert.equal(/https?:\/\//.test(message), false)
    assert.equal(message.includes('www.'), false)
    assert.equal(message.includes('wa.me'), false)
    assert.equal(message.includes('body-de-algodon'), false)
    assert.equal(message.includes('gorrito-lino'), false)
    assert.equal(message.includes('808080'), false)
    assert.equal(message.includes('909090'), false)
    assert.equal(message.includes('variant'), false)
  })
})

describe('link de WhatsApp', () => {
  it('arma https://wa.me con el texto codificado', () => {
    const message = '¡Hola!\n• 1 × Body'
    const link = whatsappLink(FALSO, message)
    assert.equal(link, `https://wa.me/${FALSO}?text=${encodeURIComponent(message)}`)
    assert.equal(link?.includes(' '), false)
    assert.equal(link?.includes('\n'), false)
  })

  it('acepta 8 y 15 dígitos y rechaza el resto', () => {
    assert.equal(whatsappDigits('12345678'), '12345678')
    assert.equal(whatsappDigits('123456789012345'), '123456789012345')
    assert.equal(whatsappDigits(`  ${FALSO}  `), FALSO)
    assert.equal(whatsappLink('12345678', 'hola'), 'https://wa.me/12345678?text=hola')

    for (const malo of ['', '   ', '1234567', '1234567890123456', '+5490000000000', '549-0000-0000', 'whatsapp', null, undefined]) {
      assert.equal(whatsappDigits(malo), null)
      assert.equal(whatsappLink(malo, 'hola'), null)
    }
  })
})
