
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
          </Route>

        </Route>

        <Route path="*" element={<NotFound />} />

        

      </Routes>
    </BrowserRouter>
  )
}
