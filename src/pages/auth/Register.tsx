
import { useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { Store, Eye, EyeOff, LockKeyhole, Mail, Building2 } from 'lucide-react'
import api from '../../services/api'

export default function Register() {
  const [businessName, setBusinessName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError('')
    setSuccess('')

    if (password.length < 8) {
      setError('Password must be at least 8 characters.')
      return
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match.')
      return
    }

    setLoading(true)

    try {
      const response = await api.post('/auth/register', {
        email: email.trim().toLowerCase(),
        password,
        businessName: businessName.trim(),
      })

      if (response.data.success) {
        setSuccess(
          response.data.message ||
          'Registration successful! Your account is waiting for Super Admin approval.'
        )
        setBusinessName('')
        setEmail('')
        setPassword('')
        setConfirmPassword('')
      } else {
        setError(response.data.message || 'Registration failed.')
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
              data?: { message?: string }
            }
          }
        ).response

        setError(
          response?.data?.message ||
          'Unable to complete registration. Please try again.'
        )
      } else {
        setError('Network error. Check your backend connection.')
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-50 px-4 py-10">
      <section className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">

        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-600 text-white">
            <Store size={28} />
          </div>

          <h1 className="text-2xl font-bold text-slate-900">
            Create Your SRMS Account
          </h1>

          <p className="mt-2 text-sm text-slate-500">
            Register your business and start managing your sales.
          </p>
        </div>

        {success ? (
          <div className="space-y-5">
            <div className="rounded-lg border border-green-200 bg-green-50 p-4 text-sm text-green-800">
              <h2 className="mb-2 font-semibold">
                Registration submitted successfully!
              </h2>
              {success}
              <p className="mt-3">
                You can sign in after the Super Admin approves your business.
              </p>
            </div>

            <Link
              to="/login"
              className="block w-full rounded-lg bg-blue-600 px-4 py-3 text-center font-semibold text-white hover:bg-blue-700"
            >
              Go to Login
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-5">

            <div>
              <label htmlFor="businessName" className="mb-2 block text-sm font-medium">
                Business / Shop Name
              </label>

              <div className="relative">
                <Building2 className="absolute left-3 top-3.5 text-slate-400" size={18} />

                <input
                  id="businessName"
                  type="text"
                  required
                  minLength={2}
                  maxLength={100}
                  value={businessName}
                  onChange={(event) => setBusinessName(event.target.value)}
                  placeholder="Enter your business name"
                  className="w-full rounded-lg border border-slate-300 py-3 pl-10 pr-4 outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
                />
              </div>
            </div>

            <div>
              <label htmlFor="email" className="mb-2 block text-sm font-medium">
                Email Address
              </label>

              <div className="relative">
                <Mail className="absolute left-3 top-3.5 text-slate-400" size={18} />

                <input
                  id="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  placeholder="you@example.com"
                  className="w-full rounded-lg border border-slate-300 py-3 pl-10 pr-4 outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
                />
              </div>
            </div>

            <div>
              <label htmlFor="password" className="mb-2 block text-sm font-medium">
                Password
              </label>

              <div className="relative">
                <LockKeyhole className="absolute left-3 top-3.5 text-slate-400" size={18} />

                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="new-password"
                  required
                  minLength={8}
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  placeholder="Minimum 8 characters"
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

            <div>
              <label htmlFor="confirmPassword" className="mb-2 block text-sm font-medium">
                Confirm Password
              </label>

              <input
                id="confirmPassword"
                type="password"
                autoComplete="new-password"
                required
                minLength={8}
                value={confirmPassword}
                onChange={(event) => setConfirmPassword(event.target.value)}
                placeholder="Re-enter your password"
                className="w-full rounded-lg border border-slate-300 px-4 py-3 outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
              />
            </div>

            {error && (
              <div role="alert" className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-lg bg-blue-600 px-4 py-3 font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading ? 'Creating Account...' : 'Register Business'}
            </button>
          </form>
        )}

        {!success && (
          <p className="mt-6 text-center text-sm text-slate-600">
            Already have an account?{' '}
            <Link to="/login" className="font-semibold text-blue-600 hover:underline">
              Sign In
            </Link>
          </p>
        )}

        <p className="mt-5 text-center text-xs text-slate-500">
          Secure multi-business management with SRMS.
        </p>
      </section>
    </main>
  )
}
