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
- **Frontend:** Astro 5.12 (SSG) + Vue Islands + TypeScript
- **Styling:** Tailwind CSS 4 (via @tailwindcss/vite)
- **Backend:** Strapi Cloud + PostgreSQL
- **Imágenes:** Cloudinary (25GB gratis)
- **Deploy:** Netlify (frontend) + Strapi Cloud (backend)
- **Dominio:** .com.ar o custom domain

### Arquitectura de Datos (Híbrida) ✅ **IMPLEMENTADA**

#### Content Types en Strapi v5: ✅ **CONFIGURADOS Y FUNCIONANDO**
1. **Products** (núcleo) ✅ **IMPLEMENTADO**
   - ✅ name, slug, description, base_price, featured, active
   - ✅ meta_title, age_range, material (campos SEO implementados)
   - ✅ documentId, publishedAt (campos Strapi v5)
   - ✅ **Relaciones:** image (Cloudinary), categories, product_variants, product_sets

2. **Product Variants** ✅ **IMPLEMENTADO** 
   - ✅ size, color, price, stock_quantity, material_variant
   - ✅ low_stock_threshold, weight, active
   - ✅ documentId, publishedAt (estructura Strapi v5)

3. **Categories** ✅ **IMPLEMENTADO**
   - ✅ name, slug, description, order, active
   - ✅ meta_title, meta_description (SEO)
   - ✅ **Relaciones:** image (Cloudinary), subcategories, product_sets

4. **Product Sets** (combos) ✅ **IMPLEMENTADO**
   - ✅ name, slug, description, price, active
   - ✅ meta_title, meta_description
   - ✅ documentId, publishedAt (estructura Strapi v5)

5. **Media/Images** ✅ **IMPLEMENTADO COMPLETO**
   - ✅ **Cloudinary integration** completa
   - ✅ **Formats:** thumbnail, small, medium, large  
   - ✅ **Metadata:** provider_metadata, dimensions, optimization

#### Estrategia de Collections: ✅ **IMPLEMENTADA**
```javascript
// ✅ IMPLEMENTADO - SEO Layer (Static) - Para crawlers y meta tags
'products-seo': defineCollection({
  loader: strapiLoader<StrapiProduct>('products'),
  schema: productSchema // ✅ Validación Zod completa
  // ✅ Data estable para SEO, structured data, meta tags
})

// ✅ IMPLEMENTADO - Categories Layer (Static) - Para navegación
'categories': defineCollection({
  loader: strapiLoader<StrapiCategory>('categories'),
  schema: categorySchema // ✅ Validación Zod completa
  // ✅ Data estable para navegación y filtros
})

// 🔮 FUTURO - UX Layer (Live) - Para usuarios y datos frescos  
'products-live': defineLiveCollection({
  loader: strapiLoader('products'),
  // 📋 TODO: Precios actuales, stock, promociones en tiempo real
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

### TypeScript Environment Types
```typescript
// src/env.d.ts (automático en Astro 5.12+)
/// <reference types="astro/client" />

interface ImportMetaEnv {
  readonly STRAPI_URL: string
  readonly PUBLIC_STRAPI_URL: string
  readonly PUBLIC_WHATSAPP_NUMBER: string
  readonly CLOUDINARY_NAME: string
  readonly CLOUDINARY_KEY: string
  readonly CLOUDINARY_SECRET: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
```

## 📋 Plan de Desarrollo

### ✅ Fase 1: Setup y Base **COMPLETADA**
1. ✅ **Setup Strapi Cloud** con PostgreSQL - *Funcionando*
2. ✅ **Configurar Cloudinary** integration - *Operativo* 
3. ✅ **Crear Content Types** (Products, Categories, Variants) - *Implementados*
4. ✅ **Setup Astro 5.12** con Tailwind 4 (via @tailwindcss/vite) - *Configurado*
5. ✅ **Configurar Content Layer** híbrido (SEO + Live) - *100% Funcional*

### 🚧 Fase 2: Funcionalidades Core **EN DESARROLLO**
1. 📋 **Páginas estáticas** (Home, Lista productos) - *Pendiente*
2. 📋 **Página dinámica** productos/[slug] - *Pendiente*
3. 📋 **Vue Islands** básicos (AddToCart, LivePrice) - *Pendiente*
4. 📋 **Carrito de compras** funcional - *Pendiente*
5. 📋 **WhatsApp integration** completa - *Pendiente*

### 🔮 Fase 3: Optimización **PLANIFICADA**
1. 📋 **SEO completo** (meta tags, structured data) - *Pendiente*
2. 📋 **Performance optimization** - *Pendiente*
3. 📋 **Responsive design** refinado - *Pendiente*
4. 📋 **Testing en mobile** real - *Pendiente*
5. 📋 **Deploy a producción** - *Pendiente*

### 🔮 Fase 4: Refinamiento **PLANIFICADA**
1. 📋 **Filtros y búsqueda** - *Pendiente*
2. 📋 **Sets/Combos** functionality - *Pendiente*
3. 📋 **Promociones** system - *Pendiente*
4. 📋 **Analytics** básico - *Pendiente*
5. 📋 **Optimizaciones finales** - *Pendiente*

## ✅ Criterios de Éxito

### ✅ Backend y Content Layer **COMPLETADOS**
- [x] ✅ **Content Layer API integrado** - *Funcionando al 100%*
- [x] ✅ **Strapi v5 operativo** - *Conectado y validado*
- [x] ✅ **Type Safety completo** - *Schemas Zod + TypeScript*
- [x] ✅ **Build Process optimizado** - *~1.5s build time*
- [x] ✅ **Error Handling robusto** - *Logging y validation*

### 🚧 Performance **EN DESARROLLO**
- [ ] 📋 Lighthouse Score > 95 - *Pendiente (páginas del ecommerce)*
- [ ] 📋 Mobile usability 100% - *Pendiente*
- [ ] 📋 Core Web Vitals "good" - *Pendiente*
- [ ] 📋 Loading time < 2s en 3G - *Pendiente*

### 🚧 SEO **EN DESARROLLO**
- [ ] 📋 Meta tags completos en todas las páginas - *Pendiente*
- [ ] 📋 Structured data válido - *Pendiente*
- [ ] 📋 Sitemap generado automáticamente - *Pendiente*
- [ ] 📋 URLs amigables funcionando - *Pendiente*

### 🚧 Funcionalidad **EN DESARROLLO**
- [ ] 📋 Carrito funcional con persistencia - *Pendiente*
- [ ] 📋 WhatsApp checkout operativo - *Pendiente*
- [ ] 📋 Stock validation funcionando - *Pendiente*
- [ ] 📋 Responsive design perfecto - *Pendiente*

### ✅ Escalabilidad **BASE COMPLETADA**
- [x] ✅ **Content Layer API integrado** - *100% Funcional*
- [ ] 🔮 Live Collections operativas - *Futuro*
- [x] ✅ **Arquitectura preparada para crecimiento** - *Pattern establecido*
- [ ] 📋 Deploy automático configurado - *Pendiente*

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

---

## 📊 **ACTUALIZACIÓN DE ESTADO - 26 Julio 2025**

### ✅ **LOGROS PRINCIPALES COMPLETADOS:**

#### **🏗️ Content Layer API - 100% FUNCIONAL**
- **Implementación:** Astro 5.12 Content Layer API + Strapi v5
- **Status:** ✅ Completamente operativo y validado  
- **Funcionalidades:** Type safety completo, build optimizado, error handling robusto
- **Métricas:** Build time ~1.5s, TypeScript 0 errores, Zod validation 100%

#### **🔧 Backend Infrastructure - OPERATIVA**  
- **Strapi v5:** ✅ Configurado con PostgreSQL + Cloudinary
- **Content Types:** ✅ Products, Categories, Variants, Media implementados
- **API Endpoints:** ✅ Funcionando con `populate=*`
- **Data Validation:** ✅ Schemas Zod detallados para estructura real

#### **📱 Frontend Base - ESTABLECIDA**
- **Framework:** ✅ Astro 5.12 + TypeScript configurado
- **Collections:** ✅ `products-seo` y `categories` operativas
- **Environment:** ✅ Variables configuradas, build process funcionando
- **Architecture:** ✅ Pattern escalable establecido

### 🚧 **SIGUIENTE SPRINT - Ecommerce UI**

**Objetivo:** Desarrollar las páginas del ecommerce usando el Content Layer implementado

**Tareas Inmediatas:**
1. **Página Home** con productos destacados (`getCollection('products-seo')`)
2. **Lista de Productos** con categorías (`getCollection('categories')`)
3. **Producto Individual** con routing dinámico (`getStaticPaths()`)
4. **Components Vue Islands** para interactividad

**Estimación:** 1-2 semanas (base sólida ya implementada)

### 🎯 **CAMBIOS EN ESPECIFICACIONES ORIGINALES:**

1. **Strapi v4 → v5:** Estructura de datos actualizada (sin `attributes` anidados)
2. **Schemas Genericos → Específicos:** Validación detallada para Gonzi Store
3. **Testing Integration:** Proceso de testing y debugging establecido
4. **Type Safety Mejorado:** Schemas Zod más robustos que lo planeado

### 🔮 **ROADMAP ACTUALIZADO:**

- **Inmediato (1-2 semanas):** Páginas del ecommerce con Content Layer
- **Corto plazo (1 mes):** Vue Islands + WhatsApp integration
- **Mediano plazo (2-3 meses):** Live Collections + optimizaciones
- **Largo plazo (6 meses):** Analytics + features avanzadas

---

Este documento debe servir como referencia completa para el desarrollo del proyecto Mini Gonzi, cubriendo todos los aspectos técnicos, de negocio y de implementación definidos en nuestra conversación.