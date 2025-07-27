import { defineCollection, z } from 'astro:content'
import { strapiLoader } from '../lib/strapi-loader'
import type { StrapiProduct, StrapiCategory } from '../lib/strapi-types'

// ===== SCHEMAS ZOD =====

// Schema para productos transformados (después de strapiLoader)
// Basado en la estructura REAL de Strapi v5 con populate=*
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
        })
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
        })
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
        })
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
        })
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
    }),
    createdAt: z.string(),
    updatedAt: z.string(),
    publishedAt: z.string()
  }).nullable(),
  
  categories: z.array(z.object({
    id: z.number(),
    documentId: z.string(),
    name: z.string(),
    slug: z.string(),
    description: z.string(),
    order: z.number(),
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
    material_variant: z.string().nullable(),
    price: z.number().nullable(),
    stock_quantity: z.number(),
    low_stock_threshold: z.number(),
    weight: z.number().nullable(),
    active: z.boolean(),
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
  description: z.string(),
  order: z.number(),
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
        })
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
        })
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
        })
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
        })
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
    }),
    createdAt: z.string(),
    updatedAt: z.string(),
    publishedAt: z.string()
  }).nullable(),
  
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

const collections = {
  // Collection estática para productos (SEO y static generation)
  'products-seo': defineCollection({
    loader: strapiLoader<StrapiProduct>('products'),
    schema: productSchema
  }),
  
  // Collection estática para categorías (navegación y filtrado)
  categories: defineCollection({
    loader: strapiLoader<StrapiCategory>('categories'),
    schema: categorySchema
  })
}

export { collections } 