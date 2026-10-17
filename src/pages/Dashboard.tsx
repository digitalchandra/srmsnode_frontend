
import {
  IndianRupee,
  ShoppingBag,
  Package,
  Users,
} from 'lucide-react'

const stats = [
  { title: 'Total Sales', value: '¥0', icon: IndianRupee },
  { title: 'Total Orders', value: '0', icon: ShoppingBag },
  { title: 'Total Products', value: '0', icon: Package },
  { title: 'Total Customers', value: '0', icon: Users },
]

export default function Dashboard() {
  return (
    <div className="space-y-8">
      <div>
        <p className="text-sm font-medium text-blue-600">
          BUSINESS OVERVIEW
        </p>
        <h1 className="mt-2 text-3xl font-bold">Dashboard</h1>
        <p className="mt-2 text-slate-500">
          Monitor your store's sales and operations.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {stats.map(({ title, value, icon: Icon }) => (
          <div
            key={title}
            className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
          >
            <div className="flex items-center justify-between">
              <p className="text-sm text-slate-500">{title}</p>
              <Icon className="text-blue-600" size={22} />
            </div>
            <p className="mt-5 text-3xl font-bold">{value}</p>
          </div>
        ))}
      </div>

      <section className="rounded-2xl border border-slate-200 bg-white p-6">
        <h2 className="text-lg font-semibold">Sales Overview</h2>
        <p className="mt-2 text-sm text-slate-500">
          Sales analytics will appear here after API integration.
        </p>
      </section>
    </div>
  )
}
