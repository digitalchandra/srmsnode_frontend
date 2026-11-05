import { useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  ArrowLeft,
  CheckCircle2,
  KeyRound,
  LockKeyhole,
  Mail,
  ShieldCheck,
  Store,
} from 'lucide-react'
import api from '../../services/api'

type Step = 1 | 2 | 3

export default function ForgotPassword() {
  const navigate = useNavigate()

  const [step, setStep] = useState<Step>(1)
  const [email, setEmail] = useState('')
  const [otp, setOtp] = useState('')
  const [resetToken, setResetToken] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  function getErrorMessage(err: unknown) {
    if (
      typeof err === 'object' &&
      err !== null &&
      'response' in err
    ) {
      const response = (
        err as { response?: { data?: { message?: string } } }
      ).response

      return (
        response?.data?.message ||
        'Something went wrong. Please try again.'
      )
    }

    return 'Unable to connect. Please check your internet and try again.'
  }

  async function handleRequestOtp(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError('')
    setSuccess('')
    setLoading(true)

    try {
      const response = await api.post('/auth/forgot-password', {
        email: email.trim(),
      })

      if (!response.data.success) {
        setError(response.data.message || 'Unable to send OTP.')
        return
      }

      setStep(2)
      setSuccess('If your account is registered, an OTP has been sent to your email.')
    } catch (err: unknown) {
      setError(getErrorMessage(err))
    } finally {
      setLoading(false)
    }
  }

  async function handleVerifyOtp(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError('')
    setSuccess('')
    setLoading(true)

    try {
      const response = await api.post('/auth/verify-reset-otp', {
        email: email.trim(),
        otp: otp.trim(),
      })

      const token = response.data.data?.resetToken

      if (!response.data.success || !token) {
        setError(response.data.message || 'OTP verification failed.')
        return
      }

      setResetToken(token)
      setStep(3)
      setSuccess('OTP verified successfully. You can now create a new password.')
    } catch (err: unknown) {
      setError(getErrorMessage(err))
    } finally {
      setLoading(false)
    }
  }

  async function handleResetPassword(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError('')
    setSuccess('')

    if (password.length < 8) {
      setError('Password must be at least 8 characters long.')
      return
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match.')
      return
    }

    setLoading(true)

    try {
      const response = await api.post('/auth/reset-password', {
        resetToken,
        newPassword: password,
      })

      if (!response.data.success) {
        setError(response.data.message || 'Password reset failed.')
        return
      }

      setSuccess('Your password has been reset successfully.')

      setTimeout(() => {
        navigate('/login', { replace: true })
      }, 1500)
    } catch (err: unknown) {
      setError(getErrorMessage(err))
    } finally {
      setLoading(false)
    }
  }

  const steps = [
    { number: 1, label: 'Email' },
    { number: 2, label: 'Verify OTP' },
    { number: 3, label: 'New Password' },
  ]

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-50 px-4 py-10">
      <section className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
        <div className="mb-7 text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-600 text-white">
            <Store size={28} />
          </div>

          <h1 className="text-2xl font-bold text-slate-900">
            Reset Your Password
          </h1>

          <p className="mt-2 text-sm text-slate-500">
            Recover access to your SRMS business account.
          </p>
        </div>

        <div className="mb-8 flex items-center justify-between">
          {steps.map((item, index) => (
            <div key={item.number} className="flex flex-1 items-center">
              <div className="flex flex-col items-center">
                <div
                  className={`flex h-9 w-9 items-center justify-center rounded-full text-sm font-semibold ${
                    step >= item.number
                      ? 'bg-blue-600 text-white'
                      : 'bg-slate-100 text-slate-500'
                  }`}
                >
                  {step > item.number ? (
                    <CheckCircle2 size={19} />
                  ) : (
                    item.number
                  )}
                </div>

                <span className="mt-2 whitespace-nowrap text-xs text-slate-500">
                  {item.label}
                </span>
              </div>

              {index < steps.length - 1 && (
                <div
                  className={`mx-2 mb-5 h-0.5 flex-1 ${
                    step > item.number ? 'bg-blue-600' : 'bg-slate-200'
                  }`}
                />
              )}
            </div>
          ))}
        </div>

        {step === 1 && (
          <form onSubmit={handleRequestOtp} className="space-y-5">
            <div className="text-center">
              <Mail className="mx-auto mb-3 text-blue-600" size={30} />
              <h2 className="text-lg font-semibold">Forgot your password?</h2>
              <p className="mt-1 text-sm text-slate-500">
                Enter your registered email address. We'll send you a
                verification code.
              </p>
            </div>

            <div>
              <label htmlFor="email" className="mb-2 block text-sm font-medium">
                Email address
              </label>

              <input
                id="email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="you@example.com"
                className="w-full rounded-lg border border-slate-300 px-4 py-3 outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-lg bg-blue-600 px-4 py-3 font-semibold text-white hover:bg-blue-700 disabled:opacity-60"
            >
              {loading ? 'Sending OTP...' : 'Send Verification Code'}
            </button>
          </form>
        )}

        {step === 2 && (
          <form onSubmit={handleVerifyOtp} className="space-y-5">
            <div className="text-center">
              <ShieldCheck className="mx-auto mb-3 text-blue-600" size={32} />
              <h2 className="text-lg font-semibold">Verify Your Email</h2>
              <p className="mt-1 text-sm text-slate-500">
                Enter the 6-digit OTP sent to:
              </p>
              <p className="mt-1 break-all text-sm font-semibold text-slate-700">
                {email}
              </p>
            </div>

            <div>
              <label htmlFor="otp" className="mb-2 block text-sm font-medium">
                Verification code
              </label>

              <input
                id="otp"
                type="text"
                inputMode="numeric"
                autoComplete="one-time-code"
                maxLength={6}
                pattern="[0-9]{6}"
                required
                value={otp}
                onChange={(event) =>
                  setOtp(event.target.value.replace(/\D/g, '').slice(0, 6))
                }
                placeholder="Enter 6-digit OTP"
                className="w-full rounded-lg border border-slate-300 px-4 py-3 text-center text-xl tracking-[0.5em] outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
              />
            </div>

            <button
              type="submit"
              disabled={loading || otp.length !== 6}
              className="w-full rounded-lg bg-blue-600 px-4 py-3 font-semibold text-white hover:bg-blue-700 disabled:opacity-60"
            >
              {loading ? 'Verifying...' : 'Verify OTP'}
            </button>

            <button
              type="button"
              onClick={() => {
                setStep(1)
                setOtp('')
                setError('')
                setSuccess('')
              }}
              className="w-full text-sm font-medium text-blue-600 hover:underline"
            >
              Change email address
            </button>
          </form>
        )}

        {step === 3 && (
          <form onSubmit={handleResetPassword} className="space-y-5">
            <div className="text-center">
              <KeyRound className="mx-auto mb-3 text-blue-600" size={32} />
              <h2 className="text-lg font-semibold">Create New Password</h2>
              <p className="mt-1 text-sm text-slate-500">
                Choose a strong password for your account.
              </p>
            </div>

            <div>
              <label htmlFor="new-password" className="mb-2 block text-sm font-medium">
                New password
              </label>

              <input
                id="new-password"
                type="password"
                autoComplete="new-password"
                required
                minLength={8}
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                placeholder="Enter new password"
                className="w-full rounded-lg border border-slate-300 px-4 py-3 outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
              />
            </div>

            <div>
              <label htmlFor="confirm-password" className="mb-2 block text-sm font-medium">
                Confirm new password
              </label>

              <div className="relative">
                <LockKeyhole
                  className="absolute left-3 top-3.5 text-slate-400"
                  size={18}
                />

                <input
                  id="confirm-password"
                  type="password"
                  autoComplete="new-password"
                  required
                  minLength={8}
                  value={confirmPassword}
                  onChange={(event) => setConfirmPassword(event.target.value)}
                  placeholder="Confirm new password"
                  className="w-full rounded-lg border border-slate-300 py-3 pl-10 pr-4 outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
                />
              </div>
            </div>

            <p className="text-xs text-slate-500">
              Use at least 8 characters. Your new password must match the
              confirmation.
            </p>

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-lg bg-blue-600 px-4 py-3 font-semibold text-white hover:bg-blue-700 disabled:opacity-60"
            >
              {loading ? 'Resetting Password...' : 'Reset Password'}
            </button>
          </form>
        )}

        {error && (
          <div
            role="alert"
            className="mt-5 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700"
          >
            {error}
          </div>
        )}

        {success && (
          <div
            role="status"
            className="mt-5 rounded-lg border border-green-200 bg-green-50 p-3 text-sm text-green-700"
          >
            {success}
          </div>
        )}

        <div className="mt-7 border-t border-slate-100 pt-5 text-center">
          <Link
            to="/login"
            className="inline-flex items-center gap-2 text-sm font-medium text-slate-600 hover:text-blue-600"
          >
            <ArrowLeft size={16} />
            Back to Login
          </Link>
        </div>
      </section>
    </main>
  )
}