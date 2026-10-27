
import { useEffect, useState } from 'react'
import api from '../services/api'

type Sale = {
  _id: string
  saleNumber?: string
  totalAmount: number
  paidAmount: number
  paymentStatus: 'UNPAID' | 'PARTIAL' | 'PAID'
  status: string
  customerId?: { name?: string; phone?: string } | string | null
}

type Payment = {
  _id: string
  amount: number
  paymentMethod: string
  paymentDate: string
  referenceNumber?: string
  note?: string
  status: 'COMPLETED' | 'VOIDED'
}

export default function Payments() {
  const [sales, setSales] = useState<Sale[]>([])
  const [selectedSaleId, setSelectedSaleId] = useState('')
  const [payments, setPayments] = useState<Payment[]>([])
  const [amount, setAmount] = useState('')
  const [method, setMethod] = useState('CASH')
  const [referenceNumber, setReferenceNumber] = useState('')
  const [note, setNote] = useState('')
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')

  const selectedSale = sales.find((sale) => sale._id === selectedSaleId)
  const balance = selectedSale
    ? Math.max(0, Number(selectedSale.totalAmount) - Number(selectedSale.paidAmount || 0))
    : 0

  async function loadSales() {
    setLoading(true)
    setError('')

    try {
      const response = await api.get('/sales', {
        params: { page: 1, limit: 100 },
      })

      const data = response.data?.data
      const list: Sale[] = Array.isArray(data?.sales) ? data.sales : []

      setSales(list.filter((sale) => sale.status === 'COMPLETED'))

      if (selectedSaleId && !list.some((sale) => sale._id === selectedSaleId)) {
        setSelectedSaleId('')
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to load sales.')
    } finally {
      setLoading(false)
    }
  }

  async function loadPayments(saleId: string) {
    if (!saleId) {
      setPayments([])
      return
    }

    try {
      const response = await api.get(`/payments/${saleId}`)
      setPayments(response.data?.data?.payments || [])
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to load payment history.')
    }
  }

  useEffect(() => {
    void loadSales()
  }, [])

  useEffect(() => {
    void loadPayments(selectedSaleId)
  }, [selectedSaleId])

  async function recordPayment(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError('')
    setMessage('')

    const paymentAmount = Number(amount)

    if (!selectedSaleId) {
      setError('Please select a sale.')
      return
    }

    if (!Number.isFinite(paymentAmount) || paymentAmount <= 0) {
      setError('Enter a valid payment amount.')
      return
    }

    if (paymentAmount > balance + 0.000001) {
      setError(`Payment cannot exceed the outstanding balance of ¥${balance.toLocaleString()}.`)
      return
    }

    setSaving(true)

    try {
      await api.post(`/payments/${selectedSaleId}`, {
        amount: paymentAmount,
        paymentMethod: method,
        referenceNumber,
        note,
      })

      setMessage('Payment recorded successfully.')
      setAmount('')
      setReferenceNumber('')
      setNote('')

      await loadSales()
      await loadPayments(selectedSaleId)
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to record payment.')
    } finally {
      setSaving(false)
    }
  }

  async function voidPayment(paymentId: string) {
    const confirmed = window.confirm('Are you sure you want to void this payment?')
    if (!confirmed) return

    setError('')
    setMessage('')

    try {
      await api.patch(`/payments/${paymentId}/void`)
      setMessage('Payment voided successfully.')
      await loadSales()
      await loadPayments(selectedSaleId)
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to void payment.')
    }
  }

  function customerName(sale: Sale) {
    if (sale.customerId && typeof sale.customerId === 'object') {
      return sale.customerId.name || sale.customerId.phone || 'Customer'
    }
    return 'Customer'
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Payment Management</h1>
        <p className="mt-1 text-sm text-gray-500">
          Record payments, review payment history, and check outstanding balances.
        </p>
      </div>

      {error && (
        <div role="alert" className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {message && (
        <div role="status" className="rounded-lg border border-green-200 bg-green-50 p-3 text-sm text-green-700">
          {message}
        </div>
      )}

      <section className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-lg font-semibold">Select Completed Sale</h2>
          <button
            type="button"
            onClick={() => void loadSales()}
            className="rounded-lg border px-3 py-2 text-sm hover:bg-gray-50"
          >
            Refresh Sales
          </button>
        </div>

        {loading ? (
          <p className="text-sm text-gray-500">Loading sales...</p>
        ) : (
          <select
            value={selectedSaleId}
            onChange={(event) => {
              setSelectedSaleId(event.target.value)
              setError('')
              setMessage('')
            }}
            className="w-full rounded-lg border border-gray-300 px-3 py-2.5"
          >
            <option value="">Choose a completed sale</option>
            {sales.map((sale) => (
              <option key={sale._id} value={sale._id}>
                {(sale.saleNumber || sale._id)} — {customerName(sale)} — ¥
                {Number(sale.totalAmount).toLocaleString()} — {sale.paymentStatus}
              </option>
            ))}
          </select>
        )}

        {!loading && sales.length === 0 && (
          <p className="mt-3 text-sm text-gray-500">
            No completed sales found.
          </p>
        )}
      </section>

      {selectedSale && (
        <>
          <section className="grid gap-4 sm:grid-cols-3">
            <div className="rounded-xl border bg-white p-5">
              <p className="text-sm text-gray-500">Total Amount</p>
              <p className="mt-2 text-2xl font-bold">
                ¥{Number(selectedSale.totalAmount).toLocaleString()}
              </p>
            </div>
            <div className="rounded-xl border bg-white p-5">
              <p className="text-sm text-gray-500">Paid Amount</p>
              <p className="mt-2 text-2xl font-bold text-green-700">
                ¥{Number(selectedSale.paidAmount || 0).toLocaleString()}
              </p>
            </div>
            <div className="rounded-xl border bg-white p-5">
              <p className="text-sm text-gray-500">Balance Due</p>
              <p className="mt-2 text-2xl font-bold text-orange-600">
                ¥{balance.toLocaleString()}
              </p>
              <p className="mt-1 text-xs text-gray-500">
                Status: {selectedSale.paymentStatus}
              </p>
            </div>
          </section>

          {balance > 0 && (
            <section className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
              <h2 className="mb-4 text-lg font-semibold">Record Payment</h2>

              <form onSubmit={recordPayment} className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-1 block text-sm font-medium">Payment Amount (¥)</label>
                  <input
                    type="number"
                    min="0.01"
                    max={balance}
                    step="0.01"
                    required
                    value={amount}
                    onChange={(event) => setAmount(event.target.value)}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2"
                    placeholder="Enter amount"
                  />
                  <button
                    type="button"
                    onClick={() => setAmount(balance.toFixed(2))}
                    className="mt-1 text-sm text-blue-600 hover:underline"
                  >
                    Pay full balance
                  </button>
                </div>

                <div>
                  <label className="mb-1 block text-sm font-medium">Payment Method</label>
                  <select
                    value={method}
                    onChange={(event) => setMethod(event.target.value)}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2"
                  >
                    <option value="CASH">Cash</option>
                    <option value="CARD">Card</option>
                    <option value="BANK_TRANSFER">Bank Transfer</option>
                    <option value="MOBILE_PAYMENT">Mobile Payment</option>
                    <option value="OTHER">Other</option>
                  </select>
                </div>

                <div>
                  <label className="mb-1 block text-sm font-medium">Reference Number (optional)</label>
                  <input
                    value={referenceNumber}
                    onChange={(event) => setReferenceNumber(event.target.value)}
                    maxLength={150}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2"
                    placeholder="Transaction or receipt reference"
                  />
                </div>

                <div>
                  <label className="mb-1 block text-sm font-medium">Note (optional)</label>
                  <input
                    value={note}
                    onChange={(event) => setNote(event.target.value)}
                    maxLength={500}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2"
                    placeholder="Payment note"
                  />
                </div>

                <div className="sm:col-span-2">
                  <button
                    type="submit"
                    disabled={saving || balance <= 0}
                    className="rounded-lg bg-blue-600 px-5 py-2.5 font-medium text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {saving ? 'Recording...' : 'Record Payment'}
                  </button>
                </div>
              </form>
            </section>
          )}

          <section className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
            <div className="border-b p-5">
              <h2 className="text-lg font-semibold">Payment History</h2>
            </div>

            {payments.length === 0 ? (
              <p className="p-5 text-sm text-gray-500">No payment records for this sale.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200 text-sm">
                  <thead className="bg-gray-50 text-left text-gray-600">
                    <tr>
                      <th className="px-4 py-3">Date</th>
                      <th className="px-4 py-3">Amount</th>
                      <th className="px-4 py-3">Method</th>
                      <th className="px-4 py-3">Reference</th>
                      <th className="px-4 py-3">Status</th>
                      <th className="px-4 py-3">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {payments.map((payment) => (
                      <tr key={payment._id}>
                        <td className="whitespace-nowrap px-4 py-3">
                          {new Date(payment.paymentDate).toLocaleString()}
                        </td>
                        <td className="whitespace-nowrap px-4 py-3 font-medium">
                          ¥{Number(payment.amount).toLocaleString()}
                        </td>
                        <td className="px-4 py-3">{payment.paymentMethod.replaceAll('_', ' ')}</td>
                        <td className="px-4 py-3">{payment.referenceNumber || '—'}</td>
                        <td className="px-4 py-3">
                          <span className={`rounded-full px-2 py-1 text-xs ${
                            payment.status === 'COMPLETED'
                              ? 'bg-green-100 text-green-700'
                              : 'bg-gray-100 text-gray-700'
                          }`}>
                            {payment.status}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          {payment.status === 'COMPLETED' && (
                            <button
                              type="button"
                              onClick={() => voidPayment(payment._id)}
                              className="text-red-600 hover:underline"
                            >
                              Void
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        </>
      )}
    </div>
  )
}
