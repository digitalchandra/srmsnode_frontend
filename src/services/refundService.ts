
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
  refundedBy?: {
    _id: string
    name?: string
    email?: string
  } | string
  status: 'COMPLETED' | 'VOIDED'
}

export type SalesReturnForRefund = {
  _id: string
  returnNumber: string
  saleId: {
    _id: string
    saleDate?: string
    totalAmount?: number
    paidAmount?: number
    paymentStatus?: string
  } | string
  customerId?: {
    _id: string
    name?: string
    phone?: string
  } | string | null
  totalRefundAmount: number
  refundStatus: 'PENDING' | 'REFUNDED' | 'STORE_CREDIT' | 'REJECTED'
  status: 'DRAFT' | 'COMPLETED' | 'CANCELLED'
}

export type RefundHistoryResponse = {
  salesReturn: SalesReturnForRefund
  refunds: Refund[]
  totalRefunded: number
  remainingRefundable: number
}

export const refundService = {
  async getCompletedReturns() {
    const response = await api.get('/sales-returns', {
      params: { page: 1, limit: 100 },
    })

    const returns = response.data?.data?.returns ?? []

    return returns.filter(
      (item: SalesReturnForRefund) => item.status === 'COMPLETED',
    ) as SalesReturnForRefund[]
  },

  async getRefundHistory(returnId: string) {
    const response = await api.get(`/refunds/${returnId}`)

    return response.data?.data as RefundHistoryResponse
  },

  async createRefund(
    returnId: string,
    payload: {
      amount: number
      refundMethod: RefundMethod
      referenceNumber?: string
      note?: string
    },
  ) {
    const response = await api.post(`/refunds/${returnId}`, payload)

    return response.data
  },
}
