# Mini Gonzi — tienda

Esta app es la vidriera de Mini Gonzi (ropa de bebé). Es un sitio estático hecho con Astro 7: al armar el sitio lee el catálogo del CMS y deja las páginas listas. No hay servidor de la tienda en producción; el visitante recibe HTML.

El CMS es otro proyecto, [gonzi-store-cms](https://github.com/gaCorvalan/gonzi-store-cms) (Strapi 5). Ahí se cargan los productos y las categorías. Esta tienda no escribe en el CMS: solo lo lee cuando hacés `npm run dev` o `npm run build`.

## Cómo se conecta al CMS

`src/lib/strapi-loader.ts` pide, en el momento del build (o al levantar el dev server):

- `GET {STRAPI_URL}/api/products` con `populate` explícito de `image`, `categories`, `product_variants` y `product_sets` (la clave de variantes es `product_variants`)
- `GET {STRAPI_URL}/api/categories` con `populate` explícito de `image`, `products`, `subcategories`, `category` y `product_sets`
- `GET {STRAPI_URL}/api/tienda` (tipo único: nombre, whatsapp, texto de envío, moneda)

Strapi manda las colecciones de a 25. El loader sigue de página en página hasta bajar el catálogo entero. Esos datos alimentan las colecciones de Astro `products-seo`, `categories` y `tienda`. Con eso se generan el inicio y una página por producto en `/productos/[slug]`. Si la Tienda no está publicada, el build sigue y el encabezado usa el nombre «Tienda». Un whatsapp vacío no corta el build.

## Qué necesitás

- Node.js 22.23.4 o más nuevo. Astro 7 lo exige. El archivo `.nvmrc` fija `22.23.4`.
- npm, el que viene con esa versión de Node.
- El CMS corriendo y alcanzable en `STRAPI_URL`. Sin eso el build falla, porque no hay catálogo de respaldo en el repo.

## El CMS, primero

En una carpeta aparte, con el repo [gonzi-store-cms](https://github.com/gaCorvalan/gonzi-store-cms):

```bash
npm ci
cp .env.example .env
npm run develop
```

La API queda en `http://localhost:1337`. La primera vez, en `http://localhost:1337/admin`, Strapi te pide crear el administrador.

El permiso de lectura pública sale solo al arrancar el CMS: el rol Public puede hacer `find` y `findOne` de productos, categorías, variantes y conjuntos, y `find` de la Tienda. No hace falta marcarlo a mano.

## Variables de entorno

| Variable | Para qué |
| --- | --- |
| `STRAPI_URL` | Dirección del CMS, sin barra al final. Ejemplo: `http://localhost:1337`. Si no la ponés, el loader usa esa misma dirección. |
| `PUBLIC_STRAPI_URL` | Está declarada en `src/env.d.ts`, pero hoy ningún archivo la lee. No la uses: la que vale es `STRAPI_URL`. |
| `SITE_URL` | Opcional. URL pública del sitio, por ejemplo `https://minigonzi.com.ar`. Si está, Astro genera `sitemap.xml` con links absolutos. Si no está, el sitemap se saltea. |

Podés exportarlas en la terminal o ponerlas en un `.env` en esta carpeta (no lo subas al repo).

## Cómo correr la tienda

```bash
nvm use
npm ci
npm run dev
npm test
```

El dev server abre en `http://localhost:4321`.

Para el sitio estático:

```bash
npm run build
npm run preview
```

`npm run build` escribe el HTML en `dist/`. Si querés el sitemap en ese build:

```bash
SITE_URL=https://minigonzi.com.ar npm run build
```

## Qué anda hoy

- El inicio es el catálogo: grilla de dos columnas, nombre, precio y etiqueta de stock (pieza única, última unidad o sin stock). Si hay más de 24 prendas, sigue en `/pagina/2`. Arriba se puede buscar por nombre. «Filtrar y ordenar» abre categoría, talle, color y orden; la elección queda en la URL.
- Cada producto tiene su ficha en `/productos/[slug]`: foto, precio, talle, color y cantidad. «Agregar al carrito» guarda el pedido en el navegador y deja un aviso, sin salir de la ficha. También hay datos para buscadores (JSON-LD).
- Si un producto no tiene imagen, la tarjeta y la ficha muestran un recuadro plano, sin letra. No se publica `og:image` vacío ni un `img` sin `src`.
- El build baja productos, categorías y la Tienda.
- El encabezado muestra el nombre de la Tienda y el carrito, con la cantidad de prendas. El texto de envío de la ficha y de `/carrito` sale de la Tienda (por defecto, «A coordinar»).
- `/carrito` lista el pedido, deja cambiar cantidades y quitar. «Pedir por WhatsApp» abre el mensaje con el número de la Tienda. Si ese número está vacío o no es válido, el botón queda deshabilitado. El carrito no se vacía al abrir WhatsApp. El stock del carrito es el de la variante al agregarla; no se vuelve a consultar.
- `npm test` cubre el stock, el precio en pesos (`src/lib/stock.ts`), la búsqueda y los filtros (`src/lib/filters.ts`), la ficha (`src/lib/prenda.ts`), el carrito (`src/lib/carrito.ts`) y el mensaje de WhatsApp (`src/lib/whatsapp.ts`).

## Qué falta

- No hay página de categoría ni listado aparte. Las categorías se usan para filtrar el catálogo.
- No se muestran las promos. El catálogo sí muestra si es pieza única, última unidad o sin stock.
