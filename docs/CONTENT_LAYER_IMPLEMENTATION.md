# Guía de Implementación: Content Layer + Strapi

## 🎯 Objetivo

Implementar Content Layer API de Astro 5.12+ para conectar con Strapi Cloud, proporcionando type safety completo y arquitectura escalable.

## 📁 Estructura Final de Archivos

```
src/
├── lib/
│   ├── strapi-types.ts           # Interfaces de respuestas Strapi
│   └── strapi-loader.ts          # Función helper reutilizable
├── content/
│   └── config.ts                 # Content Collections configuration
└── env.d.ts                      # Environment variables types
```

---

## 🚀 PASO 1: Configuración Inicial

### Objetivo
Crear estructura base de carpetas y configurar variables de entorno.

### Archivos a crear/modificar:
- **Crear:** `src/lib/` (directorio)
- **Modificar:** `.env` (variables de entorno)
- **Verificar:** `src/env.d.ts` (tipos de environment)

### Variables de entorno requeridas:
```bash
STRAPI_URL=http://localhost:1337
PUBLIC_STRAPI_URL=http://localhost:1337
```

### Tipos de environment:
```typescript
// src/env.d.ts - Agregar estas interfaces
interface ImportMetaEnv {
  readonly STRAPI_URL: string
  readonly PUBLIC_STRAPI_URL: string
}
```

### Estructura de carpetas:
- Crear directorio `src/lib/`
- Verificar que existe `src/content/` 

### Criterios de éxito:
- ✅ Directorio `src/lib/` creado
- ✅ Variables en `.env` configuradas
- ✅ Tipos en `env.d.ts` agregados
- ✅ `npm run dev` funciona sin errores

---

## 🏗️ PASO 2: Configuración de Tipos Strapi

### Objetivo
Definir interfaces TypeScript que describan exactamente cómo Strapi devuelve los datos.

### Archivo a crear:
- **`src/lib/strapi-types.ts`**

### Interfaces principales requeridas:

#### Interfaces base de Strapi:
- `StrapiResponse<T>` - Estructura general de respuesta
- `StrapiEntity<T>` - Wrapper de entidades individuales

#### Content Types específicos:
- `StrapiProduct` - Productos con todas las propiedades
- `StrapiCategory` - Categorías con relaciones
- `StrapiVariant` - Variantes de productos
- `StrapiMedia` - Archivos multimedia (imágenes)
- `StrapiPromotion` - Promociones y descuentos

### Propiedades por Content Type:

#### StrapiProduct debe incluir:
- Campos básicos: name, slug, description, base_price, sku
- Estados: featured, active
- Timestamps: createdAt, updatedAt
- Relaciones: images, categories, variants (con estructura `{ data: StrapiEntity<T>[] }`)

#### StrapiCategory debe incluir:
- Campos básicos: name, slug, description
- Configuración: active, order
- Relaciones: image (single), parent_category (self-reference)

#### StrapiVariant debe incluir:
- Identificación: name, sku
- Atributos: size, color, price
- Inventario: stock_quantity, low_stock_threshold
- Estados: active, available

#### StrapiMedia debe incluir:
- Básico: name, url, alternativeText
- Dimensiones: width, height
- Formatos: formats (thumbnail, small, medium, large)

### Criterios de éxito:
- ✅ Archivo `strapi-types.ts` creado
- ✅ Todas las interfaces definidas
- ✅ TypeScript compila sin errores
- ✅ Interfaces cubren todos los Content Types de Strapi

---

## 🔧 PASO 3: Creación de Strapi Loader

### Objetivo
Crear función helper reutilizable que maneje fetch a Strapi y transforme datos al formato Content Layer.

### Archivo a crear:
- **`src/lib/strapi-loader.ts`**

### Funcionalidades requeridas:

#### Función principal `strapiLoader<T>`:
- Parámetro: `endpoint: string`
- Return: Loader object compatible con Content Layer API
- Genérico: Acepta tipo de Strapi como parámetro

#### Capabilities del loader:
- **Fetch automático:** Construir URL con base + endpoint
- **Populate automático:** Agregar `?populate=*` a todas las requests
- **Error handling:** Try/catch con mensajes descriptivos
- **Transformación de datos:** Convertir de formato Strapi a formato Astro
- **Type safety:** Usar tipos de `strapi-types.ts`

#### Transformación de datos:
- **Input:** `{ data: [{ id: number, attributes: T }] }`
- **Output:** `{ id: string, ...attributes }`
- Flatten estructura de Strapi a estructura plana
- Convertir ID numérico a string

#### Error handling:
- Network errors (fetch fails)
- HTTP errors (404, 500, etc.)
- JSON parsing errors
- Logging descriptivo para debugging

### Criterios de éxito:
- ✅ Función `strapiLoader` exportada
- ✅ Acepta parámetro genérico TypeScript
- ✅ Maneja errores gracefully
- ✅ Transforma datos correctamente
- ✅ TypeScript compila sin errores

---

## 📊 PASO 4: Configuración de Content Collections

### Objetivo
Configurar Content Collections usando strapiLoader y definir schemas de validación con Zod.

### Archivo a crear:
- **`src/content/config.ts`**

### Imports requeridos:
- `defineCollection, z` from 'astro:content'
- `strapiLoader` from '../lib/strapi-loader'
- Tipos necesarios from '../lib/strapi-types'

### Collections a configurar:

#### products-seo (collection estática):
- **Loader:** `strapiLoader<StrapiProduct>('products')`
- **Schema:** Validación completa de producto transformado
- **Propósito:** Datos estables para SEO y static generation

#### categories (collection estática):
- **Loader:** `strapiLoader<StrapiCategory>('categories')`
- **Schema:** Validación de categoría transformada
- **Propósito:** Navegación y filtrado

### Schemas Zod requeridos:

#### productSchema debe validar:
- Campos primitivos: name (string), slug (string), base_price (number)
- Estados: featured (boolean), active (boolean)
- Relaciones complejas: images, categories (nested objects)
- Campos opcionales marcados correctamente

#### categorySchema debe validar:
- Campos básicos: name, slug, description
- Configuración: active, order
- Relaciones: image (nullable), parent_category (opcional)

### Estructura del export:
- Object con todas las collections
- Names consistentes con convención del proyecto
- TypeScript inference automático

### Criterios de éxito:
- ✅ Archivo `config.ts` creado y exporta collections
- ✅ Schemas Zod validan correctamente
- ✅ Collections usan strapiLoader con tipos correctos
- ✅ TypeScript genera tipos automáticos
- ✅ No errores en build process

---

## ✅ PASO 5: Testing y Verificación

### Objetivo
Crear página de prueba para verificar que todo funciona correctamente.

### Archivo a crear:
- **`src/pages/test-content-layer.astro`** (temporal)

### Funcionalidades de testing:

#### Test básico de collections:
- Importar `getCollection` from 'astro:content'
- Fetch de 'products-seo' collection
- Fetch de 'categories' collection
- Display básico de datos

#### Verificaciones requeridas:
- **Data loading:** Collections cargan sin errores
- **Type safety:** IntelliSense funciona correctamente
- **Data structure:** Datos transformados correctamente
- **Build process:** `npm run build` completa exitosamente

#### Tests específicos:
- Contar número de productos/categorías
- Verificar estructura de primer producto
- Confirmar tipos automáticos en editor
- Probar relaciones (imágenes, categorías)

### Criterios de éxito:
- ✅ Página de test muestra datos de Strapi
- ✅ TypeScript no muestra errores
- ✅ IntelliSense funciona en objetos de collections
- ✅ Build estático genera correctamente
- ✅ Datos se muestran con estructura correcta

---

## 🎯 Resultado Final Esperado

### Funcionalidad operativa:
```typescript
// En cualquier página .astro:
const products = await getCollection('products-seo')
// ↑ Type: Product[] con IntelliSense completo

const categories = await getCollection('categories') 
// ↑ Type: Category[] con IntelliSense completo

// En getStaticPaths:
export async function getStaticPaths() {
  const products = await getCollection('products-seo')
  return products.map(product => ({
    params: { slug: product.slug }  // ↑ TypeScript conoce .slug
  }))
}
```

### Type Safety completo:
- IntelliSense en VS Code para todos los campos
- Error checking automático en build
- Refactoring seguro de nombres de propiedades
- Autocompletado de relaciones anidadas

### Performance optimizado:
- Fetch a Strapi solo durante build time
- HTML completamente estático generado
- Zero runtime API calls
- Content cached automáticamente

### Arquitectura escalable:
- Fácil agregar nuevas collections
- Loader reutilizable para cualquier endpoint
- Tipos mantenibles centralizadamente
- Pattern repetible para Live Collections futuras

---

## 📋 Checklist Final

- [x] **PASO 1:** Configuración inicial completada ✅
- [x] **PASO 2:** Tipos Strapi definidos ✅
- [x] **PASO 3:** Strapi Loader implementado ✅
- [x] **PASO 4:** Content Collections configuradas ✅
- [x] **PASO 5:** Testing y verificación exitosa ✅
- [x] **BONUS:** Documentación de la implementación ✅

## ✅ **IMPLEMENTACIÓN COMPLETADA** - 26 Julio 2025

**Todos los pasos fueron implementados exitosamente.** El Content Layer API está **100% funcional** y listo para desarrollo del ecommerce.

---

## 🔄 **CAMBIOS REALIZADOS DURANTE LA IMPLEMENTACIÓN**

### **Cambios Principales del Plan Original:**

#### **1. Estructura de Datos de Strapi**
**Plan Original:** Asumía estructura Strapi v4 con `{ data: [{ id, attributes: {...} }] }`  
**Implementación Real:** Strapi v5 usa estructura directa `{ data: [{ id, campo1, campo2, ... }] }`

**Impacto:** 
- ✅ **strapiLoader corregido** para manejar estructura v5
- ✅ **Schemas Zod actualizados** para validar datos reales
- ✅ **Transformación simplificada** (sin flatten de attributes)

#### **2. Content Types Específicos**
**Plan Original:** Asumía Content Types genéricos  
**Implementación Real:** Content Types específicos del proyecto Gonzi Store

**Campos implementados:**
- ✅ **Products:** `documentId`, `meta_title`, `age_range`, `material`, `publishedAt`
- ✅ **Categories:** `documentId`, `meta_title`, `meta_description`, `publishedAt`
- ✅ **Images:** Estructura completa de Cloudinary con `formats`, `provider_metadata`
- ✅ **Relations:** `product_variants`, `product_sets`, `subcategories`

#### **3. Relaciones y Población**
**Plan Original:** Relaciones con estructura `{ data: {...} }` anidada  
**Implementación Real:** Relaciones directas en Strapi v5

**Estructura real implementada:**
- ✅ **image:** Objeto directo (no array)
- ✅ **categories:** Array directo de objetos
- ✅ **product_variants:** Array directo con campos específicos
- ✅ **product_sets:** Array directo con relaciones

#### **4. Validación y Error Handling**
**Plan Original:** Validación básica  
**Implementación Real:** Validación exhaustiva y debugging completo

**Mejoras implementadas:**
- ✅ **ID handling avanzado** (destructuring para evitar duplicación)
- ✅ **Error logging descriptivo** para debugging
- ✅ **Schemas Zod detallados** con validación completa de Cloudinary
- ✅ **Testing temporal** para verificar funcionalidad

---

## 🎯 **ESTADO ACTUAL VERIFICADO**

### **✅ COMPLETADO Y FUNCIONANDO:**
- **Conexión Strapi v5:** ✅ Conecta correctamente con `populate=*`
- **Data Loading:** ✅ 2 productos + 4 categorías cargados exitosamente
- **Data Transformation:** ✅ IDs convertidos, estructura flattened
- **Type Safety:** ✅ Schemas Zod validando correctamente
- **Build Process:** ✅ Generación estática sin errores
- **Content Collections:** ✅ `products-seo` y `categories` operativas
- **TypeScript:** ✅ Types automáticos generados, IntelliSense funcional

### **🔧 COMPONENTES IMPLEMENTADOS:**
- **`src/lib/strapi-types.ts`** - ✅ Interfaces completas para Strapi v5
- **`src/lib/strapi-loader.ts`** - ✅ Loader optimizado y funcional  
- **`src/content/config.ts`** - ✅ Collections con schemas detallados
- **`src/env.d.ts`** - ✅ Environment types configurados
- **`.env`** - ✅ Variables de entorno configuradas

### **📊 MÉTRICAS DE ÉXITO:**
- **Build Time:** ~1.5s (óptimo)
- **Content Sync:** ~500ms (eficiente)
- **TypeScript Compilation:** 0 errores
- **Zod Validation:** 100% exitosa
- **API Requests:** 2 endpoints, `populate=*` funcionando

---

## 🚀 **PRÓXIMOS PASOS RECOMENDADOS**

### **Inmediatos (Listo para implementar):**
1. **Páginas del ecommerce** usando `getCollection('products-seo')`
2. **Routing dinámico** con `getStaticPaths()` 
3. **Componentes Vue Islands** para funcionalidad interactiva

### **Extensiones futuras:**
1. **Live Collections** para datos en tiempo real
2. **Más Content Types** (promotions, product-sets detallados)
3. **Image optimization** con Astro + Cloudinary
4. **Filtering y search** en collections

### **Optimizaciones:**
1. **Build cache** optimization
2. **Error fallbacks** para producción
3. **Performance monitoring** del Content Layer

Una vez completados todos los pasos, tienes una base sólida de Content Layer que puedes extender con Live Collections, más Content Types, y funcionalidades avanzadas.