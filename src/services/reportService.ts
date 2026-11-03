
import api from './api'

export type SalesPeriodSummary = {
  salesCount: number
  totalSales: number
  totalPaid: number
  outstanding: number
}

export type SalesSummary = {
  timezone: string
  today: SalesPeriodSummary
  thisWeek: SalesPeriodSummary
  thisMonth: SalesPeriodSummary
  completedSalesCount: number
}

export type DailySale = {
  date: string
  salesCount: number
  totalSales: number
  totalPaid: number
}

export type DailySalesReport = {
  timezone: string
  startDate: string
  endDate: string
  dailySales: DailySale[]
}

// Best Sellers
export type BestSeller = {
  productId: string
  productName: string
  sku: string
  unit: string
  sellingPrice: number
  currentStock: number
  totalQuantitySold: number
  totalSalesAmount: number
  totalOrders: number
}

// Low Stock Alerts
export type LowStockAlert = {
  _id: string
  name: string
  sku: string
  barcode: string | null
  unit: string
  sellingPrice: number
  currentStock: number
  lowStockThreshold: number
  stockStatus: 'LOW_STOCK' | 'OUT_OF_STOCK'
}

export const reportService = {
  async getSalesSummary(): Promise<SalesSummary> {
    const response = await api.get('/reports/sales-summary')
    return response.data.data as SalesSummary
  },

  async getDailySales(
    startDate: string,
    endDate: string,
  ): Promise<DailySalesReport> {
    const response = await api.get('/reports/daily-sales', {
      params: { startDate, endDate },
    })

    return response.data.data as DailySalesReport
  },

  async getBestSellers(): Promise<BestSeller[]> {
    const response = await api.get('/reports/best-sellers')
    return response.data.data as BestSeller[]
  },

  async getLowStockAlerts(): Promise<LowStockAlert[]> {
    const response = await api.get('/inventory-alerts/low-stock')
    return response.data.data as LowStockAlert[]
  },
}
