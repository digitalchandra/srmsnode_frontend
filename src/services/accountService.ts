
import api from './api'

export interface VendorAccount {
  tenant: {
    _id: string
    businessName: string
    subdomain: string
    country: string
    currency: string
    timezone: string
    status: string
    createdAt: string
    approvedAt?: string | null
    deactivatedAt?: string | null
  }
  owner: {
    _id: string
    name: string
    email: string
    role: string
    status: string
    createdAt?: string
  }
  settings: {
    business?: {
      businessName?: string
      phone?: string
      email?: string
      address?: string
      taxNumber?: string
      logo?: string
    }
    regional?: {
      country?: string
      currency?: string
      timezone?: string
    }
  } | null
}

export interface UpdateAccountData {
  name?: string
  businessName?: string
  phone?: string
  email?: string
  address?: string
  taxNumber?: string
  logo?: string
}

export interface DeactivateAccountData {
  password: string
  reason?: string
}

const accountService = {
  async getAccount(): Promise<VendorAccount> {
    const response = await api.get('/auth/account')
    return response.data.data
  },

  async updateAccount(data: UpdateAccountData) {
    const response = await api.put('/auth/account', data)
    return response.data
  },

  async deactivateAccount(data: DeactivateAccountData) {
    const response = await api.post('/auth/deactivate', data)
    return response.data
  },
}

export default accountService
