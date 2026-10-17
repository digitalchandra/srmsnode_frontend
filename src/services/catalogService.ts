
import api from './api'

export interface Category {
  _id: string
  name: string
  description?: string
  status?: string
}

export interface Brand {
  _id: string
  name: string
  description?: string
  status?: string
}

export interface CategoryPayload {
  name: string
  description?: string
  status?: string
}

export const catalogService = {
  getCategories: () => api.get('/categories'),
  createCategory: (data: CategoryPayload) =>
    api.post('/categories', data),
  updateCategory: (id: string, data: Partial<CategoryPayload>) =>
    api.put(`/categories/${id}`, data),
  deleteCategory: (id: string) =>
    api.delete(`/categories/${id}`),

  getBrands: () => api.get('/brands'),
  createBrand: (data: { name: string; description?: string }) =>
    api.post('/brands', data),
  updateBrand: (id: string, data: { name?: string; description?: string }) =>
    api.put(`/brands/${id}`, data),
  deleteBrand: (id: string) =>
    api.delete(`/brands/${id}`),
}
