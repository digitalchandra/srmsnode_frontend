
import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Store,
  Clock,
  CheckCircle,
  Ban,
  XCircle,
  LogOut,
  ShieldCheck,
  RefreshCw,
} from 'lucide-react'
import superAdminApi from '../../services/superAdminApi'

type DashboardStats = {
  totalVendors: number
  pendingVendors: number
  activeVendors: number
  suspendedVendors: number
  rejectedVendors: number
}

const initialStats: DashboardStats = {
  totalVendors: 0,
  pendingVendors: 0,
  activeVendors: 0,
  suspendedVendors: 0,
  rejectedVendors: 0,
}

export default function SuperAdminDashboard() {
  const navigate = useNavigate()

  const [stats, setStats] = useState<DashboardStats>(initialStats)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [pendingReactivationCount, setPendingReactivationCount] =
    useState<number | null>(null)

  async function loadDashboard() {
    setLoading(true)
    setError('')

    try {
      // 1. Load vendor dashboard statistics
      const response = await superAdminApi.get(
        '/super-admin/vendors/dashboard',
      )

      if (!response.data.success) {
        throw new Error(
          response.data.message || 'Unable to load dashboard',
        )
      }

      setStats(response.data.data)

      // 2. Load pending reactivation request count
      try {
        const requestsResponse = await superAdminApi.get(
          '/super-admin/vendors/reactivation-requests',
          {
            params: {
              status: 'PENDING',
              page: 1,
              limit: 1,
            },
          },
        )

        setPendingReactivationCount(
          requestsResponse.data.data.pagination.total,
        )
      } catch (requestError) {
        console.error(
          'Unable to load pending reactivation count:',
          requestError,
        )
        setPendingReactivationCount(null)
      }
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
          response?.data?.message || 'Unable to load dashboard data.',
        )
      } else {
        setError(
          err instanceof Error
            ? err.message
            : 'Network error. Check your backend connection.',
        )
      }
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void loadDashboard()
  }, [])

  function handleLogout() {
    sessionStorage.removeItem('superAdminAccessToken')
    sessionStorage.removeItem('superAdmin')
    navigate('/super-admin/login', { replace: true })
  }

  const cards = [
    {
      title: 'Total Vendors',
      value: stats.totalVendors,
      icon: Store,
      color: 'bg-blue-100 text-blue-700',
    },
    {
      title: 'Pending Approval',
      value: stats.pendingVendors,
      icon: Clock,
      color: 'bg-amber-100 text-amber-700',
    },
    {
      title: 'Active Vendors',
      value: stats.activeVendors,
      icon: CheckCircle,
      color: 'bg-green-100 text-green-700',
    },
    {
      title: 'Suspended Vendors',
      value: stats.suspendedVendors,
      icon: Ban,
      color: 'bg-orange-100 text-orange-700',
    },
    {
      title: 'Rejected Vendors',
      value: stats.rejectedVendors,
      icon: XCircle,
      color: 'bg-red-100 text-red-700',
    },
  ]

  return (
    <div className="min-h-screen bg-slate-100">
      {/* Header */}
      <header className="flex items-center justify-between bg-slate-950 px-6 py-5 text-white shadow">
        <div className="flex items-center gap-3">
          <ShieldCheck size={30} />
          <div>
            <h1 className="text-xl font-bold">SRMS Super Admin</h1>
            <p className="text-xs text-slate-400">
              Global Business Management
            </p>
          </div>
        </div>

        <button
          onClick={handleLogout}
          className="flex items-center gap-2 rounded-lg bg-slate-800 px-4 py-2 text-sm hover:bg-slate-700"
        >
          <LogOut size={17} />
          Logout
        </button>
      </header>

      {/* Dashboard */}
      <main className="mx-auto max-w-7xl px-6 py-8">
        <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold text-slate-900">
              Dashboard Overview
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              Monitor and manage all registered SRMS businesses.
            </p>
          </div>

          <button
            onClick={loadDashboard}
            disabled={loading}
            className="flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium hover:bg-slate-50 disabled:opacity-50"
          >
            <RefreshCw size={16} />
            Refresh
          </button>
        </div>

        {error && (
          <div className="mb-6 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            {error}
          </div>
        )}

        {loading ? (
          <div className="rounded-xl bg-white p-12 text-center text-slate-500 shadow-sm">
            Loading dashboard statistics...
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {cards.map((card) => {
              const Icon = card.icon

              return (
                <div
                  key={card.title}
                  className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm"
                >
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium text-slate-500">
                      {card.title}
                    </p>

                    <div className={`rounded-lg p-3 ${card.color}`}>
                      <Icon size={22} />
                    </div>
                  </div>

                  <p className="mt-5 text-3xl font-bold text-slate-900">
                    {card.value}
                  </p>
                </div>
              )
            })}
          </div>
        )}

        {/* Vendor Management */}
        <div className="mt-8 rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <h3 className="text-lg font-semibold text-slate-900">
            Vendor Management
          </h3>

          <p className="mt-2 text-sm text-slate-500">
            Manage registrations, approvals and business accounts across SRMS.
          </p>

          <button
            onClick={() => navigate('/super-admin/vendors')}
            className="mt-5 rounded-lg bg-green-900 px-5 py-3 text-sm font-semibold text-white hover:bg-slate-800"
          >
            Manage Vendors
          </button>
        </div>

        {/* Reactivation Requests */}
        <div className="mt-6 rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="mb-5 flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-500">
                Pending Requests
              </p>

              <p className="mt-1 text-3xl font-bold text-amber-600">
                {pendingReactivationCount === null
                  ? '—'
                  : pendingReactivationCount}
              </p>
            </div>

            <div className="rounded-xl bg-amber-100 p-4 text-amber-700">
              <Clock size={28} />
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Clock className="text-amber-600" size={25} />

            <div>
              <h3 className="text-lg font-semibold text-slate-900">
                Reactivation Requests
              </h3>

              <p className="mt-1 text-sm text-slate-500">
                Review and approve or reject vendor account reactivation requests.
              </p>
            </div>
          </div>

          <button
            onClick={() => navigate('/super-admin/reactivation-requests')}
            className="mt-5 rounded-lg bg-amber-600 px-5 py-3 text-sm font-semibold text-white hover:bg-amber-700"
          >
            Manage Reactivation Requests
          </button>
        </div>
      </main>
    </div>
  )
}
