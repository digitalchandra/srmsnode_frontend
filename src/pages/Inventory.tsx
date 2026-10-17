
import { useEffect, useState, type FormEvent } from 'react'
import { Plus, RefreshCw, Search, X, Package } from 'lucide-react'
import { productService, type Product } from '../services/productService'
import {
  inventoryService,
  type InventoryBatchPayload,
} from '../services/inventoryService'

interface Batch {
  _id: string
  productId?: Product | string
  batchNumber: string
  quantity: number
  costPrice: number
  manufacturedDate?: string | null
  expiryDate?: string | null
  status?: string
}

function readArray<T>(response: any, keys: string[] = []): T[] {
  const body = response?.data

  if (Array.isArray(body)) return body
  if (Array.isArray(body?.data)) return body.data

  for (const key of keys) {
    if (Array.isArray(body?.[key])) return body[key]
    if (Array.isArray(body?.data?.[key])) return body.data[key]
  }

  return []
}

function getErrorMessage(error: any): string {
  return (
    error?.response?.data?.message ||
    error?.response?.data?.error ||
    error?.message ||
    'Something went wrong. Please try again.'
  )
}

function formatDate(value?: string | null): string {
  if (!value) return '—'

  const date = new Date(value)
  return Number.isNaN(date.getTime())
    ? '—'
    : date.toLocaleDateString()
}

export default function Inventory() {
  const [batches, setBatches] = useState<Batch[]>([])
  const [products, setProducts] = useState<Product[]>([])
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [modalOpen, setModalOpen] = useState(false)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const [form, setForm] = useState({
    productId: '',
    batchNumber: '',
    quantity: '1',
    costPrice: '',
    manufacturedDate: '',
    expiryDate: '',
  })

  async function loadData() {
    setLoading(true)
    setError('')

    try {
      const [batchResponse, productResponse] = await Promise.all([
        inventoryService.getBatches(),
        productService.getAll(),
      ])

      setBatches(readArray<Batch>(batchResponse, ['batches']))
      setProducts(readArray<Product>(productResponse, ['products']))
    } catch (err) {
      setError(getErrorMessage(err))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void loadData()
  }, [])

  function openModal() {
    setForm({
      productId: '',
      batchNumber: '',
      quantity: '1',
      costPrice: '',
      manufacturedDate: '',
      expiryDate: '',
    })
    setError('')
    setModalOpen(true)
  }

  function selectedProduct() {
    return products.find((product) => product._id === form.productId)
  }

  function updateField(
    field: keyof typeof form,
    value: string,
  ) {
    setForm((current) => ({ ...current, [field]: value }))
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError('')
    setNotice('')

    const product = selectedProduct()
    const quantity = Number(form.quantity)
    const costPrice = Number(form.costPrice)

    if (!product) {
      setError('Please select a product.')
      return
    }

    if (!product.inventory?.trackStock) {
      setError('Stock tracking is disabled for this product.')
      return
    }

    if (!form.batchNumber.trim()) {
      setError('Batch number is required.')
      return
    }

    if (!Number.isFinite(quantity) || quantity <= 0) {
      setError('Quantity must be greater than zero.')
      return
    }

    if (
      form.costPrice.trim() === '' ||
      !Number.isFinite(costPrice) ||
      costPrice < 0
    ) {
      setError('Enter a valid, non-negative cost price.')
      return
    }

    if (product.expiryTracking?.enabled && !form.expiryDate) {
      setError('Expiry date is required for this product.')
      return
    }

    if (form.expiryDate) {
      const expiry = new Date(`${form.expiryDate}T23:59:59`)
      const today = new Date()
      today.setHours(0, 0, 0, 0)

      if (expiry < today) {
        setError('Expiry date must be today or in the future.')
        return
      }
    }

    const payload: InventoryBatchPayload = {
      productId: product._id,
      batchNumber: form.batchNumber.trim(),
      quantity,
      costPrice,
      ...(form.manufacturedDate
        ? { manufacturedDate: form.manufacturedDate }
        : {}),
      ...(form.expiryDate ? { expiryDate: form.expiryDate } : {}),
    }

    setSaving(true)

    try {
      const response = await inventoryService.createBatch(payload)
      const stock = response.data?.data?.stock

      setNotice(
        stock
          ? `Stock added successfully. Previous: ${stock.previousStock}, added: ${stock.addedQuantity}, current: ${stock.currentStock}.`
          : 'Inventory batch created successfully.',
      )

      setModalOpen(false)
      await loadData()
    } catch (err) {
      setError(getErrorMessage(err))
    } finally {
      setSaving(false)
    }
  }

  const filteredBatches = batches.filter((batch) => {
    const product =
      typeof batch.productId === 'object' ? batch.productId : undefined

    const text = [
      batch.batchNumber,
      product?.name,
      product?.sku,
      product?.barcode,
      batch.status,
    ]
      .filter(Boolean)
      .join(' ')
      .toLowerCase()

    return text.includes(search.toLowerCase())
  })

  const inputClass =
    'mt-1 w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100'

  const labelClass = 'block text-sm font-medium text-gray-700'

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Inventory Management
          </h1>
          <p className="mt-1 text-sm text-gray-500">
            Receive stock and manage inventory batches.
          </p>
        </div>

        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => void loadData()}
            className="inline-flex items-center gap-2 rounded-lg border border-gray-300 px-3 py-2.5 text-sm hover:bg-gray-50"
          >
            <RefreshCw size={16} />
            Refresh
          </button>

          <button
            type="button"
            onClick={openModal}
            className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-blue-700"
          >
            <Plus size={18} />
            Receive Stock
          </button>
        </div>
      </div>

      {notice && (
        <div className="rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
          {notice}
        </div>
      )}

      {error && !modalOpen && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="rounded-xl border border-gray-200 bg-white p-5">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-blue-50 p-3 text-blue-600">
              <Package size={22} />
            </div>
            <div>
              <p className="text-sm text-gray-500">Inventory Batches</p>
              <p className="text-2xl font-bold text-gray-900">
                {batches.length}
              </p>
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-gray-200 bg-white p-5">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-green-50 p-3 text-green-600">
              <Package size={22} />
            </div>
            <div>
              <p className="text-sm text-gray-500">Products in Catalogue</p>
              <p className="text-2xl font-bold text-gray-900">
                {products.length}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="rounded-xl border border-gray-200 bg-white">
        <div className="border-b border-gray-100 p-4">
          <div className="relative max-w-md">
            <Search
              size={18}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
            />
            <input
              type="search"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search batch, product, SKU or barcode..."
              className="w-full rounded-lg border border-gray-300 py-2.5 pl-10 pr-3 text-sm outline-none focus:border-blue-500"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[850px] text-left text-sm">
            <thead className="bg-gray-50 text-xs uppercase text-gray-500">
              <tr>
                <th className="px-5 py-3">Product</th>
                <th className="px-5 py-3">Batch Number</th>
                <th className="px-5 py-3 text-right">Quantity</th>
                <th className="px-5 py-3 text-right">Cost Price</th>
                <th className="px-5 py-3">Expiry Date</th>
                <th className="px-5 py-3">Status</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-gray-100">
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-5 py-12 text-center text-gray-500">
                    Loading inventory...
                  </td>
                </tr>
              ) : filteredBatches.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-5 py-12 text-center text-gray-500">
                    No inventory batches found. Use Receive Stock to add stock.
                  </td>
                </tr>
              ) : (
                filteredBatches.map((batch) => {
                  const product =
                    typeof batch.productId === 'object'
                      ? batch.productId
                      : undefined

                  return (
                    <tr key={batch._id} className="hover:bg-gray-50">
                      <td className="px-5 py-4">
                        <p className="font-medium text-gray-900">
                          {product?.name || 'Product'}
                        </p>
                        <p className="mt-1 text-xs text-gray-500">
                          {product?.sku || ''}
                        </p>
                      </td>
                      <td className="px-5 py-4">{batch.batchNumber}</td>
                      <td className="px-5 py-4 text-right">
                        {batch.quantity}
                      </td>
                      <td className="px-5 py-4 text-right">
                        ¥{Number(batch.costPrice || 0).toLocaleString()}
                      </td>
                      <td className="px-5 py-4">
                        {formatDate(batch.expiryDate)}
                      </td>
                      <td className="px-5 py-4">
                        <span className="rounded-full bg-gray-100 px-2.5 py-1 text-xs text-gray-700">
                          {batch.status || 'ACTIVE'}
                        </span>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl bg-white shadow-xl">
            <div className="sticky top-0 flex items-center justify-between border-b bg-white px-6 py-4">
              <div>
                <h2 className="text-lg font-bold text-gray-900">
                  Receive Stock
                </h2>
                <p className="mt-1 text-sm text-gray-500">
                  Add a new inventory batch to an existing product.
                </p>
              </div>

              <button
                type="button"
                onClick={() => setModalOpen(false)}
                className="rounded-lg p-2 text-gray-500 hover:bg-gray-100"
                aria-label="Close modal"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4 p-6">
              {error && (
                <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                  {error}
                </div>
              )}

              <label className={labelClass}>
                Product *
                <select
                  required
                  value={form.productId}
                  onChange={(event) => {
                    const productId = event.target.value
                    const product = products.find((p) => p._id === productId)

                    setForm((current) => ({
                      ...current,
                      productId,
                      costPrice:
                        product?.pricing?.costPrice != null
                          ? String(product.pricing.costPrice)
                          : current.costPrice,
                    }))
                  }}
                  className={inputClass}
                >
                  <option value="">Select a product</option>
                  {products.map((product) => (
                    <option key={product._id} value={product._id}>
                      {product.name} — {product.sku}
                      {product.barcode ? ` — ${product.barcode}` : ''}
                    </option>
                  ))}
                </select>
                {selectedProduct() &&
                  !selectedProduct()?.inventory?.trackStock && (
                    <span className="mt-1 block text-xs text-red-600">
                      Stock tracking is disabled for this product.
                    </span>
                  )}
              </label>

              <div className="grid gap-4 sm:grid-cols-2">
                <label className={labelClass}>
                  Batch Number *
                  <input
                    required
                    value={form.batchNumber}
                    onChange={(event) =>
                      updateField('batchNumber', event.target.value)
                    }
                    className={inputClass}
                    placeholder="e.g. RICE-20261017-01"
                  />
                </label>

                <label className={labelClass}>
                  Quantity *
                  <input
                    required
                    type="number"
                    min="1"
                    step="1"
                    value={form.quantity}
                    onChange={(event) =>
                      updateField('quantity', event.target.value)
                    }
                    className={inputClass}
                  />
                </label>

                <label className={labelClass}>
                  Cost Price per Unit (¥) *
                  <input
                    required
                    type="number"
                    min="0"
                    step="0.01"
                    value={form.costPrice}
                    onChange={(event) =>
                      updateField('costPrice', event.target.value)
                    }
                    className={inputClass}
                  />
                </label>

                <label className={labelClass}>
                  Manufactured Date
                  <input
                    type="date"
                    value={form.manufacturedDate}
                    onChange={(event) =>
                      updateField('manufacturedDate', event.target.value)
                    }
                    className={inputClass}
                  />
                </label>

                <label className={labelClass}>
                  Expiry Date
                  <input
                    type="date"
                    value={form.expiryDate}
                    onChange={(event) =>
                      updateField('expiryDate', event.target.value)
                    }
                    className={inputClass}
                  />
                  {selectedProduct()?.expiryTracking?.enabled && (
                    <span className="mt-1 block text-xs text-amber-700">
                      Required for this product.
                    </span>
                  )}
                </label>
              </div>

              <div className="flex justify-end gap-3 border-t pt-4">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="rounded-lg border border-gray-300 px-4 py-2.5 text-sm hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving || products.length === 0}
                  className="rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {saving ? 'Saving...' : 'Add Stock'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
