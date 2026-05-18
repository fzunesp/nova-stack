import { BaseService } from './base'
import type { ProductRecord } from './types'

const ALLOWED_FIELDS: (keyof ProductRecord)[] = ['name', 'description', 'price', 'sku', 'status']
const REQUIRED_FIELDS: (keyof ProductRecord)[] = ['name', 'price', 'status']

class ProductService extends BaseService<ProductRecord> {
  protected collection = 'products'
  protected allowedFields = ALLOWED_FIELDS
  protected requiredCreateFields = REQUIRED_FIELDS

  constructor() {
    super('products')
  }
}

export const productService = new ProductService()
