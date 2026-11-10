
import { useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { ShieldCheck, Eye, EyeOff, LockKeyhole } from 'lucide-react'
import superAdminApi from '../../services/superAdminApi'

export default function SuperAdminLogin() {
  const navigate = useNavigate()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError('')
    setLoading(true)

    try {
      const response = await superAdminApi.post('/super-admin/login', {
        email: email.trim().toLowerCase(),
        password,
      })

      const result = response.data

      if (!result.success || !result.data?.accessToken) {
        setError(result.message || 'Login failed. Please try again.')
        return
      }

      // Keep Super Admin authentication separate from vendor authentication.
      sessionStorage.setItem(
        'superAdminAccessToken',
        result.data.accessToken,
      )

      sessionStorage.setItem(
        'superAdmin',
        JSON.stringify(result.data.admin),
      )

      navigate('/super-admin/dashboard', { replace: true })
    } catch (err: unknown) {
      if (typeof err === 'object' && err !== null && 'response' in err) {
        const response = (
          err as {
            response?: {
              data?: { message?: string }
              status?: number
            }
          }
        ).response

        if (response?.status === 401) {
          setError('Invalid Super Admin email or password.')
        } else {
          setError(
            response?.data?.message ||
            'Unable to connect. Please try again.',
          )
        }
      } else {
        setError('Network error. Check your backend connection.')
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-950 px-4 py-10">
      <section className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-8 shadow-xl">

        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-900 text-white">
            <ShieldCheck size={32} />
          </div>

          <h1 className="text-2xl font-bold text-slate-900">
            SRMS Super Admin
          </h1>

          <p className="mt-2 text-sm text-slate-500">
            Sign in to manage all registered businesses.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label htmlFor="admin-email" className="mb-2 block text-sm font-medium">
              Super Admin Email
            </label>

            <input
              id="admin-email"
              type="email"
              autoComplete="username"
              required
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="admin@example.com"
              className="w-full rounded-lg border border-slate-300 px-4 py-3 outline-none focus:border-slate-700 focus:ring-2 focus:ring-slate-200"
            />
          </div>

          <div>
            <label htmlFor="admin-password" className="mb-2 block text-sm font-medium">
              Password
            </label>

            <div className="relative">
              <LockKeyhole
                className="absolute left-3 top-3.5 text-slate-400"
                size={18}
              />

              <input
                id="admin-password"
                type={showPassword ? 'text' : 'password'}
                autoComplete="current-password"
                required
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                placeholder="Enter your password"
                className="w-full rounded-lg border border-slate-300 py-3 pl-10 pr-12 outline-none focus:border-slate-700 focus:ring-2 focus:ring-slate-200"
              />

              <button
                type="button"
                aria-label={showPassword ? 'Hide password' : 'Show password'}
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-3.5 text-slate-500"
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          {error && (
            <div
              role="alert"
              className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700"
            >
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-lg bg-slate-900 px-4 py-3 font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading ? 'Signing in...' : 'Sign In as Super Admin'}
          </button>
        </form>

        <p className="mt-6 text-center text-xs text-slate-500">
          Restricted access. Authorized administrators only.
        </p>
      </section>
    </main>
  )
}
