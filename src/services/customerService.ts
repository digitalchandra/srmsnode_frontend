
import api from './api'

export interface Customer {
  _id: string
  tenantId: string
  name: string
  phone: string
  email: string
  address: string
  status: 'ACTIVE' | 'INACTIVE'
  note: string
  createdAt: string
  updatedAt: string
}

export interface CustomerPayload {
  name: string
  phone?: string
  email?: string
  address?: string
  note?: string
}

export interface CustomerListResponse {
  success: boolean
  data: Customer[]
  pagination: {
    total: number
    page: number
    limit: number
    totalPages: number
  }
}

export const customerService = {
  getCustomers: (params?: {
    page?: number
    limit?: number
    search?: string
    status?: 'ACTIVE' | 'INACTIVE'
  }) => api.get<CustomerListResponse>('/customers', { params }),

  getCustomer: (id: string) =>
    api.get(`/customers/${id}`),

  createCustomer: (data: CustomerPayload) =>
    api.post('/customers', data),

  updateCustomer: (id: string, data: Partial<CustomerPayload> & {
    status?: 'ACTIVE' | 'INACTIVE'
  }) => api.put(`/customers/${id}`, data),

  deactivateCustomer: (id: string) =>
    api.delete(`/customers/${id}`),
}
