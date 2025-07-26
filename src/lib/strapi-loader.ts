import type { StrapiResponse, StrapiEntity } from './strapi-types'

/**
 * Función helper reutilizable para crear loaders de Content Layer que se conecten a Strapi
 * @param endpoint - Endpoint de Strapi (ej: 'products', 'categories')
 * @returns Loader object compatible con Content Layer API
 */
export function strapiLoader<T>(endpoint: string) {
  return {
    name: `strapi-${endpoint}`,
    load: async () => {
      try {
        // Construir URL con base + endpoint + populate automático
        const baseUrl = import.meta.env.STRAPI_URL || 'http://localhost:1337'
        const url = `${baseUrl}/api/${endpoint}?populate=*`
        
        console.log(`[StrapiLoader] Fetching: ${url}`)
        
        // Fetch automático con error handling
        const response = await fetch(url)
        
        if (!response.ok) {
          throw new Error(`HTTP Error: ${response.status} ${response.statusText} for ${url}`)
        }
        
        // Parse JSON con error handling
        let data: StrapiResponse<T>
        try {
          data = await response.json()
        } catch (parseError) {
          throw new Error(`JSON Parse Error for ${url}: ${parseError}`)
        }
        
        // Verificar estructura de datos de Strapi
        if (!data.data || !Array.isArray(data.data)) {
          throw new Error(`Invalid Strapi response structure for ${url}. Expected { data: [] }, got: ${JSON.stringify(data)}`)
        }
        
        console.log(`[StrapiLoader] Successfully fetched ${data.data.length} items from ${endpoint}`)
        
        // Transformación de datos: Convertir de formato Strapi a formato Content Layer
        const transformedData = data.data.map((item: StrapiEntity<T>) => {
          // Input: { id: number, attributes: T }
          // Output: { id: string, ...attributes }
          return {
            id: item.id.toString(), // Convertir ID numérico a string
            ...item.attributes       // Flatten estructura - spread attributes
          }
        })
        
        return transformedData
        
      } catch (error) {
        // Error handling comprehensivo con logging descriptivo
        console.error(`[StrapiLoader] Error loading ${endpoint}:`, error)
        
        // Re-throw con contexto adicional para debugging
        if (error instanceof Error) {
          throw new Error(`Failed to load ${endpoint} from Strapi: ${error.message}`)
        } else {
          throw new Error(`Failed to load ${endpoint} from Strapi: Unknown error`)
        }
      }
    }
  }
} 