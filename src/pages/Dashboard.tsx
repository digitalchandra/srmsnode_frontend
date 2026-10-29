
import { useCallback, useEffect, useState } from 'react'
import {
  IndianRupee,
  ShoppingBag,
  Package,
  Users,
  TrendingUp,
  Clock,
  RefreshCw,
  AlertCircle,
} from 'lucide-react'
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import api from '../services/api'
import {
  reportService,
  type SalesSummary,
  type DailySale,
} from '../services/reportService'

const money = (value: number) =>
  new Intl.NumberFormat('ja-JP', {
    style: 'currency',
    currency: 'JPY',
    maximumFractionDigits: 0,
  }).format(Number(value) || 0)

export default function Dashboard() {
  const [summary, setSummary] = useState<SalesSummary | null>(null)
  const [dailySales, setDailySales] = useState<DailySale[]>([])
  const [totalProducts, setTotalProducts] = useState<number | null>(null)
  const [totalCustomers, setTotalCustomers] = useState<number | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const loadDashboard = useCallback(async () => {
    setLoading(true)
    setError('')

    try {
      const today = new Intl.DateTimeFormat('en-CA', {
        timeZone: 'Asia/Kathmandu',
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
      }).format(new Date())

      const startDate = (() => {
        const date = new Date(`${today}T00:00:00Z`)
        date.setUTCDate(date.getUTCDate() - 6)
        return date.toISOString().slice(0, 10)
      })()

      const results = await Promise.allSettled([
        reportService.getSalesSummary(),
        reportService.getDailySales(startDate, today),
        api.get('/products', { params: { page: 1, limit: 1 } }),
        api.get('/customers', { params: { page: 1, limit: 1 } }),
      ])

      if (results[0].status === 'fulfilled') {
        setSummary(results[0].value)
      } else {
        throw new Error('Could not load sales summary. Check the Reports API.')
      }

      if (results[1].status === 'fulfilled') {
        setDailySales(results[1].value.dailySales)
      }

      if (results[2].status === 'fulfilled') {
        const data = results[2].value.data?.data
        const count =
          data?.pagination?.total ??
          data?.total ??
          data?.products?.length ??
          data?.items?.length
        setTotalProducts(typeof count === 'number' ? count : null)
      }

      if (results[3].status === 'fulfilled') {
        const data = results[3].value.data?.data
        const count =
          data?.pagination?.total ??
          data?.total ??
          data?.customers?.length ??
          data?.items?.length
        setTotalCustomers(typeof count === 'number' ? count : null)
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to load dashboard.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void loadDashboard()
  }, [loadDashboard])

  const stats = [
    {
      title: "Today's Sales",
      value: summary ? money(summary.today.totalSales) : '—',
      subtitle: `${summary?.today.salesCount ?? 0} completed sales`,
      icon: IndianRupee,
    },
    {
      title: 'This Week',
      value: summary ? money(summary.thisWeek.totalSales) : '—',
      subtitle: `${summary?.thisWeek.salesCount ?? 0} completed sales`,
      icon: TrendingUp,
    },
    {
      title: 'This Month',
      value: summary ? money(summary.thisMonth.totalSales) : '—',
      subtitle: `${summary?.thisMonth.salesCount ?? 0} completed sales`,
      icon: ShoppingBag,
    },
    {
      title: 'Outstanding',
      value: summary ? money(summary.thisMonth.outstanding) : '—',
      subtitle: 'This month',
      icon: Clock,
    },
    {
      title: 'Total Products',
      value: totalProducts === null ? '—' : totalProducts.toLocaleString(),
      subtitle: 'Product records',
      icon: Package,
    },
    {
      title: 'Total Customers',
      value: totalCustomers === null ? '—' : totalCustomers.toLocaleString(),
      subtitle: 'Customer records',
      icon: Users,
    },
  ]

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-sm font-medium text-blue-600">
            BUSINESS OVERVIEW
          </p>
          <h1 className="mt-2 text-3xl font-bold">Dashboard</h1>
          <p className="mt-2 text-slate-500">
            Monitor your store's sales and operations.
          </p>
        </div>

        <button
          type="button"
          onClick={() => void loadDashboard()}
          disabled={loading}
          className="flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium hover:bg-slate-50 disabled:opacity-50"
        >
          <RefreshCw size={16} />
          {loading ? 'Refreshing...' : 'Refresh'}
        </button>
      </div>

      {error && (
        <div role="alert" className="flex items-start gap-2 rounded-lg bg-red-50 p-4 text-sm text-red-700">
          <AlertCircle size={18} />
          <span>{error}</span>
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {stats.map(({ title, value, subtitle, icon: Icon }) => (
          <div
            key={title}
            className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
          >
            <div className="flex items-center justify-between">
              <p className="text-sm text-slate-500">{title}</p>
              <Icon className="text-blue-600" size={22} />
            </div>
            <p className="mt-4 text-2xl font-bold text-slate-900">
              {loading ? 'Loading...' : value}
            </p>
            <p className="mt-2 text-xs text-slate-500">{subtitle}</p>
          </div>
        ))}
      </div>

      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="mb-5">
          <h2 className="text-lg font-semibold">Daily Sales Trend</h2>
          <p className="mt-1 text-sm text-slate-500">
            Sales for the last seven calendar days
          </p>
        </div>

        {dailySales.length > 0 ? (
          <div className="h-80 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={dailySales}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis
                  dataKey="date"
                  tickFormatter={(value: string) => value.slice(5)}
                />
                <YAxis tickFormatter={(value) => `¥${value}`} />
                <Tooltip
                  labelFormatter={(label) => `Date: ${label}`}
                  formatter={(value) => money(Number(value))}
                />
                <Bar
                  dataKey="totalSales"
                  name="Sales"
                  fill="#2563eb"
                  radius={[5, 5, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <div className="flex h-48 items-center justify-center text-sm text-slate-500">
            {loading ? 'Loading sales chart...' : 'No daily sales data available.'}
          </div>
        )}
      </section>

      <section className="grid gap-4 md:grid-cols-2">
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="font-semibold">Payment Overview</h2>
          <div className="mt-4 flex justify-between gap-3 border-b py-3">
            <span className="text-sm text-slate-500">Paid this month</span>
            <span className="font-semibold text-green-700">
              {summary ? money(summary.thisMonth.totalPaid) : '—'}
            </span>
          </div>
          <div className="flex justify-between gap-3 py-3">
            <span className="text-sm text-slate-500">Outstanding this month</span>
            <span className="font-semibold text-orange-600">
              {summary ? money(summary.thisMonth.outstanding) : '—'}
            </span>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="font-semibold">Sales Overview</h2>
          <div className="mt-4 flex justify-between gap-3 border-b py-3">
            <span className="text-sm text-slate-500">Completed sales today</span>
            <span className="font-semibold">
              {summary?.today.salesCount ?? '—'}
            </span>
          </div>
          <div className="flex justify-between gap-3 py-3">
            <span className="text-sm text-slate-500">Completed sales this month</span>
            <span className="font-semibold">
              {summary?.thisMonth.salesCount ?? '—'}
            </span>
          </div>
        </div>
      </section>
    </div>
  )
}
