
import api from './api'

export interface Product {
  _id: string
  name: string
  sku: string
  barcode?: string
  description?: string
  productType?: string
  unit?: string
  status?: string

  pricing: {
    costPrice: number
    sellingPrice: number
  }

  inventory: {
    trackStock: boolean
    currentStock: number
    lowStockThreshold: number
  }

  categoryId?: {
    _id: string
    name: string
  } | null

  brandId?: {
    _id: string
    name: string
  } | null

  expiryTracking?: {
    enabled: boolean
  }
}

export interface ProductPayload {
  categoryId: string
  brandId?: string
  name: string
  sku: string
  barcode?: string
  description?: string
  productType: string
  unit: string
  costPrice: number
  sellingPrice: number
  trackStock?: boolean
  lowStockThreshold: number
  expiryTracking: boolean
}

export const productService = {
  getAll: () => api.get('/products'),

  getLowStock: () => api.get('/products/low-stock'),

  getById: (id: string) => api.get(`/products/${id}`),

  create: (data: ProductPayload) => api.post('/products', data),

  update: (id: string, data: Partial<ProductPayload>) =>
    api.put(`/products/${id}`, data),

  delete: (id: string) => api.delete(`/products/${id}`),
}
