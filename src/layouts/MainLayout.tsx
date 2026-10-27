
import { NavLink, Outlet } from 'react-router-dom'
import {useNavigate} from 'react-router-dom'
import {
  LayoutDashboard,
  Package,
  Tags,
  Warehouse,
  ShoppingCart,
  Users,
  BarChart3,
  Settings,
  Store,
  Bell,
  Search,
  ShieldCheck,
  Clock,
  Database,
  LoaderIcon,
  LogOut,
  Barcode,
  Handshake,
  RotateCw,
} from 'lucide-react'

const navigation = [
  { name: 'Dashboard', path: '/', icon: LayoutDashboard },
  { name: 'POS', path: '/POS', icon: ShoppingCart },
  {name: 'Sales', path: '/sales', icon: Barcode},
  {name: 'Payments', path: '/payments', icon: Handshake},
  { name: 'Products', path: '/products', icon: Package },
  { name: 'Sales Returns', path: '/sales-returns', icon: RotateCw },
  { name: 'Categories', path: '/categories', icon: Tags },
  { name: 'Brands', path: '/brands', icon: ShieldCheck },
  { name: 'Inventory', path: '/inventory', icon: Warehouse },
  { name: 'Expiry Tracking', path: '/expiry-tracking', icon: Clock },
  { name: 'Stock Movements', path: '/stock-movements', icon: LoaderIcon },
  { name: 'Stock Adjustment', path: '/stock-adjustment', icon: Database },
  { name: 'Customers', path: '/customers', icon: Users },
  { name: 'Reports', path: '/reports', icon: BarChart3 },
  { name: 'Settings', path: '/settings', icon: Settings },

]



export default function MainLayout() {

  const navigate = useNavigate()

function handleLogout() {
  sessionStorage.removeItem('accessToken')
  sessionStorage.removeItem('refreshToken')
  sessionStorage.removeItem('user')

  navigate('/login', { replace: true })
}

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 md:flex">
      <aside className="w-full shrink-0 bg-slate-950 p-5 text-white md:sticky md:top-0 md:h-screen md:w-64">
        <div className="mb-8 flex items-center gap-3">
          <div className="rounded-xl bg-blue-600 p-2">
            <Store size={25} />
          </div>
          <div>
            <h1 className="text-xl font-bold">SRMS</h1>
            <p className="text-xs text-slate-400">
              Sales Record Management
            </p>
          </div>
        </div>

        <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-slate-500">
          Workspace
        </p>

        <nav className="grid grid-cols-2 gap-2 md:block md:space-y-1">
          {navigation.map(({ name, path, icon: Icon }) => (
            <NavLink
              key={path}
              to={path}
              end={path === '/'}
              className={({ isActive }) =>
                `flex items-center gap-3 rounded-lg px-3 py-3 text-sm transition ${
                  isActive
                    ? 'bg-blue-600 text-white'
                    : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                }`
              }
            >
              <Icon size={18} />
              {name}
            </NavLink>
          ))}
        </nav>
        
        <button
          type="button"
          onClick={handleLogout}
          className="mt-6 flex w-full items-center gap-3 rounded-lg px-3 py-3 text-sm text-slate-300 transition hover:bg-red-500/10 hover:text-red-400"
        >
          <LogOut size={18} />
          Logout
        </button>

        <div className="mt-8 rounded-xl border border-slate-800 p-4">
          <p className="text-sm font-semibold">SRMS Business</p>
          <p className="mt-1 text-xs text-slate-400">
            Manage your store efficiently.
          </p>
        </div>


      </aside>

      <div className="min-w-0 flex-1">
        <header className="sticky top-0 z-10 flex h-16 items-center justify-between border-b border-slate-200 bg-white px-4 md:px-8">
          <div className="flex items-center gap-2 text-slate-500">
            <Search size={18} />
            <span className="text-sm">Business workspace</span>
          </div>

          <button
            type="button"
            aria-label="Notifications"
            className="rounded-lg border border-slate-200 p-2 hover:bg-slate-50"
          >
            <Bell size={19} />
          </button>
        </header>

        <main className="p-4 md:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
