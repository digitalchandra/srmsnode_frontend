
import { useCallback, useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  RefreshCw,
  Store,
  CheckCircle,
  XCircle,
  Ban,
  RotateCcw,
  Eye,
  Search,
  X,
} from 'lucide-react'
import superAdminApi from '../../services/superAdminApi'

type VendorStatus = 'PENDING' | 'ACTIVE' | 'SUSPENDED' | 'REJECTED'

type Vendor = {
  _id: string
  businessName: string
  subdomain: string
  country?: string
  currency?: string
  status: VendorStatus
  createdAt: string
  owner?: {
    name: string
    email: string
    status: string
  } | null
}

type Pagination = {
  total: number
  page: number
  limit: number
  totalPages: number
}

type ActionType = 'approve' | 'reject' | 'suspend' | 'reactivate'

const statuses = [
  'ALL',
  'PENDING',
  'ACTIVE',
  'SUSPENDED',
  'REJECTED',
] as const

const statusStyles: Record<VendorStatus, string> = {
  PENDING: 'bg-amber-100 text-amber-800',
  ACTIVE: 'bg-green-100 text-green-800',
  SUSPENDED: 'bg-orange-100 text-orange-800',
  REJECTED: 'bg-red-100 text-red-800',
}

export default function VendorManagement() {
  const navigate = useNavigate()

  const [vendors, setVendors] = useState<Vendor[]>([])
  const [statusFilter, setStatusFilter] =
    useState<(typeof statuses)[number]>('ALL')
  const [pagination, setPagination] = useState<Pagination>({
    total: 0,
    page: 1,
    limit: 20,
    totalPages: 0,
  })

  const [loading, setLoading] = useState(true)

  const [error, setError] = useState('')

  const [success, setSuccess] = useState('')

  const [selectedVendor, setSelectedVendor] = useState<Vendor | null>(null)

  const [action, setAction] = useState<ActionType | null>(null)

  const [reason, setReason] = useState('')

  const [actionLoading, setActionLoading] = useState(false)

  const [searchInput, setSearchInput] = useState('')

  const [searchTerm, setSearchTerm] = useState('')

  const loadVendors = useCallback(async (page = 1) => {
    setLoading(true)
    setError('')

    try {
      const params: Record<string, string | number> = {
        page,
        limit: 20,
      }

    if (statusFilter !== 'ALL') {
        params.status = statusFilter
      }

      if (searchTerm) {
        params.search = searchTerm
    }

      const response = await superAdminApi.get(
        '/super-admin/vendors',
        { params },
      )

      if (!response.data.success) {
        throw new Error(response.data.message || 'Unable to load vendors')
      }

      setVendors(response.data.data.vendors || [])
      setPagination(response.data.data.pagination)
    } catch (err: unknown) {
      if (
        typeof err === 'object' &&
        err !== null &&
        'response' in err
      ) {
        const response = (
          err as {
            response?: {
              status?: number
              data?: { message?: string }
            }
          }
        ).response

        if (response?.status === 401 || response?.status === 403) {
          sessionStorage.removeItem('superAdminAccessToken')
          sessionStorage.removeItem('superAdmin')
          navigate('/super-admin/login', { replace: true })
          return
        }

        setError(
          response?.data?.message || 'Unable to load vendor records.',
        )
      } else {
        setError(
          err instanceof Error ? err.message : 'Network error.',
        )
      }
    } finally {
      setLoading(false)
    }
  }, [statusFilter, searchTerm, navigate])

  useEffect(() => {
    void loadVendors(1)
  }, [loadVendors])

  function openAction(vendor: Vendor, actionType: ActionType) {
    setSelectedVendor(vendor)
    setAction(actionType)
    setReason('')
    setError('')
    setSuccess('')
  }

  function closeAction() {
    if (actionLoading) return
    setSelectedVendor(null)
    setAction(null)
    setReason('')
  }

  async function handleAction() {
    if (!selectedVendor || !action) return

    if (action === 'reject' && !reason.trim()) {
      setError('A rejection reason is required.')
      return
    }

    if (reason.trim().length > 500) {
      setError('Reason cannot exceed 500 characters.')
      return
    }

    setActionLoading(true)
    setError('')

    try {
      const endpoint = `/super-admin/vendors/${selectedVendor._id}/${action}`

      const payload =
        action === 'reject' || action === 'suspend'
          ? { reason: reason.trim() }
          : {}

      const response = await superAdminApi.patch(endpoint, payload)

      if (!response.data.success) {
        throw new Error(response.data.message || 'Action failed.')
      }

      setSuccess(response.data.message || 'Vendor updated successfully.')
      setSelectedVendor(null)
      setAction(null)
      setReason('')

      await loadVendors(pagination.page)
    } catch (err: unknown) {
      if (
        typeof err === 'object' &&
        err !== null &&
        'response' in err
      ) {
        const response = (
          err as {
            response?: {
              status?: number
              data?: { message?: string }
            }
          }
        ).response

        if (response?.status === 401 || response?.status === 403) {
          sessionStorage.removeItem('superAdminAccessToken')
          sessionStorage.removeItem('superAdmin')
          navigate('/super-admin/login', { replace: true })
          return
        }

        setError(
          response?.data?.message || 'Unable to update vendor.',
        )
      } else {
        setError(
          err instanceof Error ? err.message : 'Network error.',
        )
      }
    } finally {
      setActionLoading(false)
    }
  }

  function formatDate(date: string) {
    return new Date(date).toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    })
  }

  const actionDetails: Record<
    ActionType,
    { title: string; description: string; button: string }
  > = {
    approve: {
      title: 'Approve Vendor',
      description: 'This business will become active and its owner can log in.',
      button: 'Confirm Approval',
    },
    reject: {
      title: 'Reject Vendor',
      description: 'Please provide a reason for rejecting this registration.',
      button: 'Confirm Rejection',
    },
    suspend: {
      title: 'Suspend Vendor',
      description: 'This business will lose access to its SRMS workspace.',
      button: 'Confirm Suspension',
    },
    reactivate: {
      title: 'Reactivate Vendor',
      description: 'This business will regain access to its SRMS workspace.',
      button: 'Confirm Reactivation',
    },
  }

  return (
    <main className="min-h-screen bg-slate-100">
      <header className="flex items-center justify-between bg-slate-950 px-6 py-5 text-white">
        <div className="flex items-center gap-3">
          <Store size={28} />
          <div>
            <h1 className="text-xl font-bold">SRMS Super Admin</h1>
            <p className="text-xs text-slate-400">Vendor Management</p>
          </div>
        </div>

        <button
          onClick={() => navigate('/super-admin/dashboard')}
          className="flex items-center gap-2 rounded-lg bg-slate-800 px-4 py-2 text-sm hover:bg-slate-700"
        >
          <ArrowLeft size={16} />
          Dashboard
        </button>
      </header>

      <section className="mx-auto max-w-7xl px-6 py-8">
        <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold text-slate-900">
              Registered Vendors
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              Review and manage all businesses registered on SRMS.
            </p>
          </div>

          <button
            onClick={() => {
              setSuccess('')
              void loadVendors(pagination.page)
            }}
            disabled={loading}
            className="flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium hover:bg-slate-50 disabled:opacity-50"
          >
            <RefreshCw size={16} />
            Refresh
          </button>
        </div>

        {success && (
          <div className="mb-5 rounded-lg border border-green-200 bg-green-50 p-3 text-sm text-green-800">
            {success}
          </div>
        )}

        {error && (
          <div className="mb-5 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
            {error}
          </div>
        )}

        <div className="mb-5 flex flex-wrap gap-2">
          {statuses.map((status) => (
            <button
              key={status}
              onClick={() => {
                setStatusFilter(status)
                setSuccess('')
                setError('')
              }}
              className={`rounded-lg px-4 py-2 text-sm font-medium transition ${
                statusFilter === status
                  ? 'bg-slate-900 text-white'
                  : 'border border-slate-300 bg-white text-slate-600 hover:bg-slate-50'
              }`}
            >
              {status === 'ALL'
                ? 'All Vendors'
                : status.charAt(0) + status.slice(1).toLowerCase()}
            </button>
          ))}
        </div>


        {/* Vendor Search */}
        <form
          onSubmit={(event) => {
            event.preventDefault()
            setSearchTerm(searchInput.trim())
            setSuccess('')
            setError('')
          }}
          className="mb-5 flex flex-col gap-2 sm:flex-row"
        >
          <div className="relative flex-1">
            <Search
              size={18}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
            />

            <input
              type="text"
              value={searchInput}
              onChange={(event) => setSearchInput(event.target.value)}
              placeholder="Search business, owner email, or subdomain..."
              maxLength={100}
              className="w-full rounded-lg border border-slate-300 bg-white py-3 pl-10 pr-10 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            />

            {searchInput && (
              <button
                type="button"
                title="Clear search"
                onClick={() => {
                  setSearchInput('')
                  setSearchTerm('')
                  setSuccess('')
                  setError('')
                }}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700"
              >
                <X size={18} />
              </button>
            )}
          </div>

          <button
            type="submit"
            disabled={loading}
            className="flex items-center justify-center gap-2 rounded-lg bg-blue-600 px-6 py-3 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
          >
            <Search size={16} />
            Search
          </button>
        </form>


        <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200 px-5 py-4">
            <h3 className="font-semibold text-slate-900">
              Vendor Records
            </h3>
            <p className="text-sm text-slate-500">
              {pagination.total} total vendors
            </p>
          </div>

          {loading ? (
            <div className="p-12 text-center text-slate-500">
              Loading vendor records...
            </div>
          ) : vendors.length === 0 ? (
            <div className="p-12 text-center text-slate-500">
              {searchTerm
                ? `No vendors found matching "${searchTerm}".`
                : 'No vendors found for this status.'}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[900px] text-left text-sm">
                <thead className="bg-slate-50 text-xs uppercase text-slate-500">
                  <tr>
                    <th className="px-5 py-4">Business</th>
                    <th className="px-5 py-4">Owner</th>
                    <th className="px-5 py-4">Subdomain</th>
                    <th className="px-5 py-4">Registered</th>
                    <th className="px-5 py-4">Status</th>
                    <th className="px-5 py-4">Actions</th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-slate-100">
                  {vendors.map((vendor) => (
                    <tr key={vendor._id} className="hover:bg-slate-50">
                      <td className="px-5 py-4">
                        <p className="font-semibold text-slate-900">
                          {vendor.businessName}
                        </p>
                        <p className="mt-1 text-xs text-slate-500">
                          {vendor.country || '—'}
                        </p>
                      </td>

                      <td className="px-5 py-4">
                        <p className="font-medium text-slate-800">
                          {vendor.owner?.name || 'No owner'}
                        </p>
                        <p className="mt-1 text-xs text-slate-500">
                          {vendor.owner?.email || '—'}
                        </p>
                      </td>

                      <td className="px-5 py-4 text-slate-600">
                        {vendor.subdomain}
                      </td>

                      <td className="px-5 py-4 text-slate-600">
                        {formatDate(vendor.createdAt)}
                      </td>

                      <td className="px-5 py-4">
                        <span className={`rounded-full px-3 py-1 text-xs font-semibold ${statusStyles[vendor.status]}`}>
                          {vendor.status}
                        </span>
                      </td>

                      <td className="px-5 py-4">
                        <div className="flex flex-wrap gap-2">
                          {vendor.status === 'PENDING' && (
                            <>
                              <button
                                title="Approve vendor"
                                onClick={() => openAction(vendor, 'approve')}
                                className="rounded-md bg-green-100 p-2 text-green-700 hover:bg-green-200"
                              >
                                <CheckCircle size={17} />
                              </button>

                              <button
                                title="Reject vendor"
                                onClick={() => openAction(vendor, 'reject')}
                                className="rounded-md bg-red-100 p-2 text-red-700 hover:bg-red-200"
                              >
                                <XCircle size={17} />
                              </button>
                            </>
                          )}

                          {vendor.status === 'ACTIVE' && (
                            <button
                              title="Suspend vendor"
                              onClick={() => openAction(vendor, 'suspend')}
                              className="rounded-md bg-orange-100 p-2 text-orange-700 hover:bg-orange-200"
                            >
                              <Ban size={17} />
                            </button>
                          )}

                          {vendor.status === 'SUSPENDED' && (
                            <button
                              title="Reactivate vendor"
                              onClick={() => openAction(vendor, 'reactivate')}
                              className="rounded-md bg-blue-100 p-2 text-blue-700 hover:bg-blue-200"
                            >
                              <RotateCcw size={17} />
                            </button>
                          )}

                          <button
                            title="View vendor details"
                            onClick={() => navigate(`/super-admin/vendors/${vendor._id}`)}
                            className="rounded-md bg-slate-100 p-2 text-slate-700 hover:bg-slate-200"
                          >
                            <Eye size={17} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-200 px-5 py-4">
            <p className="text-sm text-slate-500">
              Page {pagination.page} of {Math.max(1, pagination.totalPages)}
            </p>

            <div className="flex gap-2">
              <button
                disabled={loading || pagination.page <= 1}
                onClick={() => void loadVendors(pagination.page - 1)}
                className="flex items-center gap-1 rounded-lg border border-slate-300 px-3 py-2 text-sm disabled:opacity-40"
              >
                <ChevronLeft size={16} />
                Previous
              </button>

              <button
                disabled={
                  loading ||
                  pagination.page >= pagination.totalPages
                }
                onClick={() => void loadVendors(pagination.page + 1)}
                className="flex items-center gap-1 rounded-lg border border-slate-300 px-3 py-2 text-sm disabled:opacity-40"
              >
                Next
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
        </div>
      </section>

      {selectedVendor && action && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <section
            role="dialog"
            aria-modal="true"
            aria-labelledby="vendor-action-title"
            className="w-full max-w-md rounded-xl bg-white p-6 shadow-xl"
          >
            <h3 id="vendor-action-title" className="text-xl font-bold text-slate-900">
              {actionDetails[action].title}
            </h3>

            <p className="mt-2 text-sm text-slate-600">
              Business: <strong>{selectedVendor.businessName}</strong>
            </p>

            <p className="mt-2 text-sm text-slate-500">
              {actionDetails[action].description}
            </p>

            {(action === 'reject' || action === 'suspend') && (
              <div className="mt-5">
                <label htmlFor="action-reason" className="mb-2 block text-sm font-medium text-slate-700">
                  Reason {action === 'reject' ? '(required)' : '(optional)'}
                </label>

                <textarea
                  id="action-reason"
                  rows={4}
                  maxLength={500}
                  required={action === 'reject'}
                  value={reason}
                  onChange={(event) => setReason(event.target.value)}
                  placeholder={
                    action === 'reject'
                      ? 'Explain why this registration is rejected...'
                      : 'Enter the reason for suspension...'
                  }
                  className="w-full rounded-lg border border-slate-300 p-3 text-sm outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
                />

                <p className="mt-1 text-right text-xs text-slate-400">
                  {reason.length}/500
                </p>
              </div>
            )}

            {error && (
              <div className="mt-4 rounded-lg bg-red-50 p-3 text-sm text-red-700">
                {error}
              </div>
            )}

            <div className="mt-6 flex justify-end gap-3">
              <button
                onClick={closeAction}
                disabled={actionLoading}
                className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50"
              >
                Cancel
              </button>

              <button
                onClick={() => void handleAction()}
                disabled={
                  actionLoading ||
                  (action === 'reject' && !reason.trim())
                }
                className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {actionLoading
                  ? 'Processing...'
                  : actionDetails[action].button}
              </button>
            </div>
          </section>
        </div>
      )}
    </main>
  )
}
