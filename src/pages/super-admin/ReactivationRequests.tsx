
import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  RefreshCw,
  ArrowLeft,
  CheckCircle,
  XCircle,
  Clock,
  Store,
  Mail,
  Calendar,
  ShieldCheck,
  Loader2,
  AlertCircle,
} from 'lucide-react'
import superAdminApi from '../../services/superAdminApi'

type RequestStatus = 'PENDING' | 'APPROVED' | 'REJECTED'
type StatusFilter = 'ALL' | RequestStatus

type ReactivationRequest = {
  _id: string
  tenantId: {
    _id: string
    businessName: string
    subdomain: string
    status: string
  }
  requestedBy: {
    _id: string
    name: string
    email: string
  }
  reason: string
  status: RequestStatus
  reviewedBy?: {
    name?: string
    email?: string
  } | null
  reviewedAt?: string | null
  reviewReason?: string | null
  createdAt: string
}

type Pagination = {
  total: number
  page: number
  limit: number
  totalPages: number
}

const emptyPagination: Pagination = {
  total: 0,
  page: 1,
  limit: 20,
  totalPages: 0,
}

const filters: StatusFilter[] = [
  'PENDING',
  'APPROVED',
  'REJECTED',
  'ALL',
]

const formatDate = (date?: string) => {
  if (!date) return '—'

  const parsed = new Date(date)

  return Number.isNaN(parsed.getTime())
    ? '—'
    : parsed.toLocaleString()
}

const statusStyle = (status: string) => {
  switch (status) {
    case 'PENDING':
      return 'bg-amber-100 text-amber-800'
    case 'APPROVED':
      return 'bg-green-100 text-green-800'
    case 'REJECTED':
      return 'bg-red-100 text-red-800'
    default:
      return 'bg-slate-100 text-slate-700'
  }
}

export default function ReactivationRequests() {
  const navigate = useNavigate()

  const [requests, setRequests] = useState<ReactivationRequest[]>([])
  const [pagination, setPagination] = useState<Pagination>(emptyPagination)
  const [statusFilter, setStatusFilter] =
    useState<StatusFilter>('PENDING')

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const [selectedRequest, setSelectedRequest] =
    useState<ReactivationRequest | null>(null)

  const [actionType, setActionType] =
    useState<'APPROVE' | 'REJECT' | null>(null)

  const [reviewReason, setReviewReason] = useState('')
  const [processing, setProcessing] = useState(false)

  async function loadRequests(page = 1) {
    try {
      setLoading(true)
      setError('')

      const params: Record<string, string | number> = {
        page,
        limit: 20,
      }

      if (statusFilter !== 'ALL') {
        params.status = statusFilter
      }

      const response = await superAdminApi.get(
        '/super-admin/vendors/reactivation-requests',
        { params },
      )

      if (!response.data.success) {
        throw new Error(
          response.data.message || 'Unable to load requests.',
        )
      }

      setRequests(response.data.data.requests || [])
      setPagination(response.data.data.pagination || emptyPagination)
    } catch (err: any) {
      if (
        err.response?.status === 401 ||
        err.response?.status === 403
      ) {
        sessionStorage.removeItem('superAdminAccessToken')
        sessionStorage.removeItem('superAdmin')
        navigate('/super-admin/login', { replace: true })
        return
      }

      setError(
        err.response?.data?.message ||
          err.message ||
          'Unable to load reactivation requests.',
      )
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void loadRequests(1)
  }, [statusFilter])

  function openAction(
    request: ReactivationRequest,
    action: 'APPROVE' | 'REJECT',
  ) {
    setSelectedRequest(request)
    setActionType(action)
    setReviewReason('')
    setError('')
    setSuccess('')
  }

  function closeAction() {
    if (processing) return

    setSelectedRequest(null)
    setActionType(null)
    setReviewReason('')
  }

  async function submitAction() {
    if (!selectedRequest || !actionType) return

    if (actionType === 'REJECT' && !reviewReason.trim()) {
      setError('Please enter a reason for rejection.')
      return
    }

    if (reviewReason.trim().length > 500) {
      setError('Review reason cannot exceed 500 characters.')
      return
    }

    try {
      setProcessing(true)
      setError('')
      setSuccess('')

      const requestId = selectedRequest._id

      if (actionType === 'APPROVE') {
        await superAdminApi.patch(
          `/super-admin/vendors/reactivation-requests/${requestId}/approve`,
          {
            reviewReason: reviewReason.trim() || undefined,
          },
        )

        setSuccess('Reactivation request approved successfully.')
      } else {
        await superAdminApi.patch(
          `/super-admin/vendors/reactivation-requests/${requestId}/reject`,
          {
            reviewReason: reviewReason.trim(),
          },
        )

        setSuccess('Reactivation request rejected successfully.')
      }

      setSelectedRequest(null)
      setActionType(null)
      setReviewReason('')

      await loadRequests(pagination.page)
    } catch (err: any) {
      setError(
        err.response?.data?.message ||
          'Unable to process this request.',
      )
    } finally {
      setProcessing(false)
    }
  }

  return (
    <div className="min-h-screen bg-slate-100">
      <header className="flex items-center justify-between bg-slate-950 px-6 py-5 text-white shadow">
        <div className="flex items-center gap-3">
          <ShieldCheck size={28} />
          <div>
            <h1 className="text-xl font-bold">SRMS Super Admin</h1>
            <p className="text-xs text-slate-400">
              Reactivation Request Management
            </p>
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

      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
        <div className="mb-7 flex flex-wrap items-center justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold text-slate-900">
              Reactivation Requests
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              Review and manage vendor account reactivation requests.
            </p>
          </div>

          <button
            onClick={() => void loadRequests(pagination.page)}
            disabled={loading}
            className="flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium hover:bg-slate-50 disabled:opacity-50"
          >
            <RefreshCw size={16} />
            Refresh
          </button>
        </div>

        {success && (
          <div className="mb-5 flex items-center gap-2 rounded-lg border border-green-200 bg-green-50 p-4 text-sm text-green-800">
            <CheckCircle size={18} />
            {success}
          </div>
        )}

        {error && !selectedRequest && (
          <div className="mb-5 flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            <AlertCircle size={18} />
            {error}
          </div>
        )}

        <div className="mb-6 flex flex-wrap gap-2">
          {filters.map((filter) => (
            <button
              key={filter}
              onClick={() => {
                setStatusFilter(filter)
                setSuccess('')
                setError('')
              }}
              className={`rounded-lg px-4 py-2 text-sm font-medium transition ${
                statusFilter === filter
                  ? 'bg-slate-900 text-white'
                  : 'border border-slate-300 bg-white text-slate-600 hover:bg-slate-50'
              }`}
            >
              {filter === 'ALL'
                ? 'All Requests'
                : filter.charAt(0) + filter.slice(1).toLowerCase()}
            </button>
          ))}
        </div>

        <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 px-5 py-4">
            <h3 className="font-semibold text-slate-900">
              Request Records
            </h3>
            <span className="text-sm text-slate-500">
              {pagination.total} total requests
            </span>
          </div>

          {loading ? (
            <div className="p-12 text-center text-slate-500">
              <Loader2 className="mx-auto mb-3 animate-spin" />
              Loading reactivation requests...
            </div>
          ) : requests.length === 0 ? (
            <div className="p-12 text-center">
              <Clock className="mx-auto mb-3 text-slate-400" size={35} />
              <p className="font-medium text-slate-700">
                No requests found
              </p>
              <p className="mt-1 text-sm text-slate-500">
                There are no requests under this filter.
              </p>
            </div>
          ) : (
            <div className="divide-y divide-slate-200">
              {requests.map((request) => (
                <article key={request._id} className="p-5 sm:p-6">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <h4 className="text-lg font-semibold text-slate-900">
                        {request.tenantId?.businessName || 'Unknown Business'}
                      </h4>

                      <p className="mt-1 text-sm text-slate-500">
                        Subdomain: {request.tenantId?.subdomain || '—'}
                      </p>
                    </div>

                    <span
                      className={`rounded-full px-3 py-1 text-xs font-semibold ${statusStyle(request.status)}`}
                    >
                      {request.status}
                    </span>
                  </div>

                  <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    <div className="flex items-start gap-3">
                      <Store className="mt-1 text-slate-400" size={18} />
                      <div>
                        <p className="text-xs text-slate-500">Owner</p>
                        <p className="text-sm font-medium text-slate-800">
                          {request.requestedBy?.name || '—'}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-start gap-3">
                      <Mail className="mt-1 text-slate-400" size={18} />
                      <div>
                        <p className="text-xs text-slate-500">Email</p>
                        <p className="break-all text-sm font-medium text-slate-800">
                          {request.requestedBy?.email || '—'}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-start gap-3">
                      <Calendar className="mt-1 text-slate-400" size={18} />
                      <div>
                        <p className="text-xs text-slate-500">Requested At</p>
                        <p className="text-sm font-medium text-slate-800">
                          {formatDate(request.createdAt)}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="mt-5 rounded-lg bg-slate-50 p-4">
                    <p className="mb-1 text-xs font-semibold uppercase text-slate-500">
                      Vendor's Reason
                    </p>
                    <p className="text-sm leading-6 text-slate-700">
                      {request.reason}
                    </p>
                  </div>

                  {request.status !== 'PENDING' && (
                    <div className="mt-4 rounded-lg border border-slate-200 p-4">
                      <p className="text-xs font-semibold uppercase text-slate-500">
                        Review Information
                      </p>
                      <p className="mt-2 text-sm text-slate-700">
                        Reviewed by: {request.reviewedBy?.name || 'Super Admin'}
                      </p>
                      <p className="mt-1 text-sm text-slate-700">
                        Reviewed at: {formatDate(request.reviewedAt || undefined)}
                      </p>
                      {request.reviewReason && (
                        <p className="mt-2 text-sm text-slate-700">
                          Review reason: {request.reviewReason}
                        </p>
                      )}
                    </div>
                  )}

                  {request.status === 'PENDING' && (
                    <div className="mt-5 flex flex-wrap gap-3">
                      <button
                        onClick={() => openAction(request, 'APPROVE')}
                        className="flex items-center gap-2 rounded-lg bg-green-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-green-700"
                      >
                        <CheckCircle size={17} />
                        Approve
                      </button>

                      <button
                        onClick={() => openAction(request, 'REJECT')}
                        className="flex items-center gap-2 rounded-lg bg-red-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-red-700"
                      >
                        <XCircle size={17} />
                        Reject
                      </button>
                    </div>
                  )}
                </article>
              ))}
            </div>
          )}
        </div>

        {pagination.totalPages > 1 && (
          <div className="mt-5 flex items-center justify-between">
            <p className="text-sm text-slate-500">
              Page {pagination.page} of {pagination.totalPages}
            </p>

            <div className="flex gap-2">
              <button
                disabled={pagination.page <= 1 || loading}
                onClick={() => void loadRequests(pagination.page - 1)}
                className="rounded-lg border bg-white px-4 py-2 text-sm disabled:opacity-40"
              >
                Previous
              </button>

              <button
                disabled={
                  pagination.page >= pagination.totalPages || loading
                }
                onClick={() => void loadRequests(pagination.page + 1)}
                className="rounded-lg border bg-white px-4 py-2 text-sm disabled:opacity-40"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </main>

      {selectedRequest && actionType && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-lg rounded-xl bg-white p-6 shadow-xl">
            <h3 className="text-xl font-bold text-slate-900">
              {actionType === 'APPROVE'
                ? 'Approve Reactivation Request?'
                : 'Reject Reactivation Request?'}
            </h3>

            <p className="mt-2 text-sm text-slate-600">
              Business: {selectedRequest.tenantId?.businessName}
            </p>

            <p className="mt-2 text-sm text-slate-500">
              {actionType === 'APPROVE'
                ? 'This will reactivate the vendor account and allow the owner to log in again.'
                : 'The vendor account will remain deactivated. Please provide a reason for rejection.'}
            </p>

            {actionType === 'REJECT' && (
              <div className="mt-5">
                <label className="mb-2 block text-sm font-medium text-slate-700">
                  Rejection Reason *
                </label>

                <textarea
                  value={reviewReason}
                  onChange={(event) => setReviewReason(event.target.value)}
                  rows={4}
                  maxLength={500}
                  placeholder="Explain why this request is being rejected..."
                  className="w-full rounded-lg border border-slate-300 p-3 text-sm outline-none focus:border-slate-600 focus:ring-2 focus:ring-slate-200"
                />

                <p className="mt-1 text-right text-xs text-slate-400">
                  {reviewReason.length}/500
                </p>
              </div>
            )}

            {error && (
              <div className="mt-4 rounded-lg bg-red-50 p-3 text-sm text-red-700">
                {error}
              </div>
            )}

            <div className="mt-6 flex flex-wrap justify-end gap-3">
              <button
                onClick={closeAction}
                disabled={processing}
                className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50"
              >
                Cancel
              </button>

              <button
                onClick={() => void submitAction()}
                disabled={
                  processing ||
                  (actionType === 'REJECT' && !reviewReason.trim())
                }
                className={`flex items-center gap-2 rounded-lg px-5 py-2 text-sm font-semibold text-white disabled:opacity-50 ${
                  actionType === 'APPROVE'
                    ? 'bg-green-600 hover:bg-green-700'
                    : 'bg-red-600 hover:bg-red-700'
                }`}
              >
                {processing && (
                  <Loader2 size={16} className="animate-spin" />
                )}
                {processing
                  ? 'Processing...'
                  : actionType === 'APPROVE'
                    ? 'Confirm Approval'
                    : 'Confirm Rejection'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
