
import { useEffect, useState } from 'react'
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import {
  AlertCircle,
  RefreshCw,
  TrendingUp,
  Wallet,
  ShoppingBag,
  Clock,
} from 'lucide-react'
import {
  reportService,
  type SalesSummary,
} from '../services/reportService'

const money = (value: number) =>
  new Intl.NumberFormat('ja-JP', {
    style: 'currency',
    currency: 'JPY',
    maximumFractionDigits: 0,
  }).format(value || 0)

export default function Reports() {
  const [summary, setSummary] = useState<SalesSummary | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const loadReports = async () => {
    setLoading(true)
    setError('')

    try {
      const data = await reportService.getSalesSummary()
      setSummary(data)
    } catch (err: unknown) {
      setError(
        err instanceof Error
          ? err.message
          : 'Failed to load reports.',
      )
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void loadReports()
  }, [])

  if (loading) {
    return <div className="p-6 text-gray-500">Loading reports...</div>
  }

  if (error || !summary) {
    return (
      <div className="m-6 rounded-lg bg-red-50 p-4 text-red-700">
        <div className="flex items-center gap-2">
          <AlertCircle size={20} />
          {error || 'Report data is unavailable.'}
        </div>
        <button
          onClick={() => void loadReports()}
          className="mt-3 rounded-lg bg-red-600 px-4 py-2 text-white"
        >
          Try Again
        </button>
      </div>
    )
  }

  const cards = [
    {
      title: "Today's Sales",
      value: money(summary.today.totalSales),
      subtitle: `${summary.today.salesCount} completed sales`,
      icon: ShoppingBag,
    },
    {
      title: 'This Week',
      value: money(summary.thisWeek.totalSales),
      subtitle: `${summary.thisWeek.salesCount} completed sales`,
      icon: TrendingUp,
    },
    {
      title: 'This Month',
      value: money(summary.thisMonth.totalSales),
      subtitle: `${summary.thisMonth.salesCount} completed sales`,
      icon: Wallet,
    },
    {
      title: 'Outstanding This Month',
      value: money(summary.thisMonth.outstanding),
      subtitle: 'Remaining amount due',
      icon: Clock,
    },
  ]

  const chartData = [
    {
      period: 'Today',
      sales: summary.today.totalSales,
      paid: summary.today.totalPaid,
    },
    {
      period: 'This Week',
      sales: summary.thisWeek.totalSales,
      paid: summary.thisWeek.totalPaid,
    },
    {
      period: 'This Month',
      sales: summary.thisMonth.totalSales,
      paid: summary.thisMonth.totalPaid,
    },
  ]

  return (
    <div className="space-y-6 p-4 md:p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Reports & Analytics
          </h1>
          <p className="mt-1 text-sm text-gray-500">
            Sales performance and payment overview
          </p>
        </div>

        <button
          onClick={() => void loadReports()}
          className="flex items-center gap-2 rounded-lg border bg-white px-4 py-2 hover:bg-gray-50"
        >
          <RefreshCw size={16} />
          Refresh
        </button>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {cards.map((card) => {
          const Icon = card.icon

          return (
            <div
              key={card.title}
              className="rounded-xl border bg-white p-5 shadow-sm"
            >
              <div className="flex items-center justify-between">
                <p className="text-sm text-gray-500">{card.title}</p>
                <Icon size={21} className="text-blue-600" />
              </div>
              <p className="mt-3 text-2xl font-bold text-gray-900">
                {card.value}
              </p>
              <p className="mt-2 text-xs text-gray-500">
                {card.subtitle}
              </p>
            </div>
          )
        })}
      </div>

      <div className="rounded-xl border bg-white p-5 shadow-sm">
        <h2 className="text-lg font-semibold text-gray-900">
          Sales vs Payments
        </h2>
        <p className="mb-5 mt-1 text-sm text-gray-500">
          Comparison of sales totals and recorded payments
        </p>

        <div className="h-80 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="period" />
              <YAxis tickFormatter={(value) => `¥${value}`} />
              <Tooltip
                formatter={(value) => money(Number(value))}
              />
              <Bar dataKey="sales" name="Sales" fill="#2563eb" radius={[5, 5, 0, 0]} />
              <Bar dataKey="paid" name="Paid" fill="#16a34a" radius={[5, 5, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="rounded-xl border bg-white p-5 shadow-sm">
        <h2 className="text-lg font-semibold">Monthly Summary</h2>

        <div className="mt-4 divide-y">
          <div className="flex justify-between gap-4 py-3">
            <span className="text-gray-600">Completed sales</span>
            <span className="font-semibold">
              {summary.completedSalesCount}
            </span>
          </div>
          <div className="flex justify-between gap-4 py-3">
            <span className="text-gray-600">Total sales</span>
            <span className="font-semibold">
              {money(summary.thisMonth.totalSales)}
            </span>
          </div>
          <div className="flex justify-between gap-4 py-3">
            <span className="text-gray-600">Paid amount</span>
            <span className="font-semibold text-green-700">
              {money(summary.thisMonth.totalPaid)}
            </span>
          </div>
          <div className="flex justify-between gap-4 py-3">
            <span className="text-gray-600">Outstanding amount</span>
            <span className="font-semibold text-orange-600">
              {money(summary.thisMonth.outstanding)}
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}
