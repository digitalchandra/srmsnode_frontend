
import { useEffect, useState } from 'react'
import { CalendarClock, RefreshCw, Search } from 'lucide-react'
import { inventoryService } from '../services/inventoryService'

interface ExpiryProduct {
  _id: string
  name: string
  sku?: string
  barcode?: string
  unit?: string
}

interface ExpiryBatch {
  _id: string
  product: ExpiryProduct | null
  batchNumber: string
  quantity: number
  expiryDate: string
  daysRemaining: number
  expiryStatus: 'EXPIRED' | 'CRITICAL' | 'EXPIRING_SOON'
}

function getErrorMessage(error: any): string {
  return (
    error?.response?.data?.message ||
    error?.response?.data?.error ||
    error?.message ||
    'Failed to load expiry batches.'
  )
}

function formatDate(value: string): string {
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? '—' : date.toLocaleDateString()
}

function statusStyle(status: ExpiryBatch['expiryStatus']): string {
  switch (status) {
    case 'EXPIRED':
      return 'bg-red-100 text-red-700'
    case 'CRITICAL':
      return 'bg-orange-100 text-orange-700'
    default:
      return 'bg-amber-100 text-amber-800'
  }
}

function statusLabel(status: ExpiryBatch['expiryStatus']): string {
  switch (status) {
    case 'EXPIRED':
      return 'Expired'
    case 'CRITICAL':
      return 'Critical'
    default:
      return 'Expiring Soon'
  }
}

export default function ExpiryTracking() {
  const [batches, setBatches] = useState<ExpiryBatch[]>([])
  const [days, setDays] = useState(30)
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  async function loadExpiryBatches(selectedDays = days) {
    setLoading(true)
    setError('')

    try {
      const response =
        await inventoryService.getExpiryBatches(selectedDays)

      const body = response.data
      setBatches(Array.isArray(body?.data) ? body.data : [])
    } catch (err) {
      setError(getErrorMessage(err))
      setBatches([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void loadExpiryBatches(days)
  }, [days])

  const filteredBatches = batches.filter((batch) => {
    const text = [
      batch.product?.name,
      batch.product?.sku,
      batch.product?.barcode,
      batch.batchNumber,
      batch.expiryStatus,
    ]
      .filter(Boolean)
      .join(' ')
      .toLowerCase()

    return text.includes(search.toLowerCase())
  })

  const expiredCount = batches.filter(
    (batch) => batch.expiryStatus === 'EXPIRED',
  ).length

  const criticalCount = batches.filter(
    (batch) => batch.expiryStatus === 'CRITICAL',
  ).length

  const inputClass =
    'rounded-lg border border-gray-300 px-3 py-2.5 text-sm outline-none focus:border-blue-500'

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Expiry Tracking
          </h1>
          <p className="mt-1 text-sm text-gray-500">
            Monitor expired and soon-to-expire inventory batches.
          </p>
        </div>

        <button
          type="button"
          onClick={() => void loadExpiryBatches()}
          disabled={loading}
          className="inline-flex items-center justify-center gap-2 rounded-lg border border-gray-300 px-4 py-2.5 text-sm hover:bg-gray-50 disabled:opacity-50"
        >
          <RefreshCw size={16} />
          Refresh
        </button>
      </div>

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-xl border border-gray-200 bg-white p-5">
          <p className="text-sm text-gray-500">Matching Batches</p>
          <p className="mt-2 text-2xl font-bold text-gray-900">
            {batches.length}
          </p>
        </div>

        <div className="rounded-xl border border-red-200 bg-white p-5">
          <p className="text-sm text-gray-500">Expired Batches</p>
          <p className="mt-2 text-2xl font-bold text-red-600">
            {expiredCount}
          </p>
        </div>

        <div className="rounded-xl border border-orange-200 bg-white p-5">
          <p className="text-sm text-gray-500">Critical — 7 Days or Less</p>
          <p className="mt-2 text-2xl font-bold text-orange-600">
            {criticalCount}
          </p>
        </div>
      </div>

      <div className="rounded-xl border border-gray-200 bg-white">
        <div className="flex flex-col gap-3 border-b border-gray-100 p-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="relative w-full sm:max-w-md">
            <Search
              size={18}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
            />
            <input
              type="search"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search product, SKU or batch..."
              className="w-full rounded-lg border border-gray-300 py-2.5 pl-10 pr-3 text-sm outline-none focus:border-blue-500"
            />
          </div>

          <label className="flex items-center gap-2 text-sm text-gray-600">
            <CalendarClock size={17} />
            Show next
            <select
              value={days}
              onChange={(event) => setDays(Number(event.target.value))}
              className={inputClass}
            >
              <option value={7}>7 days</option>
              <option value={30}>30 days</option>
              <option value={60}>60 days</option>
              <option value={90}>90 days</option>
              <option value={180}>180 days</option>
              <option value={365}>365 days</option>
            </select>
          </label>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[850px] text-left text-sm">
            <thead className="bg-gray-50 text-xs uppercase text-gray-500">
              <tr>
                <th className="px-5 py-3">Product</th>
                <th className="px-5 py-3">Batch Number</th>
                <th className="px-5 py-3 text-right">Quantity</th>
                <th className="px-5 py-3">Expiry Date</th>
                <th className="px-5 py-3">Days Remaining</th>
                <th className="px-5 py-3">Status</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-gray-100">
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-5 py-12 text-center text-gray-500">
                    Loading expiry batches...
                  </td>
                </tr>
              ) : filteredBatches.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-5 py-12 text-center text-gray-500">
                    No matching expiry batches found for this period.
                  </td>
                </tr>
              ) : (
                filteredBatches.map((batch) => (
                  <tr key={batch._id} className="hover:bg-gray-50">
                    <td className="px-5 py-4">
                      <p className="font-medium text-gray-900">
                        {batch.product?.name || 'Unknown product'}
                      </p>
                      <p className="mt-1 text-xs text-gray-500">
                        {batch.product?.sku || 'No SKU'}
                      </p>
                    </td>

                    <td className="px-5 py-4">{batch.batchNumber}</td>

                    <td className="px-5 py-4 text-right">
                      {batch.quantity} {batch.product?.unit || ''}
                    </td>

                    <td className="px-5 py-4">
                      {formatDate(batch.expiryDate)}
                    </td>

                    <td className="px-5 py-4 font-medium">
                      {batch.daysRemaining < 0
                        ? `${Math.abs(batch.daysRemaining)} days overdue`
                        : batch.daysRemaining === 0
                          ? 'Expires today'
                          : `${batch.daysRemaining} days`}
                    </td>

                    <td className="px-5 py-4">
                      <span
                        className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${statusStyle(batch.expiryStatus)}`}
                      >
                        {statusLabel(batch.expiryStatus)}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <div className="border-t border-gray-100 px-5 py-3 text-sm text-gray-500">
          Showing {filteredBatches.length} of {batches.length} matching batches
        </div>
      </div>
    </div>
  )
}
