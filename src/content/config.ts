import { defineCollection, z } from 'astro:content'
import { strapiLoader } from '../lib/strapi-loader'
import type { StrapiProduct, StrapiCategory } from '../lib/strapi-types'

// ===== SCHEMAS ZOD =====

// Schema para productos transformados (después de strapiLoader)
// Nota: El strapiLoader hace "flatten" de la estructura Strapi { attributes: T } -> T
const productSchema = z.object({
  // ID transformado por strapiLoader
  id: z.string(),
  
  // Campos primitivos (flattened desde attributes)
  name: z.string(),
  slug: z.string(),
  description: z.string(),
  base_price: z.number(),
  sku: z.string(),
  
  // Estados (flattened desde attributes)
  featured: z.boolean(),
  active: z.boolean(),
  
  // Timestamps (flattened desde attributes)
  createdAt: z.string(),
  updatedAt: z.string(),
  
  // Relaciones complejas (conservan estructura original de Strapi)
  images: z.object({
    data: z.array(z.object({
      id: z.number(),
      attributes: z.object({
        name: z.string(),
        url: z.string(),
        alternativeText: z.string().nullable(),
        width: z.number(),
        height: z.number(),
        formats: z.object({
          thumbnail: z.object({
            name: z.string(),
            url: z.string(),
            width: z.number(),
            height: z.number(),
            size: z.number()
          }).optional(),
          small: z.object({
            name: z.string(),
            url: z.string(),
            width: z.number(),
            height: z.number(),
            size: z.number()
          }).optional(),
          medium: z.object({
            name: z.string(),
            url: z.string(),
            width: z.number(),
            height: z.number(),
            size: z.number()
          }).optional(),
          large: z.object({
            name: z.string(),
            url: z.string(),
            width: z.number(),
            height: z.number(),
            size: z.number()
          }).optional()
        }),
        createdAt: z.string(),
        updatedAt: z.string()
      })
    }))
  }),
  
  categories: z.object({
    data: z.array(z.object({
      id: z.number(),
      attributes: z.object({
        name: z.string(),
        slug: z.string(),
        description: z.string(),
        active: z.boolean(),
        order: z.number(),
        createdAt: z.string(),
        updatedAt: z.string()
      })
    }))
  }),
  
  variants: z.object({
    data: z.array(z.object({
      id: z.number(),
      attributes: z.object({
        name: z.string(),
        sku: z.string(),
        size: z.string(),
        color: z.string(),
        price: z.number(),
        stock_quantity: z.number(),
        low_stock_threshold: z.number(),
        active: z.boolean(),
        available: z.boolean(),
        createdAt: z.string(),
        updatedAt: z.string()
      })
    }))
  })
})

// Schema para categorías transformadas (después de strapiLoader)
// Nota: El strapiLoader hace "flatten" de la estructura Strapi { attributes: T } -> T
const categorySchema = z.object({
  // ID transformado por strapiLoader
  id: z.string(),
  
  // Campos básicos (flattened desde attributes)
  name: z.string(),
  slug: z.string(),
  description: z.string(),
  
  // Configuración (flattened desde attributes)
  active: z.boolean(),
  order: z.number(),
  
  // Timestamps (flattened desde attributes)
  createdAt: z.string(),
  updatedAt: z.string(),
  
  // Relaciones
  image: z.object({
    data: z.object({
      id: z.number(),
      attributes: z.object({
        name: z.string(),
        url: z.string(),
        alternativeText: z.string().nullable(),
        width: z.number(),
        height: z.number(),
        formats: z.object({
          thumbnail: z.object({
            name: z.string(),
            url: z.string(),
            width: z.number(),
            height: z.number(),
            size: z.number()
          }).optional(),
          small: z.object({
            name: z.string(),
            url: z.string(),
            width: z.number(),
            height: z.number(),
            size: z.number()
          }).optional(),
          medium: z.object({
            name: z.string(),
            url: z.string(),
            width: z.number(),
            height: z.number(),
            size: z.number()
          }).optional(),
          large: z.object({
            name: z.string(),
            url: z.string(),
            width: z.number(),
            height: z.number(),
            size: z.number()
          }).optional()
        }),
        createdAt: z.string(),
        updatedAt: z.string()
      })
    }).nullable()
  }),
  
  parent_category: z.object({
    data: z.object({
      id: z.number(),
      attributes: z.object({
        name: z.string(),
        slug: z.string(),
        description: z.string(),
        active: z.boolean(),
        order: z.number(),
        createdAt: z.string(),
        updatedAt: z.string()
      })
    }).nullable()
  })
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