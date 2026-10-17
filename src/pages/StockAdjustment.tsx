
import { useEffect, useState, type FormEvent } from 'react'
import {
  RefreshCw,
  Search,
  ClipboardList,
  TrendingUp,
  TrendingDown,
} from 'lucide-react'
import { productService, type Product } from '../services/productService'
import { inventoryService } from '../services/inventoryService'
import type { StockAdjustmentPayload } from '../services/inventoryService'

interface Batch {
  _id: string
  productId?: Product | string
  batchNumber: string
  quantity: number
  costPrice?: number
  status?: string
}

interface Adjustment {
  _id: string
  productId?: Product | string
  batchId?: Batch | string
  adjustmentType: 'INCREASE' | 'DECREASE'
  quantity: number
  reason: string
  note?: string
  createdAt?: string
}

function getArray<T>(response: any): T[] {
  const body = response?.data
  if (Array.isArray(body)) return body
  if (Array.isArray(body?.data)) return body.data
  if (Array.isArray(body?.data?.batches)) return body.data.batches
  if (Array.isArray(body?.data?.adjustments)) return body.data.adjustments
  if (Array.isArray(body?.batches)) return body.batches
  if (Array.isArray(body?.adjustments)) return body.adjustments
  return []
}

function getError(error: any): string {
  return (
    error?.response?.data?.message ||
    error?.response?.data?.error ||
    error?.message ||
    'Something went wrong. Please try again.'
  )
}

function getProductId(batch: Batch): string {
  return typeof batch.productId === 'object'
    ? batch.productId?._id || ''
    : batch.productId || ''
}

function getProductName(value?: Product | string): string {
  return typeof value === 'object' && value ? value.name : 'Product'
}

function getBatchNumber(value?: Batch | string): string {
  return typeof value === 'object' && value
    ? value.batchNumber
    : typeof value === 'string'
      ? value
      : '—'
}

function formatDate(value?: string): string {
  if (!value) return '—'
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? '—' : date.toLocaleString()
}

export default function StockAdjustment() {
  const [products, setProducts] = useState<Product[]>([])
  const [batches, setBatches] = useState<Batch[]>([])
  const [adjustments, setAdjustments] = useState<Adjustment[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [search, setSearch] = useState('')
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')

  const [form, setForm] = useState({
    productId: '',
    batchId: '',
    adjustmentType: 'DECREASE' as 'INCREASE' | 'DECREASE',
    quantity: '1',
    reason: 'DAMAGED',
    note: '',
  })

  async function loadData() {
    setLoading(true)
    setError('')

    try {
      const [productResponse, batchResponse, adjustmentResponse] =
        await Promise.all([
          productService.getAll(),
          inventoryService.getBatches(),
          inventoryService.getStockAdjustments(),
        ])

      setProducts(getArray<Product>(productResponse))
      setBatches(getArray<Batch>(batchResponse))
      setAdjustments(getArray<Adjustment>(adjustmentResponse))
    } catch (err) {
      setError(getError(err))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void loadData()
  }, [])

  const selectedBatches = batches.filter(
    (batch) =>
      getProductId(batch) === form.productId &&
      batch.status !== 'EXPIRED' &&
      batch.status !== 'CANCELLED',
  )

  function updateField(field: keyof typeof form, value: string) {
    setForm((current) => ({ ...current, [field]: value }))
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError('')
    setNotice('')

    const quantity = Number(form.quantity)
    const batch = batches.find((item) => item._id === form.batchId)

    if (!form.productId || !batch) {
      setError('Please select a product and its inventory batch.')
      return
    }

    if (!Number.isInteger(quantity) || quantity <= 0) {
      setError('Quantity must be a positive whole number.')
      return
    }

    if (
      form.adjustmentType === 'DECREASE' &&
      quantity > batch.quantity
    ) {
      setError(`Quantity cannot exceed the batch stock (${batch.quantity}).`)
      return
    }

    if (!form.reason.trim()) {
      setError('Please select an adjustment reason.')
      return
    }

    const payload: StockAdjustmentPayload = {
      productId: form.productId,
      batchId: form.batchId,
      adjustmentType: form.adjustmentType,
      quantity,
      reason: form.reason,
      ...(form.note.trim() ? { note: form.note.trim() } : {}),
    }

    setSaving(true)

    try {
      await inventoryService.createStockAdjustment(payload)

      setNotice('Stock adjustment saved successfully.')
      setForm({
        productId: '',
        batchId: '',
        adjustmentType: 'DECREASE',
        quantity: '1',
        reason: 'DAMAGED',
        note: '',
      })

      await loadData()
    } catch (err) {
      setError(getError(err))
    } finally {
      setSaving(false)
    }
  }

  const filteredAdjustments = adjustments.filter((item) => {
    const product =
      typeof item.productId === 'object' ? item.productId : undefined
    const batch =
      typeof item.batchId === 'object' ? item.batchId : undefined

    return [
      product?.name,
      product?.sku,
      batch?.batchNumber,
      item.reason,
      item.adjustmentType,
      item.note,
    ]
      .filter(Boolean)
      .join(' ')
      .toLowerCase()
      .includes(search.toLowerCase())
  })

  const inputClass =
    'mt-1 w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100'

  const labelClass = 'block text-sm font-medium text-gray-700'

  const increaseCount = adjustments.filter(
    (item) => item.adjustmentType === 'INCREASE',
  ).length

  const decreaseCount = adjustments.filter(
    (item) => item.adjustmentType === 'DECREASE',
  ).length

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Stock Adjustment
          </h1>
          <p className="mt-1 text-sm text-gray-500">
            Correct inventory quantities and review adjustment history.
          </p>
        </div>

        <button
          type="button"
          onClick={() => void loadData()}
          disabled={loading}
          className="inline-flex items-center justify-center gap-2 rounded-lg border border-gray-300 px-3 py-2.5 text-sm hover:bg-gray-50 disabled:opacity-50"
        >
          <RefreshCw size={16} />
          Refresh
        </button>
      </div>

      {notice && (
        <div className="rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
          {notice}
        </div>
      )}

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-xl border border-gray-200 bg-white p-5">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-blue-50 p-3 text-blue-600">
              <ClipboardList size={22} />
            </div>
            <div>
              <p className="text-sm text-gray-500">Total Adjustments</p>
              <p className="text-2xl font-bold text-gray-900">
                {adjustments.length}
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
              <p className="text-sm text-gray-500">Stock Increases</p>
              <p className="text-2xl font-bold text-gray-900">
                {increaseCount}
              </p>
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-gray-200 bg-white p-5">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-red-50 p-3 text-red-600">
              <TrendingDown size={22} />
            </div>
            <div>
              <p className="text-sm text-gray-500">Stock Decreases</p>
              <p className="text-2xl font-bold text-gray-900">
                {decreaseCount}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="rounded-xl border border-gray-200 bg-white p-5 sm:p-6">
        <h2 className="text-lg font-semibold text-gray-900">
          Create Adjustment
        </h2>
        <p className="mt-1 text-sm text-gray-500">
          Choose the exact batch whose quantity needs correction.
        </p>

        <form onSubmit={handleSubmit} className="mt-5 space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <label className={labelClass}>
              Product *
              <select
                required
                value={form.productId}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    productId: event.target.value,
                    batchId: '',
                  }))
                }
                className={inputClass}
              >
                <option value="">Select product</option>
                {products.map((product) => (
                  <option key={product._id} value={product._id}>
                    {product.name} — {product.sku}
                  </option>
                ))}
              </select>
            </label>

            <label className={labelClass}>
              Inventory Batch *
              <select
                required
                value={form.batchId}
                onChange={(event) => updateField('batchId', event.target.value)}
                className={inputClass}
                disabled={!form.productId}
              >
                <option value="">Select batch</option>
                {selectedBatches.map((batch) => (
                  <option key={batch._id} value={batch._id}>
                    {batch.batchNumber} — Stock: {batch.quantity}
                  </option>
                ))}
              </select>
            </label>

            <label className={labelClass}>
              Adjustment Type *
              <select
                value={form.adjustmentType}
                    onChange={(event) =>
                      updateField('adjustmentType', event.target.value)
                    }
                className={inputClass}
              >
                <option value="DECREASE">Decrease Stock</option>
                <option value="INCREASE">Increase Stock</option>
              </select>
            </label>

            <label className={labelClass}>
              Quantity *
              <input
                required
                type="number"
                min="1"
                step="1"
                value={form.quantity}
                onChange={(event) => updateField('quantity', event.target.value)}
                className={inputClass}
              />
              {form.batchId && (
                <span className="mt-1 block text-xs text-gray-500">
                  Current batch stock:{' '}
                  {batches.find((item) => item._id === form.batchId)?.quantity ?? 0}
                </span>
              )}
            </label>

            <label className={labelClass}>
              Reason *
              <select
                required
                value={form.reason}
                onChange={(event) => updateField('reason', event.target.value)}
                className={inputClass}
              >
                <option value="DAMAGED">Damaged</option>
                <option value="EXPIRED">Expired</option>
                <option value="LOST">Lost</option>
                <option value="FOUND">Found</option>
                <option value="COUNT_CORRECTION">Stock Count Correction</option>
                <option value="RETURN">Return</option>
                <option value="OTHER">Other</option>
              </select>
            </label>

            <label className={labelClass}>
              Note (optional)
              <input
                value={form.note}
                onChange={(event) => updateField('note', event.target.value)}
                className={inputClass}
                placeholder="Add details about this adjustment"
                maxLength={500}
              />
            </label>
          </div>

          <div className="flex justify-end border-t pt-4">
            <button
              type="submit"
              disabled={saving || loading || !products.length || !batches.length}
              className="rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {saving ? 'Saving...' : 'Save Adjustment'}
            </button>
          </div>
        </form>
      </div>

      <div className="rounded-xl border border-gray-200 bg-white">
        <div className="border-b border-gray-100 p-4">
          <h2 className="mb-3 text-lg font-semibold text-gray-900">
            Adjustment History
          </h2>
          <div className="relative max-w-md">
            <Search
              size={18}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
            />
            <input
              type="search"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search product, batch or reason..."
              className="w-full rounded-lg border border-gray-300 py-2.5 pl-10 pr-3 text-sm outline-none focus:border-blue-500"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[850px] text-left text-sm">
            <thead className="bg-gray-50 text-xs uppercase text-gray-500">
              <tr>
                <th className="px-5 py-3">Product</th>
                <th className="px-5 py-3">Batch</th>
                <th className="px-5 py-3">Type</th>
                <th className="px-5 py-3 text-right">Quantity</th>
                <th className="px-5 py-3">Reason / Note</th>
                <th className="px-5 py-3">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-5 py-12 text-center text-gray-500">
                    Loading adjustment history...
                  </td>
                </tr>
              ) : filteredAdjustments.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-5 py-12 text-center text-gray-500">
                    No stock adjustments found.
                  </td>
                </tr>
              ) : (
                filteredAdjustments.map((item) => (
                  <tr key={item._id} className="hover:bg-gray-50">
                    <td className="px-5 py-4 font-medium text-gray-900">
                      {getProductName(item.productId)}
                    </td>
                    <td className="px-5 py-4">
                      {getBatchNumber(item.batchId)}
                    </td>
                    <td className="px-5 py-4">
                      <span
                        className={`rounded-full px-2.5 py-1 text-xs font-medium ${
                          item.adjustmentType === 'INCREASE'
                            ? 'bg-green-50 text-green-700'
                            : 'bg-red-50 text-red-700'
                        }`}
                      >
                        {item.adjustmentType}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-right font-medium">
                      {item.adjustmentType === 'INCREASE' ? '+' : '-'}
                      {item.quantity}
                    </td>
                    <td className="px-5 py-4">
                      <p>{item.reason || '—'}</p>
                      <p className="mt-1 text-xs text-gray-500">
                        {item.note || ''}
                      </p>
                    </td>
                    <td className="px-5 py-4 text-gray-500">
                      {formatDate(item.createdAt)}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
