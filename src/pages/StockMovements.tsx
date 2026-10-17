
import { useEffect, useState } from 'react'
import { RefreshCw, Search, History, TrendingUp, TrendingDown } from 'lucide-react'
import { inventoryService } from '../services/inventoryService'

interface Movement {
  _id: string
  productId?: {
    _id: string
    name: string
    sku?: string
    barcode?: string
    unit?: string
  } | null
  batchId?: {
    _id: string
    batchNumber: string
    expiryDate?: string | null
  } | null
  movementType: string
  quantity: number
  previousStock: number
  newStock: number
  referenceType?: string
  referenceId?: string | null
  note?: string
  performedBy?: {
    name?: string
    email?: string
  } | null
  createdAt: string
}

function getError(error: any): string {
  return error?.response?.data?.message ||
    error?.response?.data?.error ||
    error?.message ||
    'Unable to load stock movements.'
}

function formatDate(value?: string): string {
  if (!value) return '—'
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? '—' : date.toLocaleString()
}

function movementStyle(type: string): string {
  if (type.endsWith('_IN')) return 'bg-green-50 text-green-700'
  if (type.endsWith('_OUT')) return 'bg-red-50 text-red-700'
  return 'bg-blue-50 text-blue-700'
}

export default function StockMovements() {
  const [movements, setMovements] = useState<Movement[]>([])
  const [search, setSearch] = useState('')
  const [typeFilter, setTypeFilter] = useState('ALL')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  async function loadMovements() {
    setLoading(true)
    setError('')

    try {
      const response = await inventoryService.getStockMovements()
      const body = response.data
      const data = Array.isArray(body)
        ? body
        : Array.isArray(body?.data)
          ? body.data
          : []

      setMovements(data)
    } catch (err) {
      setError(getError(err))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void loadMovements()
  }, [])

  const movementTypes = Array.from(
    new Set(movements.map((item) => item.movementType).filter(Boolean)),
  )

  const filteredMovements = movements.filter((item) => {
    const searchable = [
      item.productId?.name,
      item.productId?.sku,
      item.productId?.barcode,
      item.batchId?.batchNumber,
      item.movementType,
      item.referenceType,
      item.note,
      item.performedBy?.name,
    ].filter(Boolean).join(' ').toLowerCase()

    return searchable.includes(search.toLowerCase()) &&
      (typeFilter === 'ALL' || item.movementType === typeFilter)
  })

  const totalIn = movements
    .filter((item) => item.movementType.endsWith('_IN'))
    .reduce((sum, item) => sum + item.quantity, 0)

  const totalOut = movements
    .filter((item) => item.movementType.endsWith('_OUT'))
    .reduce((sum, item) => sum + item.quantity, 0)

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Stock Movement History
          </h1>
          <p className="mt-1 text-sm text-gray-500">
            Track stock received, sales, returns and adjustments.
          </p>
        </div>

        <button
          type="button"
          onClick={() => void loadMovements()}
          disabled={loading}
          className="inline-flex items-center justify-center gap-2 rounded-lg border border-gray-300 px-3 py-2.5 text-sm hover:bg-gray-50 disabled:opacity-50"
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
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-blue-50 p-3 text-blue-600">
              <History size={22} />
            </div>
            <div>
              <p className="text-sm text-gray-500">Total Movements</p>
              <p className="text-2xl font-bold text-gray-900">
                {movements.length}
              </p>
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-gray-200 bg-white p-5">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-green-50 p-3 text-green-600">
              <TrendingUp size={22} />
            </div>
            <div>
              <p className="text-sm text-gray-500">Quantity In</p>
              <p className="text-2xl font-bold text-gray-900">{totalIn}</p>
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-gray-200 bg-white p-5">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-red-50 p-3 text-red-600">
              <TrendingDown size={22} />
            </div>
            <div>
              <p className="text-sm text-gray-500">Quantity Out</p>
              <p className="text-2xl font-bold text-gray-900">{totalOut}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="rounded-xl border border-gray-200 bg-white">
        <div className="flex flex-col gap-3 border-b border-gray-100 p-4 sm:flex-row">
          <div className="relative max-w-md flex-1">
            <Search
              size={18}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
            />
            <input
              type="search"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search product, SKU, batch or user..."
              className="w-full rounded-lg border border-gray-300 py-2.5 pl-10 pr-3 text-sm outline-none focus:border-blue-500"
            />
          </div>

          <select
            value={typeFilter}
            onChange={(event) => setTypeFilter(event.target.value)}
            className="rounded-lg border border-gray-300 px-3 py-2.5 text-sm outline-none focus:border-blue-500"
          >
            <option value="ALL">All movement types</option>
            {movementTypes.map((type) => (
              <option key={type} value={type}>{type}</option>
            ))}
          </select>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[1050px] text-left text-sm">
            <thead className="bg-gray-50 text-xs uppercase text-gray-500">
              <tr>
                <th className="px-5 py-3">Date & Time</th>
                <th className="px-5 py-3">Product</th>
                <th className="px-5 py-3">Batch</th>
                <th className="px-5 py-3">Movement</th>
                <th className="px-5 py-3 text-right">Quantity</th>
                <th className="px-5 py-3 text-right">Previous</th>
                <th className="px-5 py-3 text-right">New Stock</th>
                <th className="px-5 py-3">Performed By</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-gray-100">
              {loading ? (
                <tr>
                  <td colSpan={8} className="px-5 py-12 text-center text-gray-500">
                    Loading stock movements...
                  </td>
                </tr>
              ) : filteredMovements.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-5 py-12 text-center text-gray-500">
                    No stock movements found.
                  </td>
                </tr>
              ) : (
                filteredMovements.map((item) => (
                  <tr key={item._id} className="hover:bg-gray-50">
                    <td className="whitespace-nowrap px-5 py-4 text-gray-500">
                      {formatDate(item.createdAt)}
                    </td>
                    <td className="px-5 py-4">
                      <p className="font-medium text-gray-900">
                        {item.productId?.name || 'Product unavailable'}
                      </p>
                      <p className="mt-1 text-xs text-gray-500">
                        {item.productId?.sku || item.productId?.barcode || ''}
                      </p>
                    </td>
                    <td className="px-5 py-4">
                      {item.batchId?.batchNumber || '—'}
                    </td>
                    <td className="px-5 py-4">
                      <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${movementStyle(item.movementType)}`}>
                        {item.movementType}
                      </span>
                      {item.note && (
                        <p className="mt-1 max-w-xs text-xs text-gray-500">
                          {item.note}
                        </p>
                      )}
                    </td>
                    <td className="px-5 py-4 text-right font-semibold">
                      {item.quantity}
                    </td>
                    <td className="px-5 py-4 text-right">
                      {item.previousStock}
                    </td>
                    <td className="px-5 py-4 text-right font-semibold text-gray-900">
                      {item.newStock}
                    </td>
                    <td className="px-5 py-4">
                      <p className="text-gray-900">
                        {item.performedBy?.name || '—'}
                      </p>
                      <p className="mt-1 text-xs text-gray-500">
                        {item.referenceType || ''}
                      </p>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {!loading && (
          <div className="border-t border-gray-100 px-5 py-3 text-xs text-gray-500">
            Showing {filteredMovements.length} of {movements.length} movements
          </div>
        )}
      </div>
    </div>
  )
}
