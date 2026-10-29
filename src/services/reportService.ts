
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
}
