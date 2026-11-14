
import { useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import {
  Store,
  Mail,
  LockKeyhole,
  FileText,
  ArrowLeft,
  CheckCircle,
  Eye,
  EyeOff,
} from 'lucide-react'
import api from '../../services/api'

export default function ReactivationRequest() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [reason, setReason] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [showPassword, setShowPassword] = useState(false)

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError('')

    if (reason.trim().length < 10) {
      setError('Please provide a reason with at least 10 characters.')
      return
    }

    setLoading(true)

    try {
      const response = await api.post('/auth/reactivation-request', {
        email: email.trim(),
        password,
        reason: reason.trim(),
      })

      if (!response.data?.success) {
        setError(response.data?.message || 'Unable to submit your request.')
        return
      }

      setSuccess(true)
      setPassword('')
    } catch (err: unknown) {
      if (typeof err === 'object' && err !== null && 'response' in err) {
        const response = (
          err as {
            response?: {
              status?: number
              data?: { message?: string; code?: string }
            }
          }
        ).response

        if (response?.status === 401) {
          setError('Invalid email or password. Please check your registered account details.')
        } else if (response?.status === 409) {
          setError(
            response.data?.message ||
              'Your account is not eligible for a new reactivation request.',
          )
        } else if (response?.status === 429) {
          setError('Too many attempts. Please try again later.')
        } else {
          setError(
            response?.data?.message ||
              'Unable to submit your request. Please try again.',
          )
        }
      } else {
        setError('Network error. Please check your internet connection.')
      }
    } finally {
      setLoading(false)
    }
  }

  if (success) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-50 px-4 py-10">
        <section className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-sm">
          <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-green-100 text-green-600">
            <CheckCircle size={34} />
          </div>

          <h1 className="text-2xl font-bold text-slate-900">
            Request Submitted
          </h1>

          <p className="mt-3 text-sm leading-6 text-slate-600">
            Your account reactivation request has been submitted successfully.
            It is now pending administrator review.
          </p>

          <p className="mt-3 text-sm text-slate-500">
            You will be able to sign in again only after the Super Admin approves your request.
          </p>

          <Link
            to="/login"
            className="mt-7 inline-flex w-full items-center justify-center rounded-lg bg-blue-600 px-4 py-3 font-semibold text-white hover:bg-blue-700"
          >
            Back to Login
          </Link>
        </section>
      </main>
    )
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-50 px-4 py-10">
      <section className="w-full max-w-lg rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
        <div className="mb-7 text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-600 text-white">
            <Store size={28} />
          </div>

          <h1 className="text-2xl font-bold text-slate-900">
            Reactivate Your Account
          </h1>

          <p className="mt-2 text-sm text-slate-500">
            Submit a request to restore access to your SRMS business account.
          </p>
        </div>

        <div className="mb-6 rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
          Enter your registered account details and explain why you want to reactivate your business account.
          Your request will be reviewed by the Administrator.
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label htmlFor="reactivation-email" className="mb-2 block text-sm font-medium text-slate-700">
              Registered Email Address
            </label>

            <div className="relative">
              <Mail className="absolute left-3 top-3.5 text-slate-400" size={18} />
              <input
                id="reactivation-email"
                type="email"
                autoComplete="username"
                required
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="you@example.com"
                className="w-full rounded-lg border border-slate-300 py-3 pl-10 pr-4 outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
              />
            </div>
          </div>

          <div>
            <label htmlFor="reactivation-password" className="mb-2 block text-sm font-medium text-slate-700">
              Account Password
            </label>

            <div>
                <label
                    htmlFor="reactivation-password"
                    className="mb-2 block text-sm font-medium text-slate-700"
                >
                    Account Password
                </label>

                <div className="relative">
                    <LockKeyhole
                    className="absolute left-3 top-3.5 text-slate-400"
                    size={18}
                    />

                    <input
                    id="reactivation-password"
                    type={showPassword ? 'text' : 'password'}
                    autoComplete="current-password"
                    required
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    placeholder="Enter your account password"
                    className="w-full rounded-lg border border-slate-300 py-3 pl-10 pr-12 outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
                    />

                    <button
                    type="button"
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-3.5 text-slate-500 hover:text-blue-600"
                    >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                </div>
                </div>

          </div>

          <div>
            <label htmlFor="reactivation-reason" className="mb-2 block text-sm font-medium text-slate-700">
              Reason for Reactivation
            </label>

            <div className="relative">
              <FileText className="absolute left-3 top-3.5 text-slate-400" size={18} />
              <textarea
                id="reactivation-reason"
                required
                minLength={10}
                maxLength={1000}
                rows={5}
                value={reason}
                onChange={(event) => setReason(event.target.value)}
                placeholder="Please explain why you want to reactivate your business account..."
                className="w-full resize-y rounded-lg border border-slate-300 py-3 pl-10 pr-4 outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
              />
            </div>

            <p className="mt-1 text-right text-xs text-slate-500">
              {reason.length}/1000 characters
            </p>
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
            {loading ? 'Submitting Request...' : 'Submit Reactivation Request'}
          </button>
        </form>

        <div className="mt-6 text-center">
          <Link
            to="/login"
            className="inline-flex items-center gap-2 text-sm font-medium text-blue-600 hover:text-blue-700 hover:underline"
          >
            <ArrowLeft size={16} />
            Back to Login
          </Link>
        </div>
      </section>
    </main>
  )
}
