
import api from './api'

export interface InventoryBatchPayload {
  productId: string
  batchNumber: string
  quantity: number
  costPrice: number
  manufacturedDate?: string
  expiryDate?: string
}

export interface StockAdjustmentPayload {
  productId: string
  batchId: string
  adjustmentType: 'INCREASE' | 'DECREASE'
  quantity: number
  reason: string
  note?: string
}

export const inventoryService = {
  getBatches: () => api.get('/inventory-batches'),
  getBatchById: (id: string) => api.get(`/inventory-batches/${id}`),
  createBatch: (data: InventoryBatchPayload) =>
    api.post('/inventory-batches', data),
  getExpiryBatches: () => api.get('/inventory-batches/expiry'),

  createStockAdjustment: (data: StockAdjustmentPayload) =>
    api.post('/stock-adjustments', data),
  getStockAdjustments: () => api.get('/stock-adjustments'),

  getStockMovements: () => api.get('/stock-movements'),
}
