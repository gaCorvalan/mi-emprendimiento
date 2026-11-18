# Changelog

## 2026-11-18

- El catálogo se puede buscar y filtrar por categoría, talle y color, y ordenar.
- La base visual (colores, tipo, radios y sombras) queda en tokens, con un layout común y el nombre de la tienda.
- El build baja variantes, categorías y la Tienda, y deja listo el cálculo de stock y el precio en pesos.
- El inicio es el catálogo: grilla de dos columnas, precio, etiqueta de stock y páginas de a 24.

## 2026-11-13

- Astro pasa a 7.4.11 (Node 22.23.4), la config de contenido queda en `src/content.config.ts` y la ficha deja de pedir Tailwind por el CDN.
- El build acepta provider_metadata nulo del proveedor local, y las fotos con ruta relativa quedan con la URL absoluta del CMS.

## 2026-11-12

- El build acepta los campos vacíos que permite el CMS (descripción y orden de la categoría; stock, umbral y estado de la variante; peso en texto) y baja el catálogo completo, página por página.
- La home muestra el nombre del producto, el JSON-LD de la ficha sale con los datos reales, y si no hay imagen no queda un og:image vacío ni un img sin src. El README explica cómo correr la tienda y Node queda fijado en 22.
