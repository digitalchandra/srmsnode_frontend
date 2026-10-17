
import { useEffect, useState, type FormEvent } from 'react'
import { Plus, Search, Pencil, RefreshCw, X } from 'lucide-react'
import { productService, type Product, type ProductPayload } from '../services/productService'
import { catalogService } from '../services/catalogService'

interface Option {
  _id: string
  name: string
}

interface ProductForm {
  name: string
  sku: string
  barcode: string
  categoryId: string
  brandId: string
  description: string
  productType: string
  unit: string
  costPrice: string
  sellingPrice: string
  trackStock: boolean
  lowStockThreshold: string
  expiryTracking: boolean
}

const emptyForm: ProductForm = {
  name: '',
  sku: '',
  barcode: '',
  categoryId: '',
  brandId: '',
  description: '',
  productType: 'NON_FOOD',
  unit: 'PCS',
  costPrice: '',
  sellingPrice: '',
  trackStock: true,
  lowStockThreshold: '5',
  expiryTracking: false,
}

function getArray<T>(response: any): T[] {
  const body = response?.data

  if (Array.isArray(body)) return body
  if (Array.isArray(body?.data)) return body.data
  if (Array.isArray(body?.products)) return body.products
  if (Array.isArray(body?.categories)) return body.categories
  if (Array.isArray(body?.brands)) return body.brands

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

export default function Products() {
  const [products, setProducts] = useState<Product[]>([])
  const [categories, setCategories] = useState<Option[]>([])
  const [brands, setBrands] = useState<Option[]>([])
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [modalOpen, setModalOpen] = useState(false)
  const [editingProduct, setEditingProduct] = useState<Product | null>(null)
  const [form, setForm] = useState<ProductForm>(emptyForm)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')

  async function loadProducts() {
    setLoading(true)
    setError('')

    try {
      const response = await productService.getAll()
      setProducts(getArray<Product>(response))
    } catch (err) {
      setError(getErrorMessage(err))
    } finally {
      setLoading(false)
    }
  }

  async function loadCatalog() {
    try {
      const [categoryResponse, brandResponse] = await Promise.all([
        catalogService.getCategories(),
        catalogService.getBrands(),
      ])

      setCategories(getArray<Option>(categoryResponse))
      setBrands(getArray<Option>(brandResponse))
    } catch (err) {
      setError(`Could not load categories or brands. ${getErrorMessage(err)}`)
    }
  }

  useEffect(() => {
    void loadProducts()
    void loadCatalog()
  }, [])

  function openAddModal() {
    setEditingProduct(null)
    setForm(emptyForm)
    setError('')
    setNotice('')
    setModalOpen(true)
  }

  function openEditModal(product: Product) {
    setEditingProduct(product)
    setForm({
      name: product.name || '',
      sku: product.sku || '',
      barcode: product.barcode || '',
      categoryId: product.categoryId?._id || '',
      brandId: product.brandId?._id || '',
      description: product.description || '',
      productType: product.productType || 'NON_FOOD',
      unit: product.unit || 'PCS',
      costPrice: String(product.pricing?.costPrice ?? ''),
      sellingPrice: String(product.pricing?.sellingPrice ?? ''),
      trackStock: product.inventory?.trackStock ?? true,
      lowStockThreshold: String(
        product.inventory?.lowStockThreshold ?? 5,
      ),
      expiryTracking: product.expiryTracking?.enabled ?? false,
    })
    setError('')
    setNotice('')
    setModalOpen(true)
  }

  function updateField<K extends keyof ProductForm>(
    field: K,
    value: ProductForm[K],
  ) {
    setForm((current) => ({ ...current, [field]: value }))
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError('')
    setNotice('')

    const costPrice = Number(form.costPrice)
    const sellingPrice = Number(form.sellingPrice)
    const lowStockThreshold = Number(form.lowStockThreshold)

    if (!form.categoryId) {
      setError('Please select a category.')
      return
    }

    if (!form.name.trim() || !form.sku.trim()) {
      setError('Product name and SKU are required.')
      return
    }

    if (
      form.costPrice.trim() === '' ||
      form.sellingPrice.trim() === '' ||
      !Number.isFinite(costPrice) ||
      !Number.isFinite(sellingPrice) ||
      costPrice < 0 ||
      sellingPrice < 0
    ) {
      setError('Enter valid, non-negative cost and selling prices.')
      return
    }

    if (
      form.lowStockThreshold.trim() === '' ||
      !Number.isFinite(lowStockThreshold) ||
      lowStockThreshold < 0
    ) {
      setError('Enter a valid low-stock threshold.')
      return
    }

    const payload: ProductPayload = {
      categoryId: form.categoryId,
      ...(form.brandId ? { brandId: form.brandId } : {}),
      name: form.name.trim(),
      sku: form.sku.trim(),
      ...(form.barcode.trim() ? { barcode: form.barcode.trim() } : {}),
      description: form.description.trim(),
      productType: form.productType,
      unit: form.unit,
      costPrice,
      sellingPrice,
      lowStockThreshold,
      expiryTracking: form.expiryTracking,
      ...(!editingProduct ? { trackStock: form.trackStock } : {}),
    }

    setSaving(true)

    try {
      if (editingProduct) {
        await productService.update(editingProduct._id, payload)
        setNotice('Product updated successfully.')
      } else {
        await productService.create(payload)
        setNotice('Product created successfully.')
      }

      setModalOpen(false)
      await loadProducts()
    } catch (err) {
      setError(getErrorMessage(err))
    } finally {
      setSaving(false)
    }
  }

  const filteredProducts = products.filter((product) => {
    const searchText = search.toLowerCase()

    return [
      product.name,
      product.sku,
      product.barcode,
      product.brandId?.name,
      product.categoryId?.name,
    ].some((value) => value?.toLowerCase().includes(searchText))
  })

  const inputClass =
    'mt-1 w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100'

  const labelClass = 'block text-sm font-medium text-gray-700'

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Products</h1>
          <p className="mt-1 text-sm text-gray-500">
            Manage your product catalogue, prices and stock settings.
          </p>
        </div>

        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => void loadProducts()}
            className="inline-flex items-center gap-2 rounded-lg border border-gray-300 px-3 py-2.5 text-sm font-medium hover:bg-gray-50"
          >
            <RefreshCw size={16} />
            Refresh
          </button>

          <button
            type="button"
            onClick={openAddModal}
            className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-blue-700"
          >
            <Plus size={18} />
            Add Product
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
              placeholder="Search name, SKU, barcode, brand..."
              className="w-full rounded-lg border border-gray-300 py-2.5 pl-10 pr-3 text-sm outline-none focus:border-blue-500"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[850px] text-left text-sm">
            <thead className="bg-gray-50 text-xs uppercase text-gray-500">
              <tr>
                <th className="px-5 py-3">Product</th>
                <th className="px-5 py-3">SKU / Barcode</th>
                <th className="px-5 py-3">Category / Brand</th>
                <th className="px-5 py-3 text-right">Cost Price</th>
                <th className="px-5 py-3 text-right">Selling Price</th>
                <th className="px-5 py-3 text-right">Stock</th>
                <th className="px-5 py-3">Action</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-gray-100">
              {loading ? (
                <tr>
                  <td colSpan={7} className="px-5 py-12 text-center text-gray-500">
                    Loading products...
                  </td>
                </tr>
              ) : filteredProducts.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-5 py-12 text-center text-gray-500">
                    No products found.
                  </td>
                </tr>
              ) : (
                filteredProducts.map((product) => (
                  <tr key={product._id} className="hover:bg-gray-50">
                    <td className="px-5 py-4">
                      <p className="font-medium text-gray-900">{product.name}</p>
                      <p className="mt-1 text-xs text-gray-500">
                        {product.status || 'ACTIVE'}
                      </p>
                    </td>
                    <td className="px-5 py-4">
                      <p>{product.sku}</p>
                      <p className="mt-1 text-xs text-gray-500">
                        {product.barcode || 'No barcode'}
                      </p>
                    </td>
                    <td className="px-5 py-4">
                      <p>{product.categoryId?.name || '—'}</p>
                      <p className="mt-1 text-xs text-gray-500">
                        {product.brandId?.name || 'No brand'}
                      </p>
                    </td>
                    <td className="px-5 py-4 text-right">
                      ¥{Number(product.pricing?.costPrice ?? 0).toLocaleString()}
                    </td>
                    <td className="px-5 py-4 text-right font-medium">
                      ¥{Number(product.pricing?.sellingPrice ?? 0).toLocaleString()}
                    </td>
                    <td className="px-5 py-4 text-right">
                      {product.inventory?.currentStock ?? 0}
                    </td>
                    <td className="px-5 py-4">
                      <button
                        type="button"
                        onClick={() => openEditModal(product)}
                        className="inline-flex items-center gap-1.5 rounded-lg border border-gray-300 px-3 py-2 text-sm hover:bg-gray-100"
                      >
                        <Pencil size={14} />
                        Edit
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <div className="border-t border-gray-100 px-5 py-3 text-sm text-gray-500">
          Showing {filteredProducts.length} of {products.length} products
        </div>
      </div>

      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-2xl bg-white shadow-xl">
            <div className="sticky top-0 flex items-center justify-between border-b bg-white px-6 py-4">
              <div>
                <h2 className="text-lg font-bold text-gray-900">
                  {editingProduct ? 'Edit Product' : 'Add Product'}
                </h2>
                <p className="mt-1 text-sm text-gray-500">
                  Enter the product details below.
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

            <form onSubmit={handleSubmit} className="space-y-5 p-6">
              {error && (
                <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                  {error}
                </div>
              )}

              <div className="grid gap-4 sm:grid-cols-2">
                <label className={labelClass}>
                  Product Name *
                  <input
                    required
                    value={form.name}
                    onChange={(e) => updateField('name', e.target.value)}
                    className={inputClass}
                    placeholder="e.g. Basmati Rice 5kg"
                  />
                </label>

                <label className={labelClass}>
                  SKU *
                  <input
                    required
                    value={form.sku}
                    onChange={(e) => updateField('sku', e.target.value)}
                    className={inputClass}
                    placeholder="e.g. RICE-5KG"
                  />
                </label>

             
                <label className={labelClass}>
                  Barcode * (Scan here)
                  <input
                    value={form.barcode}
                    onChange={(e) => updateField('barcode', e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault()
                      }
                    }}
                    className={inputClass}
                    placeholder="Click here and scan barcode"
                    autoComplete="off"
                    inputMode="numeric"
                  />
                  <span className="mt-1 block text-xs font-normal text-gray-500">
                    Click this field first, then scan the product barcode.
                  </span>
                </label>


                <label className={labelClass}>
                  Category *
                  <select
                    required
                    value={form.categoryId}
                    onChange={(e) => updateField('categoryId', e.target.value)}
                    className={inputClass}
                  >
                    <option value="">Select category</option>
                    {categories.map((category) => (
                      <option key={category._id} value={category._id}>
                        {category.name}
                      </option>
                    ))}
                  </select>
                </label>

                <label className={labelClass}>
                  Brand
                  <select
                    value={form.brandId}
                    onChange={(e) => updateField('brandId', e.target.value)}
                    className={inputClass}
                  >
                    <option value="">No brand</option>
                    {brands.map((brand) => (
                      <option key={brand._id} value={brand._id}>
                        {brand.name}
                      </option>
                    ))}
                  </select>
                </label>

                <label className={labelClass}>
                  Product Type
                  <select
                    value={form.productType}
                    onChange={(e) => updateField('productType', e.target.value)}
                    className={inputClass}
                  >
                    <option value="NON_FOOD">Non-food</option>
                    <option value="FOOD">Food</option>
                  </select>
                </label>

                <label className={labelClass}>
                  Unit
                  <select
                    value={form.unit}
                    onChange={(e) => updateField('unit', e.target.value)}
                    className={inputClass}
                  >
                    <option value="PCS">Pieces (PCS)</option>
                    <option value="KG">Kilogram (KG)</option>
                    <option value="G">Gram (G)</option>
                    <option value="L">Litre (L)</option>
                    <option value="ML">Millilitre (ML)</option>
                    <option value="BAG">Bag</option>
                    <option value="BOX">Box</option>
                    <option value="PACK">Pack</option>
                  </select>
                </label>

                <label className={labelClass}>
                  Cost Price (¥) *
                  <input
                    required
                    type="number"
                    min="0"
                    step="0.01"
                    value={form.costPrice}
                    onChange={(e) => updateField('costPrice', e.target.value)}
                    className={inputClass}
                  />
                </label>

                <label className={labelClass}>
                  Selling Price (¥) *
                  <input
                    required
                    type="number"
                    min="0"
                    step="0.01"
                    value={form.sellingPrice}
                    onChange={(e) => updateField('sellingPrice', e.target.value)}
                    className={inputClass}
                  />
                </label>

                <label className={labelClass}>
                  Low Stock Threshold
                  <input
                    required
                    type="number"
                    min="0"
                    value={form.lowStockThreshold}
                    onChange={(e) =>
                      updateField('lowStockThreshold', e.target.value)
                    }
                    className={inputClass}
                  />
                </label>
              </div>

              <label className={`${labelClass} block`}>
                Description
                <textarea
                  rows={3}
                  value={form.description}
                  onChange={(e) => updateField('description', e.target.value)}
                  className={inputClass}
                  placeholder="Optional product description"
                />
              </label>

              <div className="flex flex-col gap-3 rounded-lg bg-gray-50 p-4 sm:flex-row sm:gap-8">
                {!editingProduct && (
                  <label className="flex items-center gap-2 text-sm text-gray-700">
                    <input
                      type="checkbox"
                      checked={form.trackStock}
                      onChange={(e) => updateField('trackStock', e.target.checked)}
                      className="h-4 w-4 rounded"
                    />
                    Track stock
                  </label>
                )}

                <label className="flex items-center gap-2 text-sm text-gray-700">
                  <input
                    type="checkbox"
                    checked={form.expiryTracking}
                    onChange={(e) =>
                      updateField('expiryTracking', e.target.checked)
                    }
                    className="h-4 w-4 rounded"
                  />
                  Enable expiry tracking
                </label>
              </div>

              <div className="flex justify-end gap-3 border-t pt-4">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="rounded-lg border border-gray-300 px-4 py-2.5 text-sm font-medium hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving || categories.length === 0}
                  className="rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {saving
                    ? 'Saving...'
                    : editingProduct
                      ? 'Update Product'
                      : 'Create Product'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
