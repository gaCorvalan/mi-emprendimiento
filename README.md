# Mini Gonzi — tienda

Esta app es la vidriera de Mini Gonzi (ropa de bebé). Es un sitio estático hecho con Astro 5: al armar el sitio lee el catálogo del CMS y deja las páginas listas. No hay servidor de la tienda en producción; el visitante recibe HTML.

El CMS es otro proyecto, [gonzi-store-cms](https://github.com/gaCorvalan/gonzi-store-cms) (Strapi 5). Ahí se cargan los productos y las categorías. Esta tienda no escribe en el CMS: solo lo lee cuando hacés `npm run dev` o `npm run build`.

## Cómo se conecta al CMS

`src/lib/strapi-loader.ts` pide, en el momento del build (o al levantar el dev server):

- `GET {STRAPI_URL}/api/products?populate=*`
- `GET {STRAPI_URL}/api/categories?populate=*`

Strapi manda de a 25. El loader sigue de página en página hasta bajar el catálogo entero. Esos datos alimentan las colecciones de Astro `products-seo` y `categories`. Con eso se generan el inicio y una página por producto en `/productos/[slug]`.

## Qué necesitás

- Node.js 22. El archivo `.nvmrc` fija esa versión. El campo `engines` acepta de 18 a 22, igual que el CMS; en este proyecto usamos 22.
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

El permiso de lectura pública sale solo al arrancar el CMS: el rol Public puede hacer `find` y `findOne` de productos, categorías, variantes y conjuntos. No hace falta marcarlo a mano.

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

- El inicio lista los productos publicados, con el nombre que cargaste en el CMS.
- Cada producto tiene su ficha en `/productos/[slug]`: nombre, precio, descripción y datos para buscadores (JSON-LD).
- Si un producto no tiene imagen, la tarjeta y la ficha muestran un recuadro con la inicial. No se publica `og:image` vacío ni un `img` sin `src`.
- El build baja productos y categorías, todas las páginas.

## Qué falta

- El botón Comprar no hace nada. No hay carrito ni mensaje de WhatsApp.
- No hay página de categoría, listado aparte, búsqueda ni filtros. Las categorías se bajan en el build, pero la tienda todavía no las muestra.
- No se elige talle ni color, y no se muestra el stock ni las promos.
