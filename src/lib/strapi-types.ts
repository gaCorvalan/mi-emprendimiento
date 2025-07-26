// ===== INTERFACES BASE DE STRAPI =====

export interface StrapiResponse<T> {
  data: StrapiEntity<T>[]
  meta: {
    pagination?: {
      page: number
      pageSize: number
      pageCount: number
      total: number
    }
  }
}

export interface StrapiEntity<T> {
  id: number
  attributes: T
}

// ===== CONTENT TYPES ESPECÍFICOS =====

export interface StrapiProduct {
  // Campos básicos
  name: string
  slug: string
  description: string
  base_price: number
  sku: string
  
  // Estados
  featured: boolean
  active: boolean
  
  // Timestamps
  createdAt: string
  updatedAt: string
  
  // Relaciones
  images: {
    data: StrapiEntity<StrapiMedia>[]
  }
  categories: {
    data: StrapiEntity<StrapiCategory>[]
  }
  variants: {
    data: StrapiEntity<StrapiVariant>[]
  }
}

export interface StrapiCategory {
  // Campos básicos
  name: string
  slug: string
  description: string
  
  // Configuración
  active: boolean
  order: number
  
  // Timestamps
  createdAt: string
  updatedAt: string
  
  // Relaciones
  image: {
    data: StrapiEntity<StrapiMedia> | null
  }
  parent_category: {
    data: StrapiEntity<StrapiCategory> | null
  }
}

export interface StrapiVariant {
  // Identificación
  name: string
  sku: string
  
  // Atributos
  size: string
  color: string
  price: number
  
  // Inventario
  stock_quantity: number
  low_stock_threshold: number
  
  // Estados
  active: boolean
  available: boolean
  
  // Timestamps
  createdAt: string
  updatedAt: string
}

export interface StrapiMedia {
  // Básico
  name: string
  url: string
  alternativeText: string | null
  
  // Dimensiones
  width: number
  height: number
  
  // Formatos
  formats: {
    thumbnail?: StrapiImageFormat
    small?: StrapiImageFormat
    medium?: StrapiImageFormat
    large?: StrapiImageFormat
  }
  
  // Timestamps
  createdAt: string
  updatedAt: string
}

export interface StrapiImageFormat {
  name: string
  url: string
  width: number
  height: number
  size: number
}

export interface StrapiPromotion {
  // Básico
  name: string
  description: string
  
  // Descuento
  discount_type: 'percentage' | 'fixed'
  discount_value: number
  
  // Fechas
  start_date: string
  end_date: string
  
  // Aplicación
  applies_to: 'all' | 'categories' | 'products'
  
  // Estados
  active: boolean
  
  // Timestamps
  createdAt: string
  updatedAt: string
  
  // Relaciones opcionales
  categories?: {
    data: StrapiEntity<StrapiCategory>[]
  }
  products?: {
    data: StrapiEntity<StrapiProduct>[]
  }
} 