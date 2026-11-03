
import api from './api'

export type RefundMethod =
  | 'CASH'
  | 'CARD'
  | 'BANK_TRANSFER'
  | 'MOBILE_PAYMENT'
  | 'STORE_CREDIT'
  | 'OTHER'

export type Refund = {
  _id: string
  tenantId: string
  salesReturnId: string
  saleId: string
  amount: number
  refundMethod: RefundMethod
  referenceNumber?: string
  note?: string
  refundDate: string
  status: 'COMPLETED' | 'VOIDED'
}

export type SalesReturnForRefund = {
  _id: string
  returnNumber: string
  totalRefundAmount: number
  status: 'DRAFT' | 'COMPLETED' | 'CANCELLED'
  refundStatus: string
}

export type RefundHistory = {
  refunds: Refund[]
  totalRefunded: number
  remainingRefundable: number
  status: string
}

export const refundService = {
 
    async getCompletedReturns(): Promise<SalesReturnForRefund[]> {
      const response = await api.get('/sales-returns')

      const returns = response.data?.data?.returns

      if (!Array.isArray(returns)) {
        return []
      }

      return returns.filter(
        (item: SalesReturnForRefund) => item.status === 'COMPLETED'
      )
    },


  async createRefund(
    returnId: string,
    refundData: {
      amount: number
      refundMethod: RefundMethod
      referenceNumber?: string
      note?: string
    },
  ) {
    const response = await api.post(
      `/refunds/${returnId}`,
      refundData,
    )

    return response.data
  },

  async getRefundHistory(returnId: string): Promise<RefundHistory> {
    const response = await api.get(`/refunds/${returnId}`)
    const result = response.data

    return {
      refunds: result?.data ?? [],
      totalRefunded: Number(result?.totalRefunded) || 0,
      remainingRefundable: Number(result?.remainingRefundable) || 0,
      status: result?.status ?? 'PENDING',
    }
  },
}
