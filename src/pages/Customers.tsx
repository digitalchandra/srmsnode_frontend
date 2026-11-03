
import { useEffect, useState, type FormEvent } from 'react'
import {
  Plus,
  Search,
  Pencil,
  RefreshCw,
  X,
  Users,
  ChevronLeft,
  ChevronRight,
  Eye,
} from 'lucide-react'

import {
  customerService,
  type Customer,
  type CustomerPayload,
} from '../services/customerService'

function getErrorMessage(error: any): string {
  return (
    error?.response?.data?.message ||
    error?.response?.data?.error ||
    error?.message ||
    'Something went wrong. Please try again.'
  )
}

export default function Customers() {
  const [customers, setCustomers] = useState<Customer[]>([])
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState<'ALL' | 'ACTIVE' | 'INACTIVE'>('ALL')

  const [page, setPage] = useState(1)
  const [limit] = useState(10)
  const [total, setTotal] = useState(0)
  const [totalPages, setTotalPages] = useState(0)

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  const [modalOpen, setModalOpen] = useState(false)
  const [detailsOpen, setDetailsOpen] = useState(false)

  const [editing, setEditing] = useState<Customer | null>(null)
  const [selectedCustomer, setSelectedCustomer] =
    useState<Customer | null>(null)

  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [email, setEmail] = useState('')
  const [address, setAddress] = useState('')
  const [note, setNote] = useState('')

  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')

  async function loadCustomers() {
    setLoading(true)
    setError('')

    try {
      const response = await customerService.getCustomers({
        page,
        limit,
        search: search.trim() || undefined,
        status: status === 'ALL' ? undefined : status,
      })

      setCustomers(response.data.data || [])
      setTotal(response.data.pagination?.total || 0)
      setTotalPages(response.data.pagination?.totalPages || 0)
    } catch (err) {
      setError(getErrorMessage(err))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void loadCustomers()
    }, 300)

    return () => window.clearTimeout(timer)
  }, [page, search, status])

  function openAdd() {
    setEditing(null)
    setName('')
    setPhone('')
    setEmail('')
    setAddress('')
    setNote('')
    setError('')
    setModalOpen(true)
  }

  function openEdit(customer: Customer) {
    setEditing(customer)
    setName(customer.name)
    setPhone(customer.phone || '')
    setEmail(customer.email || '')
    setAddress(customer.address || '')
    setNote(customer.note || '')
    setError('')
    setModalOpen(true)
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError('')
    setNotice('')

    if (!name.trim()) {
      setError('Customer name is required.')
      return
    }

    const payload: CustomerPayload = {
      name: name.trim(),
      phone: phone.trim(),
      email: email.trim(),
      address: address.trim(),
      note: note.trim(),
    }

    setSaving(true)

    try {
      if (editing) {
        await customerService.updateCustomer(editing._id, payload)
        setNotice('Customer updated successfully.')
      } else {
        await customerService.createCustomer(payload)
        setNotice('Customer created successfully.')
      }

      setModalOpen(false)
      setPage(1)

      // Refresh current customer list
      if (page === 1) {
        await loadCustomers()
      }
    } catch (err) {
      setError(getErrorMessage(err))
    } finally {
      setSaving(false)
    }
  }

  async function handleDeactivate(customer: Customer) {
    const confirmed = window.confirm(
      `Deactivate customer "${customer.name}"?`
    )

    if (!confirmed) return

    setError('')
    setNotice('')

    try {
      await customerService.deactivateCustomer(customer._id)
      setNotice(`${customer.name} deactivated successfully.`)
      await loadCustomers()
    } catch (err) {
      setError(getErrorMessage(err))
    }
  }

  async function handleActivate(customer: Customer) {
    try {
      await customerService.updateCustomer(customer._id, {
        status: 'ACTIVE',
      })

      setNotice(`${customer.name} activated successfully.`)
      await loadCustomers()
    } catch (err) {
      setError(getErrorMessage(err))
    }
  }

  function closeModal() {
    if (saving) return
    setModalOpen(false)
    setError('')
  }

  const inputClass =
    'mt-1 w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100'

  return (
    <div className="space-y-6">

      {/* Page Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Customer Management
          </h1>
          <p className="mt-1 text-sm text-gray-500">
            Manage your customers and their information.
          </p>
        </div>

        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => void loadCustomers()}
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
            Add Customer
          </button>
        </div>
      </div>

      {/* Notifications */}
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

      {/* Customer Summary */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">

        <div className="rounded-xl border border-gray-200 bg-white p-5">
          <div className="flex items-center justify-between">
            <p className="text-sm text-gray-500">Total Customers</p>
            <Users className="text-blue-600" size={22} />
          </div>
          <h2 className="mt-2 text-2xl font-bold text-gray-900">
            {total}
          </h2>
        </div>

        <div className="rounded-xl border border-gray-200 bg-white p-5">
          <p className="text-sm text-gray-500">Active Customers</p>
          <h2 className="mt-2 text-2xl font-bold text-green-600">
            {status === 'ACTIVE' ? total : '—'}
          </h2>
        </div>

        <div className="rounded-xl border border-gray-200 bg-white p-5">
          <p className="text-sm text-gray-500">Inactive Customers</p>
          <h2 className="mt-2 text-2xl font-bold text-gray-500">
            {status === 'INACTIVE' ? total : '—'}
          </h2>
        </div>

      </div>

      {/* Customer Table */}
      <div className="rounded-xl border border-gray-200 bg-white">

        <div className="flex flex-col gap-3 border-b border-gray-100 p-4 sm:flex-row sm:items-center sm:justify-between">

          <div className="relative w-full max-w-md">
            <Search
              size={18}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
            />

            <input
              type="search"
              value={search}
              onChange={(event) => {
                setSearch(event.target.value)
                setPage(1)
              }}
              placeholder="Search name, phone or email..."
              className="w-full rounded-lg border border-gray-300 py-2.5 pl-10 pr-3 text-sm outline-none focus:border-blue-500"
            />
          </div>

          <select
            value={status}
            onChange={(event) => {
              setStatus(event.target.value as typeof status)
              setPage(1)
            }}
            className="rounded-lg border border-gray-300 px-3 py-2.5 text-sm outline-none focus:border-blue-500"
          >
            <option value="ALL">All Customers</option>
            <option value="ACTIVE">Active</option>
            <option value="INACTIVE">Inactive</option>
          </select>

        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[850px] text-left text-sm">

            <thead className="bg-gray-50 text-xs uppercase text-gray-500">
              <tr>
                <th className="px-5 py-3">Customer</th>
                <th className="px-5 py-3">Phone</th>
                <th className="px-5 py-3">Email</th>
                <th className="px-5 py-3">Address</th>
                <th className="px-5 py-3">Status</th>
                <th className="px-5 py-3">Actions</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-gray-100">

              {loading ? (
                <tr>
                  <td colSpan={6} className="px-5 py-12 text-center text-gray-500">
                    Loading customers...
                  </td>
                </tr>
              ) : customers.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-5 py-12 text-center text-gray-500">
                    No customers found.
                  </td>
                </tr>
              ) : (
                customers.map((customer) => (
                  <tr key={customer._id} className="hover:bg-gray-50">

                    <td className="px-5 py-4 font-medium text-gray-900">
                      {customer.name}
                    </td>

                    <td className="px-5 py-4 text-gray-600">
                      {customer.phone || '—'}
                    </td>

                    <td className="px-5 py-4 text-gray-600">
                      {customer.email || '—'}
                    </td>

                    <td className="px-5 py-4 text-gray-600">
                      {customer.address || '—'}
                    </td>

                    <td className="px-5 py-4">
                      <span
                        className={`rounded-full px-3 py-1 text-xs font-medium ${
                          customer.status === 'ACTIVE'
                            ? 'bg-green-100 text-green-700'
                            : 'bg-gray-100 text-gray-600'
                        }`}
                      >
                        {customer.status}
                      </span>
                    </td>

                    <td className="px-5 py-4">
                      <div className="flex gap-2">

                        <button
                          type="button"
                          onClick={() => {
                            setSelectedCustomer(customer)
                            setDetailsOpen(true)
                          }}
                          className="rounded-lg border border-gray-300 p-2 hover:bg-gray-100"
                          title="View customer"
                        >
                          <Eye size={15} />
                        </button>

                        <button
                          type="button"
                          onClick={() => openEdit(customer)}
                          className="rounded-lg border border-gray-300 p-2 hover:bg-gray-100"
                          title="Edit customer"
                        >
                          <Pencil size={15} />
                        </button>

                        {customer.status === 'ACTIVE' ? (
                          <button
                            type="button"
                            onClick={() => void handleDeactivate(customer)}
                            className="rounded-lg border border-red-200 px-3 py-2 text-xs text-red-600 hover:bg-red-50"
                          >
                            Deactivate
                          </button>
                        ) : (
                          <button
                            type="button"
                            onClick={() => void handleActivate(customer)}
                            className="rounded-lg border border-green-200 px-3 py-2 text-xs text-green-600 hover:bg-green-50"
                          >
                            Activate
                          </button>
                        )}

                      </div>
                    </td>

                  </tr>
                ))
              )}

            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="flex flex-col gap-3 border-t border-gray-100 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">

          <p className="text-sm text-gray-500">
            Showing {customers.length} of {total} customers
          </p>

          <div className="flex items-center gap-3">

            <button
              type="button"
              disabled={page <= 1 || loading}
              onClick={() => setPage((current) => current - 1)}
              className="rounded-lg border border-gray-300 p-2 disabled:opacity-40"
            >
              <ChevronLeft size={18} />
            </button>

            <span className="text-sm text-gray-600">
              Page {page} of {Math.max(totalPages, 1)}
            </span>

            <button
              type="button"
              disabled={page >= totalPages || loading || totalPages === 0}
              onClick={() => setPage((current) => current + 1)}
              className="rounded-lg border border-gray-300 p-2 disabled:opacity-40"
            >
              <ChevronRight size={18} />
            </button>

          </div>
        </div>

      </div>

      {/* Add / Edit Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/50 p-4">

          <div className="my-auto w-full max-w-lg rounded-2xl bg-white shadow-xl">

            <div className="flex items-center justify-between border-b px-6 py-4">

              <h2 className="text-lg font-bold text-gray-900">
                {editing ? 'Edit Customer' : 'Add Customer'}
              </h2>

              <button
                type="button"
                onClick={closeModal}
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
                Customer Name *
                <input
                  required
                  autoFocus
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                  className={inputClass}
                  placeholder="Enter customer name"
                />
              </label>

              <label className="block text-sm font-medium text-gray-700">
                Phone Number
                <input
                  value={phone}
                  onChange={(event) => setPhone(event.target.value)}
                  className={inputClass}
                  placeholder="Enter phone number"
                />
              </label>

              <label className="block text-sm font-medium text-gray-700">
                Email
                <input
                  type="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  className={inputClass}
                  placeholder="customer@example.com"
                />
              </label>

              <label className="block text-sm font-medium text-gray-700">
                Address
                <input
                  value={address}
                  onChange={(event) => setAddress(event.target.value)}
                  className={inputClass}
                  placeholder="Enter address"
                />
              </label>

              <label className="block text-sm font-medium text-gray-700">
                Note
                <textarea
                  rows={3}
                  value={note}
                  onChange={(event) => setNote(event.target.value)}
                  className={inputClass}
                  placeholder="Optional customer note"
                />
              </label>

              <div className="flex justify-end gap-3 border-t pt-4">

                <button
                  type="button"
                  onClick={closeModal}
                  disabled={saving}
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
                      ? 'Update Customer'
                      : 'Create Customer'}
                </button>

              </div>

            </form>

          </div>
        </div>
      )}

      {/* Customer Details Modal */}
      {detailsOpen && selectedCustomer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">

          <div className="w-full max-w-lg rounded-2xl bg-white shadow-xl">

            <div className="flex items-center justify-between border-b px-6 py-4">

              <h2 className="text-lg font-bold text-gray-900">
                Customer Details
              </h2>

              <button
                type="button"
                onClick={() => setDetailsOpen(false)}
                className="rounded-lg p-2 text-gray-500 hover:bg-gray-100"
              >
                <X size={20} />
              </button>

            </div>

            <div className="space-y-4 p-6">

              <div>
                <p className="text-xs text-gray-500">Customer Name</p>
                <p className="font-semibold text-gray-900">
                  {selectedCustomer.name}
                </p>
              </div>

              <div>
                <p className="text-xs text-gray-500">Phone</p>
                <p className="text-sm text-gray-800">
                  {selectedCustomer.phone || '—'}
                </p>
              </div>

              <div>
                <p className="text-xs text-gray-500">Email</p>
                <p className="text-sm text-gray-800">
                  {selectedCustomer.email || '—'}
                </p>
              </div>

              <div>
                <p className="text-xs text-gray-500">Address</p>
                <p className="text-sm text-gray-800">
                  {selectedCustomer.address || '—'}
                </p>
              </div>

              <div>
                <p className="text-xs text-gray-500">Note</p>
                <p className="text-sm text-gray-800">
                  {selectedCustomer.note || '—'}
                </p>
              </div>

              <div>
                <p className="text-xs text-gray-500">Status</p>
                <p className="text-sm font-medium">
                  {selectedCustomer.status}
                </p>
              </div>

              <div>
                <p className="text-xs text-gray-500">Customer Since</p>
                <p className="text-sm text-gray-800">
                  {new Date(selectedCustomer.createdAt).toLocaleDateString()}
                </p>
              </div>

            </div>

          </div>
        </div>
      )}

    </div>
  )
}
