# Mini Gonzi - Especificación Completa del Proyecto Ecommerce

## 🎯 Vision del Producto

**Objetivo Principal:** Crear una tienda online escalable, SEO-optimizada y mobile-first para Mini Gonzi (ropa de bebé) que funcione como catálogo con checkout vía WhatsApp.

**Enfoque:** Arquitectura moderna que priorice SEO máximo, performance móvil extremo y experiencia de usuario fluida, manteniendo costos mínimos inicialmente.

## 📋 Definiciones de Negocio

### Modelo de Negocio
- **Tipo de productos:** Ropa de bebé (expandible a otros productos)
- **Catálogo inicial:** ~200 productos
- **Variantes por producto:** Tallas y colores
- **Canal de venta:** WhatsApp (no procesamiento de pagos)
- **Método de checkout:** Generación automática de mensaje WhatsApp
- **Audiencia principal:** Mobile-first
- **Alcance geográfico:** Argentina (principalmente)

### Productos y Variantes
- **Productos tienen:** Nombre, descripción, precio base, imágenes, categorías
- **Variantes incluyen:** Talla, color, SKU específico, precio individual, stock
- **Sets/Combos:** Productos agrupados con precio especial
- **Categorías:** Múltiples por producto, jerárquicas posibles

### Gestión de Inventario
- **Control de stock:** Por variante individual
- **Actualización:** No real-time crítico (acceptable delay)
- **Productos agotados:** Mostrar como "sin stock"
- **Rebuild tolerance:** 3-5 minutos para cambios

### Promociones y Precios
- **Descuentos:** Por porcentaje o monto fijo
- **Aplicación:** Categorías específicas, productos específicos, o toda la tienda
- **Precios:** No diferenciación por cantidad (por ahora)
- **Ofertas temporales:** Con fechas de inicio/fin

## 🏗️ Arquitectura Técnica

### Stack Principal
- **Frontend:** Astro 5.12 (SSG) + Vue Islands
- **Backend:** Strapi Cloud + PostgreSQL
- **Imágenes:** Cloudinary (25GB gratis)
- **Deploy:** Netlify (frontend) + Strapi Cloud (backend)
- **Dominio:** .com.ar o custom domain

### Arquitectura de Datos (Híbrida)

#### Content Types en Strapi:
1. **Products** (núcleo)
   - name, slug, description, base_price, sku, featured, active
   - meta_title, meta_description (SEO)
   - material, care_instructions, age_range

2. **Product Variants** 
   - name, sku, size, color, price, stock_quantity
   - low_stock_threshold, weight, dimensions
   - variant_images, active, available

3. **Categories**
   - name, slug, description, image, parent_category
   - order, active, meta_title, meta_description

4. **Product Sets** (combos)
   - name, slug, description, bundle_price, discount_percentage
   - individual_price, set_images, active, featured

5. **Promotions**
   - name, description, discount_type, discount_value
   - start_date, end_date, applies_to, active, promo_code

#### Estrategia de Collections:
```javascript
// SEO Layer (Static) - Para crawlers y meta tags
'products-seo': defineCollection({
  loader: strapiLoader('products'),
  // Data estable para SEO, structured data, meta tags
})

// UX Layer (Live) - Para usuarios y datos frescos  
'products-live': defineLiveCollection({
  loader: strapiLoader('products'),
  // Precios actuales, stock, promociones en tiempo real
})
```

### Estructura de URLs (SEO-friendly)
```
/                           → Home page
/productos                  → Lista de productos
/productos/[slug]           → Producto individual
/categoria/[slug]           → Productos por categoría  
/combo/[slug]              → Sets/combos
/buscar?q=[term]           → Búsqueda (future)
/sitemap.xml               → SEO sitemap
```

## 🎨 Frontend: Páginas y Componentes

### Páginas Principales
1. **Home** (`/`)
   - Hero section
   - Productos destacados
   - Categorías principales
   - Call-to-action WhatsApp

2. **Lista de Productos** (`/productos`)
   - Grid responsive de productos
   - Filtros por categoría (Vue island)
   - Paginación o infinite scroll
   - SEO optimizado

3. **Producto Individual** (`/productos/[slug]`)
   - Galería de imágenes (mobile-optimized)
   - Información del producto
   - Selector de variantes (Vue island)
   - Botón agregar al carrito (Vue island)
   - Related products

4. **Categoría** (`/categoria/[slug]`)
   - Lista filtrada de productos
   - Descripción de categoría
   - Meta tags específicos

5. **Carrito** (Modal/Sidebar)
   - Lista de productos seleccionados
   - Cantidad/variante por item
   - Cálculo de totales
   - Generación mensaje WhatsApp

### Vue Islands (Componentes Reactivos)
1. **AddToCart.vue**
   - Selector de variantes
   - Control de cantidad
   - Validación de stock
   - Feedback visual

2. **ShoppingCart.vue**
   - Estado global del carrito
   - CRUD de items
   - Cálculos de totales
   - Persistencia en memoria

3. **LivePrice.vue**
   - Precio actualizado
   - Ofertas/descuentos
   - Fallback a precio base

4. **LiveStock.vue**
   - Stock en tiempo real
   - Indicadores visuales
   - Estados: disponible/poco stock/agotado

5. **ProductFilters.vue**
   - Filtros por categoría
   - Ordenamiento
   - Search functionality

6. **WhatsAppCheckout.vue**
   - Generación de mensaje
   - Formateo de pedido
   - Redirect a WhatsApp

## 🛒 Flujo de Compra (WhatsApp Integration)

### Mensaje WhatsApp Generado:
```
🛒 NUEVO PEDIDO - Mini Gonzi
📋 Detalle del pedido:
• Body Algodón Orgánico (Talle 6M - Azul) x2 = $5,000
• Pantalón Térmico (Talle 12M - Rosa) x1 = $3,200
• Set Básico RN x1 = $8,500

💰 Resumen de pago:
Subtotal: $16,700
Envío: $800
TOTAL: $17,500

📍 Por favor confirma tu dirección de entrega.
⏰ Tiempo estimado de entrega: 3-5 días hábiles.
¡Gracias por elegirnos! 😊
```

### Funcionalidades del Carrito:
- **Agregar productos** con variante específica
- **Modificar cantidades** con validación de stock
- **Eliminar items** individualmente
- **Calcular totales** (subtotal + envío)
- **Validar disponibilidad** antes de checkout
- **Generar mensaje** formateado para WhatsApp
- **Limpiar carrito** después del envío

## 🔍 Estrategia SEO

### Meta Tags Dinámicos
```html
<!-- Producto individual -->
<title>Body Algodón Orgánico - $2,500 - Mini Gonzi</title>
<meta name="description" content="Body súper suave de algodón orgánico para bebés. Tallas 0-24 meses. $2,500. ¡Envío gratis desde $15,000!">
<meta property="og:title" content="Body Algodón Orgánico - Mini Gonzi">
<meta property="og:image" content="https://res.cloudinary.com/...">
```

### Structured Data (Schema.org)
```json
{
  "@context": "https://schema.org",
  "@type": "Product",
  "name": "Body Algodón Orgánico",
  "description": "Body súper suave...",
  "image": ["url1", "url2"],
  "brand": {
    "@type": "Brand",
    "name": "Mini Gonzi"
  },
  "offers": {
    "@type": "Offer",
    "price": "2500",
    "priceCurrency": "ARS",
    "availability": "https://schema.org/InStock"
  }
}
```

### URLs y Sitemap
- **URLs amigables:** `/productos/body-algodon-organico`
- **Sitemap automático** con todas las páginas
- **Canonical URLs** para evitar contenido duplicado
- **Breadcrumbs** para navegación y SEO

## 📱 Optimización Mobile

### Performance Targets
- **First Contentful Paint:** < 1.2s
- **Largest Contentful Paint:** < 1.5s  
- **Cumulative Layout Shift:** < 0.1
- **Time to Interactive:** < 2.0s
- **Lighthouse Score:** 95-100/100

### Responsive Design
- **Mobile-first approach**
- **Touch-friendly interactions**
- **Thumb-friendly button sizes**
- **Optimized image loading**
- **Swipe gestures para galería**

### Image Optimization
- **Responsive images** automáticas (Astro 5.10+)
- **Cloudinary optimization** (WebP, auto quality)
- **Lazy loading** por defecto
- **Placeholder mientras carga**

## 🚀 Deploy y Hosting

### Costos Proyectados

#### Inicial (MVP - 50 productos):
- **Strapi Cloud:** Gratis
- **Cloudinary:** Gratis (25GB)
- **Netlify:** Gratis (100GB bandwidth)
- **Dominio:** $10-15/año
- **Total:** ~$15/año

#### Escalado (200+ productos):
- **Strapi Cloud:** $29/mes
- **Cloudinary:** Gratis (suficiente)
- **Netlify:** Gratis (probable)
- **Total:** ~$350/año

### Configuración de Deploy
```javascript
// netlify.toml
[build]
  command = "npm run build"
  publish = "dist"

[build.environment]
  NODE_VERSION = "22"
  STRAPI_URL = "https://tu-proyecto.strapi.cloud"

[[redirects]]
  from = "/admin/*"
  to = "https://tu-proyecto.strapi.cloud/admin/:splat"
  status = 200
```

## 🔧 Variables de Entorno

### Development (.env)
```bash
STRAPI_URL=http://localhost:1337
PUBLIC_STRAPI_URL=http://localhost:1337
PUBLIC_WHATSAPP_NUMBER=5491123456789
CLOUDINARY_NAME=tu-cloud-name
CLOUDINARY_KEY=tu-key
CLOUDINARY_SECRET=tu-secret
```

### Production (Netlify)
```bash
STRAPI_URL=https://tu-proyecto.strapi.cloud
PUBLIC_STRAPI_URL=https://tu-proyecto.strapi.cloud
PUBLIC_WHATSAPP_NUMBER=5491123456789
```

## 📋 Plan de Desarrollo

### Fase 1: Setup y Base (Semana 1)
1. **Setup Strapi Cloud** con PostgreSQL
2. **Configurar Cloudinary** integration
3. **Crear Content Types** (Products, Categories, Variants)
4. **Setup Astro 5.12** con Netlify adapter
5. **Configurar Content Layer** híbrido (SEO + Live)

### Fase 2: Funcionalidades Core (Semana 2)
1. **Páginas estáticas** (Home, Lista productos)
2. **Página dinámica** productos/[slug] 
3. **Vue Islands** básicos (AddToCart, LivePrice)
4. **Carrito de compras** funcional
5. **WhatsApp integration** completa

### Fase 3: Optimización (Semana 3)
1. **SEO completo** (meta tags, structured data)
2. **Performance optimization** 
3. **Responsive design** refinado
4. **Testing en mobile** real
5. **Deploy a producción**

### Fase 4: Refinamiento (Semana 4)
1. **Filtros y búsqueda**
2. **Sets/Combos** functionality
3. **Promociones** system
4. **Analytics** básico
5. **Optimizaciones finales**

## ✅ Criterios de Éxito

### Performance
- [ ] Lighthouse Score > 95
- [ ] Mobile usability 100%
- [ ] Core Web Vitals "good"
- [ ] Loading time < 2s en 3G

### SEO
- [ ] Meta tags completos en todas las páginas
- [ ] Structured data válido
- [ ] Sitemap generado automáticamente
- [ ] URLs amigables funcionando

### Funcionalidad
- [ ] Carrito funcional con persistencia
- [ ] WhatsApp checkout operativo
- [ ] Stock validation funcionando
- [ ] Responsive design perfecto

### Escalabilidad  
- [ ] Content Layer API integrado
- [ ] Live Collections operativas
- [ ] Arquitectura preparada para crecimiento
- [ ] Deploy automático configurado

## 🔄 Mantenimiento y Updates

### Workflow de Contenido
1. **Agregar producto** en Strapi → Auto-rebuild (5 min)
2. **Cambiar stock** en Strapi → Update inmediato (Live Collections)
3. **Modificar precios** → Update inmediato
4. **Agregar categoría** → Rebuild necesario

### Monitoring
- **Uptime monitoring** (Netlify automático)
- **Performance monitoring** (Core Web Vitals)
- **Error tracking** (browser console)
- **Analytics** (Google Analytics 4)

Este documento debe servir como referencia completa para el desarrollo del proyecto Mini Gonzi, cubriendo todos los aspectos técnicos, de negocio y de implementación definidos en nuestra conversación.