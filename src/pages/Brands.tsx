
import { useEffect, useState, type SyntheticEvent } from 'react'
import { Plus, Search, Pencil, Trash2, RefreshCw, X } from 'lucide-react'
import { catalogService, type Brand } from '../services/catalogService'

function readBrands(response: any): Brand[] {
  const body = response?.data

  if (Array.isArray(body)) return body
  if (Array.isArray(body?.data)) return body.data
  if (Array.isArray(body?.brands)) return body.brands
  if (Array.isArray(body?.data?.brands)) return body.data.brands

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

export default function Brands() {
  const [brands, setBrands] = useState<Brand[]>([])
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState<Brand | null>(null)
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')

  async function loadBrands() {
    setLoading(true)
    setError('')

    try {
      const response = await catalogService.getBrands()
      setBrands(readBrands(response))
    } catch (err) {
      setError(getErrorMessage(err))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void loadBrands()
  }, [])

  function openAdd() {
    setEditing(null)
    setName('')
    setDescription('')
    setError('')
    setModalOpen(true)
  }

  function openEdit(brand: Brand) {
    setEditing(brand)
    setName(brand.name)
    setDescription(brand.description || '')
    setError('')
    setModalOpen(true)
  }

  async function handleSubmit(event: SyntheticEvent<HTMLFormElement>) {
    event.preventDefault()
    setError('')
    setNotice('')

    if (!name.trim()) {
      setError('Brand name is required.')
      return
    }

    setSaving(true)

    try {
      const payload = {
        name: name.trim(),
        description: description.trim(),
      }

      if (editing) {
        await catalogService.updateBrand(editing._id, payload)
        setNotice('Brand updated successfully.')
      } else {
        await catalogService.createBrand(payload)
        setNotice('Brand created successfully.')
      }

      setModalOpen(false)
      await loadBrands()
    } catch (err) {
      setError(getErrorMessage(err))
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete(brand: Brand) {
    const confirmed = window.confirm(
      `Delete brand "${brand.name}"? Products may be associated with this brand.`,
    )

    if (!confirmed) return

    setError('')
    setNotice('')

    try {
      await catalogService.deleteBrand(brand._id)
      setNotice(`Brand "${brand.name}" deleted successfully.`)
      await loadBrands()
    } catch (err) {
      setError(getErrorMessage(err))
    }
  }

  const filteredBrands = brands.filter((brand) =>
    `${brand.name} ${brand.description || ''}`
      .toLowerCase()
      .includes(search.toLowerCase()),
  )

  const inputClass =
    'mt-1 w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100'

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Brand Management
          </h1>
          <p className="mt-1 text-sm text-gray-500">
            Manage the brands associated with your products.
          </p>
        </div>

        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => void loadBrands()}
            className="inline-flex items-center gap-2 rounded-lg border border-gray-300 px-3 py-2.5 text-sm hover:bg-gray-50"
          >
            <RefreshCw size={16} />
            Refresh
          </button>

          <button
            type="button"
            onClick={openAdd}
            className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-blue-700"
          >
            <Plus size={18} />
            Add Brand
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
              placeholder="Search brands..."
              className="w-full rounded-lg border border-gray-300 py-2.5 pl-10 pr-3 text-sm outline-none focus:border-blue-500"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[600px] text-left text-sm">
            <thead className="bg-gray-50 text-xs uppercase text-gray-500">
              <tr>
                <th className="px-5 py-3">Brand Name</th>
                <th className="px-5 py-3">Description</th>
                <th className="px-5 py-3">Brand ID</th>
                <th className="px-5 py-3">Actions</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-gray-100">
              {loading ? (
                <tr>
                  <td colSpan={4} className="px-5 py-12 text-center text-gray-500">
                    Loading brands...
                  </td>
                </tr>
              ) : filteredBrands.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-5 py-12 text-center text-gray-500">
                    No brands found.
                  </td>
                </tr>
              ) : (
                filteredBrands.map((brand) => (
                  <tr key={brand._id} className="hover:bg-gray-50">
                    <td className="px-5 py-4 font-medium text-gray-900">
                      {brand.name}
                    </td>
                    <td className="px-5 py-4 text-gray-600">
                      {brand.description || '—'}
                    </td>
                    <td className="px-5 py-4 font-mono text-xs text-gray-500">
                      {brand._id}
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() => openEdit(brand)}
                          className="inline-flex items-center gap-1 rounded-lg border border-gray-300 px-3 py-2 hover:bg-gray-100"
                        >
                          <Pencil size={14} />
                          Edit
                        </button>

                        <button
                          type="button"
                          onClick={() => void handleDelete(brand)}
                          className="inline-flex items-center gap-1 rounded-lg border border-red-200 px-3 py-2 text-red-600 hover:bg-red-50"
                        >
                          <Trash2 size={14} />
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <div className="border-t border-gray-100 px-5 py-3 text-sm text-gray-500">
          Showing {filteredBrands.length} of {brands.length} brands
        </div>
      </div>

      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-lg rounded-2xl bg-white shadow-xl">
            <div className="flex items-center justify-between border-b px-6 py-4">
              <h2 className="text-lg font-bold text-gray-900">
                {editing ? 'Edit Brand' : 'Add Brand'}
              </h2>

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

              <label className="block text-sm font-medium text-gray-700">
                Brand Name *
                <input
                  required
                  autoFocus
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                  className={inputClass}
                  placeholder="e.g. Friday Basmati"
                />
              </label>

              <label className="block text-sm font-medium text-gray-700">
                Description
                <textarea
                  rows={3}
                  value={description}
                  onChange={(event) => setDescription(event.target.value)}
                  className={inputClass}
                  placeholder="Optional brand description"
                />
              </label>

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
                  disabled={saving}
                  className="rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
                >
                  {saving
                    ? 'Saving...'
                    : editing
                      ? 'Update Brand'
                      : 'Create Brand'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
