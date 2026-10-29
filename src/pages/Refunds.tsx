
import { useCallback, useEffect, useState } from 'react'
import {
  AlertCircle,
  CheckCircle,
  RefreshCw,
  RotateCcw,
  Wallet,
} from 'lucide-react'
import {
  refundService,
  type Refund,
  type RefundMethod,
  type SalesReturnForRefund,
} from '../services/refundService'

const money = (value: number) =>
  new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'JPY',
    maximumFractionDigits: 2,
  }).format(Number(value) || 0)

const getId = (value: unknown): string => {
  if (typeof value === 'string') return value
  if (value && typeof value === 'object' && '_id' in value) {
    return String(value._id)
  }
  return ''
}

export default function Refunds() {
  const [returns, setReturns] = useState<SalesReturnForRefund[]>([])
  const [selectedId, setSelectedId] = useState('')
  const [history, setHistory] = useState<Refund[]>([])
  const [remaining, setRemaining] = useState(0)
  const [totalRefunded, setTotalRefunded] = useState(0)

  const [amount, setAmount] = useState('')
  const [method, setMethod] = useState<RefundMethod>('CASH')
  const [referenceNumber, setReferenceNumber] = useState('')
  const [note, setNote] = useState('')

  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const loadReturns = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const data = await refundService.getCompletedReturns()
      setReturns(data)
      setSelectedId((current) =>
        data.some((item) => item._id === current)
          ? current
          : data[0]?._id ?? '',
      )
    } catch (err: unknown) {
      setError(
        err instanceof Error ? err.message : 'Could not load sales returns.',
      )
    } finally {
      setLoading(false)
    }
  }, [])

  const loadHistory = useCallback(async (returnId: string) => {
    if (!returnId) {
      setHistory([])
      setRemaining(0)
      setTotalRefunded(0)
      return
    }

    setError('')
    try {
      const data = await refundService.getRefundHistory(returnId)
      setHistory(data.refunds ?? [])
      setRemaining(Number(data.remainingRefundable) || 0)
      setTotalRefunded(Number(data.totalRefunded) || 0)
    } catch (err: unknown) {
      setError(
        err instanceof Error ? err.message : 'Could not load refund history.',
      )
    }
  }, [])

  useEffect(() => {
    void loadReturns()
  }, [loadReturns])

  useEffect(() => {
    void loadHistory(selectedId)
  }, [selectedId, loadHistory])

  const selectedReturn = returns.find((item) => item._id === selectedId)

  const handleRefund = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setError('')
    setSuccess('')

    const refundAmount = Number(amount)

    if (!selectedId) {
      setError('Please select a completed sales return.')
      return
    }

    if (!Number.isFinite(refundAmount) || refundAmount <= 0) {
      setError('Enter a valid refund amount.')
      return
    }

    if (refundAmount > remaining) {
      setError(`Refund cannot exceed ${money(remaining)}.`)
      return
    }

    setSubmitting(true)
    try {
      await refundService.createRefund(selectedId, {
        amount: refundAmount,
        refundMethod: method,
        referenceNumber: referenceNumber.trim() || undefined,
        note: note.trim() || undefined,
      })

      setSuccess('Refund recorded successfully.')
      setAmount('')
      setReferenceNumber('')
      setNote('')

      await loadHistory(selectedId)
      await loadReturns()
    } catch (err: unknown) {
      setError(
        err instanceof Error ? err.message : 'Failed to record refund.',
      )
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return <div className="p-6 text-gray-500">Loading refunds...</div>
  }

  return (
    <div className="space-y-6 p-4 md:p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Refund Management</h1>
          <p className="mt-1 text-sm text-gray-500">
            Record refunds for completed sales returns.
          </p>
        </div>
        <button
          type="button"
          onClick={() => {
            void loadReturns()
            void loadHistory(selectedId)
          }}
          className="flex items-center gap-2 rounded-lg border bg-white px-4 py-2 text-sm hover:bg-gray-50"
        >
          <RefreshCw size={16} /> Refresh
        </button>
      </div>

      {error && (
        <div role="alert" className="flex items-start gap-2 rounded-lg bg-red-50 p-3 text-sm text-red-700">
          <AlertCircle size={18} /> {error}
        </div>
      )}

      {success && (
        <div className="flex items-center gap-2 rounded-lg bg-green-50 p-3 text-sm text-green-700">
          <CheckCircle size={18} /> {success}
        </div>
      )}

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <div className="rounded-xl border bg-white p-5">
          <p className="text-sm text-gray-500">Completed Returns</p>
          <p className="mt-2 text-2xl font-bold">{returns.length}</p>
        </div>
        <div className="rounded-xl border bg-white p-5">
          <p className="text-sm text-gray-500">Total Refunded</p>
          <p className="mt-2 text-2xl font-bold text-green-700">
            {money(totalRefunded)}
          </p>
        </div>
        <div className="rounded-xl border bg-white p-5">
          <p className="text-sm text-gray-500">Remaining Refundable</p>
          <p className="mt-2 text-2xl font-bold text-orange-600">
            {money(remaining)}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
        <section className="rounded-xl border bg-white p-5">
          <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold">
            <Wallet size={20} /> Record a Refund
          </h2>

          <form onSubmit={handleRefund} className="space-y-4">
            <div>
              <label htmlFor="salesReturn" className="mb-1 block text-sm font-medium">
                Completed Sales Return
              </label>
              <select
                id="salesReturn"
                value={selectedId}
                onChange={(event) => {
                  setSelectedId(event.target.value)
                  setAmount('')
                  setSuccess('')
                }}
                required
                className="w-full rounded-lg border p-3"
              >
                <option value="">Select a sales return</option>
                {returns.map((item) => (
                  <option key={item._id} value={item._id}>
                    {item.returnNumber || item._id} — {money(item.totalRefundAmount)}
                  </option>
                ))}
              </select>
            </div>

            {selectedReturn && (
              <div className="rounded-lg bg-gray-50 p-3 text-sm">
                <p>
                  <span className="text-gray-500">Return status:</span>{' '}
                  {selectedReturn.status}
                </p>
                <p>
                  <span className="text-gray-500">Refund status:</span>{' '}
                  {selectedReturn.refundStatus}
                </p>
              </div>
            )}

            <div>
              <label htmlFor="refundAmount" className="mb-1 block text-sm font-medium">
                Refund Amount (¥)
              </label>
              <input
                id="refundAmount"
                type="number"
                min="0.01"
                max={remaining}
                step="0.01"
                value={amount}
                onChange={(event) => setAmount(event.target.value)}
                required
                disabled={!selectedId || remaining <= 0}
                className="w-full rounded-lg border p-3"
                placeholder="Enter refund amount"
              />
              <p className="mt-1 text-xs text-gray-500">
                Maximum refundable: {money(remaining)}
              </p>
            </div>

            <div>
              <label htmlFor="refundMethod" className="mb-1 block text-sm font-medium">
                Refund Method
              </label>
              <select
                id="refundMethod"
                value={method}
                onChange={(event) => setMethod(event.target.value as RefundMethod)}
                className="w-full rounded-lg border p-3"
              >
                <option value="CASH">Cash</option>
                <option value="CARD">Card</option>
                <option value="BANK_TRANSFER">Bank Transfer</option>
                <option value="MOBILE_PAYMENT">Mobile Payment</option>
                <option value="STORE_CREDIT">Store Credit</option>
                <option value="OTHER">Other</option>
              </select>
            </div>

            <div>
              <label htmlFor="referenceNumber" className="mb-1 block text-sm font-medium">
                Reference Number (optional)
              </label>
              <input
                id="referenceNumber"
                value={referenceNumber}
                onChange={(event) => setReferenceNumber(event.target.value)}
                className="w-full rounded-lg border p-3"
                placeholder="Transaction or receipt number"
              />
            </div>

            <div>
              <label htmlFor="refundNote" className="mb-1 block text-sm font-medium">
                Note (optional)
              </label>
              <textarea
                id="refundNote"
                value={note}
                onChange={(event) => setNote(event.target.value)}
                rows={3}
                className="w-full rounded-lg border p-3"
                placeholder="Reason or additional details"
              />
            </div>

            <button
              type="submit"
              disabled={submitting || !selectedId || remaining <= 0}
              className="flex w-full items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-3 font-medium text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <RotateCcw size={18} />
              {submitting ? 'Processing...' : 'Record Refund'}
            </button>
          </form>
        </section>

        <section className="rounded-xl border bg-white p-5">
          <h2 className="mb-4 text-lg font-semibold">Refund History</h2>
          {history.length === 0 ? (
            <p className="rounded-lg bg-gray-50 p-4 text-sm text-gray-500">
              No refunds recorded for this sales return.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-gray-50 text-gray-600">
                  <tr>
                    <th className="p-3">Date</th>
                    <th className="p-3">Method</th>
                    <th className="p-3">Amount</th>
                    <th className="p-3">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {history.map((refund) => (
                    <tr key={refund._id} className="border-t">
                      <td className="whitespace-nowrap p-3">
                        {new Date(refund.refundDate).toLocaleDateString()}
                      </td>
                      <td className="p-3">{refund.refundMethod.replaceAll('_', ' ')}</td>
                      <td className="whitespace-nowrap p-3 font-medium">
                        {money(refund.amount)}
                      </td>
                      <td className="p-3">{refund.status}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </div>
    </div>
  )
}
