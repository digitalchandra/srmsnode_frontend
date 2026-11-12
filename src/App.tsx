
import { BrowserRouter, Routes, Route } from 'react-router-dom'

import MainLayout from './layouts/MainLayout'
import ProtectedRoute from './components/ProtectedRoute'
import Dashboard from './pages/Dashboard'
import Products from './pages/Products'
import Login from './pages/auth/Login'
import Categories from './pages/Categories'
import Brands from './pages/Brands'
import Inventory from './pages/Inventory'
import ExpiryTracking from './pages/ExpiryTracking'
import StockAdjustment from './pages/StockAdjustment'
import StockMovements from './pages/StockMovements'
import POS from './pages/POS'
import Sales from './pages/Sales'
import Payments from './pages/Payments'
import SalesReturns from "./pages/SalesReturns"
import Refunds from './pages/Refunds'
import Reports from './pages/Reports'
import Customers from './pages/Customers'
import SettingsPage from './pages/Settings'
import ForgotPassword from './pages/auth/ForgotPassword'
import Register from './pages/auth/Register'
import SuperAdminLogin from './pages/super-admin/SuperAdminLogin'
import SuperAdminProtectedRoute from './components/SuperAdminProtectedRoute'
import SuperAdminDashboard from './pages/super-admin/SuperAdminDashboard'
import VendorManagement from './pages/super-admin/VendorManagement'
import VendorDetails from './pages/super-admin/VendorDetails'
import AccountPage from './pages/Account'



function NotFound() {
  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="text-center">
        <h1 className="text-3xl font-bold">404 - Page Not Found</h1>
        <a href="/" className="mt-4 inline-block text-blue-600">
          Return to Dashboard
        </a>
      </div>
    </div>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />

        <Route path="/forgot-password" element={<ForgotPassword />} />

        <Route path="/register" element={<Register />} />

        <Route path="/super-admin/login" element={<SuperAdminLogin />}/>

        <Route element={<SuperAdminProtectedRoute />}>
          <Route
            path="/super-admin/dashboard"
            element={<SuperAdminDashboard />}
          />
          <Route
              path="/super-admin/vendors"
              element={<VendorManagement />}
          />
          <Route
            path="/super-admin/vendors/:id"
            element={<VendorDetails />}
          />
        </Route>

        <Route element={<ProtectedRoute />}>

          <Route element={<MainLayout />}>

            <Route path="/" element={<Dashboard />} />

            <Route path="/products" element={<Products />} />

            <Route path="/categories" element={<Categories />} />

            <Route path="/brands" element={<Brands />} />

            <Route path="/inventory" element={<Inventory />} />

            <Route path="/expiry-tracking" element={<ExpiryTracking />} />

            <Route path="/stock-adjustment" element={<StockAdjustment />} />

            <Route path="/stock-movements" element={<StockMovements />} />

            <Route path="/pos" element={<POS />} />

            <Route path="/sales" element={<Sales />} />

            <Route path="/payments" element={<Payments />} />
       
            <Route path="/sales-returns" element={<SalesReturns />} />

            <Route path="/refunds" element={<Refunds />} />

            <Route path="/reports" element={<Reports />} />

            <Route path="/customers" element={<Customers />} />

            <Route path="/settings" element={<SettingsPage />} />

            <Route path="/account" element={<AccountPage />} />
            
          </Route>

        </Route>

        <Route path="*" element={<NotFound />} />

        

      </Routes>
    </BrowserRouter>
  )
}
