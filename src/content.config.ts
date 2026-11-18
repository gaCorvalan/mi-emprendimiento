import { defineCollection } from 'astro:content'
import { z } from 'astro/zod'
import { strapiLoader, strapiSingleLoader } from './lib/strapi-loader'

// ===== SCHEMAS ZOD =====

// Schema para productos transformados (después de strapiLoader).
// Campos confirmados contra GET /api/products con populate explícito.
const productSchema = z.object({
  // ID transformado por strapiLoader
  id: z.string(),
  
  // Campos básicos (estructura real de Strapi v5)
  documentId: z.string(),
  name: z.string(),
  description: z.string(),
  slug: z.string(),
  base_price: z.number(),
  featured: z.boolean(),
  active: z.boolean(),
  pieza_unica: z.boolean(),
  
  // Campos adicionales de Strapi
  meta_title: z.string().nullable(),
  age_range: z.string().nullable(),
  material: z.string().nullable(),
  
  // Timestamps
  createdAt: z.string(),
  updatedAt: z.string(),
  publishedAt: z.string(),
  
  // Relaciones populadas (estructura directa en Strapi v5)
  image: z.object({
    id: z.number(),
    documentId: z.string(),
    name: z.string(),
    alternativeText: z.string().nullable(),
    caption: z.string().nullable(),
    width: z.number(),
    height: z.number(),
    formats: z.object({
      thumbnail: z.object({
        ext: z.string(),
        url: z.string(),
        hash: z.string(),
        mime: z.string(),
        name: z.string(),
        path: z.string().nullable(),
        size: z.number(),
        width: z.number(),
        height: z.number(),
        sizeInBytes: z.number(),
        provider_metadata: z.object({
          public_id: z.string(),
          resource_type: z.string()
        }).nullish()
      }).optional(),
      small: z.object({
        ext: z.string(),
        url: z.string(),
        hash: z.string(),
        mime: z.string(),
        name: z.string(),
        path: z.string().nullable(),
        size: z.number(),
        width: z.number(),
        height: z.number(),
        sizeInBytes: z.number(),
        provider_metadata: z.object({
          public_id: z.string(),
          resource_type: z.string()
        }).nullish()
      }).optional(),
      medium: z.object({
        ext: z.string(),
        url: z.string(),
        hash: z.string(),
        mime: z.string(),
        name: z.string(),
        path: z.string().nullable(),
        size: z.number(),
        width: z.number(),
        height: z.number(),
        sizeInBytes: z.number(),
        provider_metadata: z.object({
          public_id: z.string(),
          resource_type: z.string()
        }).nullish()
      }).optional(),
      large: z.object({
        ext: z.string(),
        url: z.string(),
        hash: z.string(),
        mime: z.string(),
        name: z.string(),
        path: z.string().nullable(),
        size: z.number(),
        width: z.number(),
        height: z.number(),
        sizeInBytes: z.number(),
        provider_metadata: z.object({
          public_id: z.string(),
          resource_type: z.string()
        }).nullish()
      }).optional()
    }),
    hash: z.string(),
    ext: z.string(),
    mime: z.string(),
    size: z.number(),
    url: z.string(),
    previewUrl: z.string().nullable(),
    provider: z.string(),
    provider_metadata: z.object({
      public_id: z.string(),
      resource_type: z.string()
    }).nullish(),
    createdAt: z.string(),
    updatedAt: z.string(),
    publishedAt: z.string()
  }).nullable(),
  
  categories: z.array(z.object({
    id: z.number(),
    documentId: z.string(),
    name: z.string(),
    slug: z.string(),
    description: z.string().nullable(),
    order: z.number().nullable(),
    active: z.boolean(),
    meta_title: z.string().nullable(),
    meta_description: z.string().nullable(),
    createdAt: z.string(),
    updatedAt: z.string(),
    publishedAt: z.string()
  })),
  
  product_variants: z.array(z.object({
    id: z.number(),
    documentId: z.string(),
    size: z.string(),
    color: z.string(),
    color_hex: z.string().regex(/^#[0-9A-Fa-f]{6}$/).nullable(),
    material_variant: z.string().nullable(),
    price: z.number().nullable(),
    stock_quantity: z.number().int().nonnegative(),
    low_stock_threshold: z.number().nullable(),
    weight: z.string().nullable(),
    active: z.boolean().nullable(),
    createdAt: z.string(),
    updatedAt: z.string(),
    publishedAt: z.string()
  })),
  
  product_sets: z.array(z.object({
    id: z.number(),
    documentId: z.string(),
    name: z.string(),
    slug: z.string(),
    description: z.string(),
    price: z.number(),
    active: z.boolean(),
    meta_title: z.string().nullable(),
    meta_description: z.string().nullable(),
    createdAt: z.string(),
    updatedAt: z.string(),
    publishedAt: z.string()
  }))
})

// Schema para categorías transformadas (después de strapiLoader)
// Basado en la estructura REAL de Strapi v5
const categorySchema = z.object({
  // ID transformado por strapiLoader
  id: z.string(),
  
  // Campos básicos (estructura real de Strapi v5)
  documentId: z.string(),
  name: z.string(),
  slug: z.string(),
  description: z.string().nullable(),
  order: z.number().nullable(),
  active: z.boolean(),
  
  // Campos adicionales de Strapi
  meta_title: z.string().nullable(),
  meta_description: z.string().nullable(),
  
  // Timestamps
  createdAt: z.string(),
  updatedAt: z.string(),
  publishedAt: z.string(),
  
  // Relaciones (estructura real de Strapi v5)
  image: z.object({
    id: z.number(),
    documentId: z.string(),
    name: z.string(),
    alternativeText: z.string().nullable(),
    caption: z.string().nullable(),
    width: z.number(),
    height: z.number(),
    formats: z.object({
      thumbnail: z.object({
        ext: z.string(),
        url: z.string(),
        hash: z.string(),
        mime: z.string(),
        name: z.string(),
        path: z.string().nullable(),
        size: z.number(),
        width: z.number(),
        height: z.number(),
        sizeInBytes: z.number(),
        provider_metadata: z.object({
          public_id: z.string(),
          resource_type: z.string()
        }).nullish()
      }).optional(),
      small: z.object({
        ext: z.string(),
        url: z.string(),
        hash: z.string(),
        mime: z.string(),
        name: z.string(),
        path: z.string().nullable(),
        size: z.number(),
        width: z.number(),
        height: z.number(),
        sizeInBytes: z.number(),
        provider_metadata: z.object({
          public_id: z.string(),
          resource_type: z.string()
        }).nullish()
      }).optional(),
      medium: z.object({
        ext: z.string(),
        url: z.string(),
        hash: z.string(),
        mime: z.string(),
        name: z.string(),
        path: z.string().nullable(),
        size: z.number(),
        width: z.number(),
        height: z.number(),
        sizeInBytes: z.number(),
        provider_metadata: z.object({
          public_id: z.string(),
          resource_type: z.string()
        }).nullish()
      }).optional(),
      large: z.object({
        ext: z.string(),
        url: z.string(),
        hash: z.string(),
        mime: z.string(),
        name: z.string(),
        path: z.string().nullable(),
        size: z.number(),
        width: z.number(),
        height: z.number(),
        sizeInBytes: z.number(),
        provider_metadata: z.object({
          public_id: z.string(),
          resource_type: z.string()
        }).nullish()
      }).optional()
    }),
    hash: z.string(),
    ext: z.string(),
    mime: z.string(),
    size: z.number(),
    url: z.string(),
    previewUrl: z.string().nullable(),
    provider: z.string(),
    provider_metadata: z.object({
      public_id: z.string(),
      resource_type: z.string()
    }).nullish(),
    createdAt: z.string(),
    updatedAt: z.string(),
    publishedAt: z.string()
  }).nullable(),
  
  products: z.array(z.object({
    id: z.number(),
    documentId: z.string(),
    name: z.string(),
    slug: z.string(),
    description: z.string(),
    base_price: z.number(),
    featured: z.boolean(),
    active: z.boolean(),
    pieza_unica: z.boolean(),
    meta_title: z.string().nullable(),
    age_range: z.string().nullable(),
    material: z.string().nullable(),
    createdAt: z.string(),
    updatedAt: z.string(),
    publishedAt: z.string().nullable(),
  })),

  // Relaciones adicionales encontradas en la respuesta
  subcategories: z.array(z.unknown()),
  category: z.unknown().nullable(),
  product_sets: z.array(z.object({
    id: z.number(),
    documentId: z.string(),
    name: z.string(),
    slug: z.string(),
    description: z.string(),
    price: z.number(),
    active: z.boolean(),
    meta_title: z.string().nullable(),
    meta_description: z.string().nullable(),
    createdAt: z.string(),
    updatedAt: z.string(),
    publishedAt: z.string()
  }))
})

// ===== CONTENT COLLECTIONS =====

/** Producto ya pasado por el loader y validado. Reemplaza los tipos de Strapi v4. */
export type Product = z.infer<typeof productSchema>

/** Categoría ya pasada por el loader y validada. Reemplaza los tipos de Strapi v4. */
export type Category = z.infer<typeof categorySchema>

const tiendaSchema = z.object({
  id: z.string(),
  documentId: z.string(),
  nombre: z.string(),
  whatsapp: z.string().regex(/^[0-9]{8,15}$/).nullable(),
  texto_envio: z.string(),
  moneda: z.string(),
  createdAt: z.string(),
  updatedAt: z.string(),
  publishedAt: z.string().nullable(),
})

/** Datos de la tienda (tipo único). whatsapp puede ser null. */
export type Tienda = z.infer<typeof tiendaSchema>

const collections = {
  'products-seo': defineCollection({
    loader: strapiLoader('products', {
      populate: ['image', 'categories', 'product_variants', 'product_sets'],
    }),
    schema: productSchema
  }),

  categories: defineCollection({
    loader: strapiLoader('categories', {
      populate: ['image', 'products', 'subcategories', 'category', 'product_sets'],
    }),
    schema: categorySchema
  }),

  tienda: defineCollection({
    loader: strapiSingleLoader('tienda'),
    schema: tiendaSchema
  })
}

export { collections } 