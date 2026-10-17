
import { useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  Store,
  Eye,
  EyeOff,
  LockKeyhole,
} from 'lucide-react'
import api from '../../services/api'

export default function Login() {
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
      const response = await api.post('/auth/login', {
        email: email.trim(),
        password,
      })

      const result = response.data

      if (!result.success || !result.data?.accessToken) {
        setError(result.message || 'Login failed. Please try again.')
        return
      }

      sessionStorage.setItem(
        'accessToken',
        result.data.accessToken,
      )

      if (result.data.refreshToken) {
        sessionStorage.setItem(
          'refreshToken',
          result.data.refreshToken,
        )
      }

      sessionStorage.setItem(
        'user',
        JSON.stringify(result.data.user),
      )

      navigate('/', { replace: true })
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
          setError('Invalid email or password.')
        } else if (response?.status === 403) {
          setError('Your account is not active or access is denied.')
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
    <main className="flex min-h-screen w-full items-center justify-center bg-slate-50 px-4 py-10">
      <section className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-600 text-white">
            <Store size={28} />
          </div>

          <h1 className="text-2xl font-bold">Welcome to SRMS</h1>
          <p className="mt-2 text-sm text-slate-500">
            Sign in to manage your business.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label htmlFor="email" className="mb-2 block text-sm font-medium">
              Email address
            </label>
            <input
              id="email"
              type="email"
              autoComplete="username"
              required
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="you@example.com"
              className="w-full rounded-lg border border-slate-300 px-4 py-3 outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
            />
          </div>

          <div>
            <label htmlFor="password" className="mb-2 block text-sm font-medium">
              Password
            </label>

            <div className="relative">
              <LockKeyhole
                className="absolute left-3 top-3.5 text-slate-400"
                size={18}
              />

              <input
                id="password"
                type={showPassword ? 'text' : 'password'}
                autoComplete="current-password"
                required
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                placeholder="Enter your password"
                className="w-full rounded-lg border border-slate-300 py-3 pl-10 pr-12 outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
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
            className="w-full rounded-lg bg-blue-600 px-4 py-3 font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>

        <p className="mt-6 text-center text-xs text-slate-500">
          Secure access to your business workspace.
        </p>

        <p className="mt-4 text-center text-sm">
          <Link to="/" className="font-medium text-blue-600 hover:underline">
            Back to dashboard
          </Link>
        </p>
      </section>
    </main>
  )
}
