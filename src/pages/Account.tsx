
import { useEffect, useState } from 'react'
import {
  UserRound,
  Store,
  ShieldCheck,
  Loader2,
  Save,
  AlertTriangle,
  LockKeyhole,
  CalendarDays,
} from 'lucide-react'

import type {
  VendorAccount,
  UpdateAccountData,
} from '../services/accountService'

import accountService from '../services/accountService'

export default function AccountPage() {
  const [account, setAccount] = useState<VendorAccount | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [deactivating, setDeactivating] = useState(false)
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')

  const [form, setForm] = useState<UpdateAccountData>({})
  const [showDeactivate, setShowDeactivate] = useState(false)
  const [password, setPassword] = useState('')
  const [reason, setReason] = useState('')

  useEffect(() => {
    const loadAccount = async () => {
      try {
        const data = await accountService.getAccount()
        
        setAccount(data)

        setForm({
          name: data.owner.name,
          businessName: data.tenant.businessName,
          phone: data.settings?.business?.phone || '',
          email: data.settings?.business?.email || '',
          address: data.settings?.business?.address || '',
          taxNumber: data.settings?.business?.taxNumber || '',
          logo: data.settings?.business?.logo || '',
        })
      } catch (err: any) {
        setError(
          err.response?.data?.message || 'Unable to load account details.'
        )
      } finally {
        setLoading(false)
      }
    }

    loadAccount()
  }, [])

  const updateField = (field: keyof UpdateAccountData, value: string) => {
    setForm((previous) => ({ ...previous, [field]: value }))
  }

  const handleSave = async () => {
    try {
      setSaving(true)
      setError('')
      setMessage('')

      const response = await accountService.updateAccount(form)

      setAccount(response.data)
      setForm((previous) => ({
        ...previous,
        name: response.data.owner.name,
        businessName: response.data.tenant.businessName,
      }))

      setMessage('Account information updated successfully.')
    } catch (err: any) {
      setError(
        err.response?.data?.message || 'Failed to update account information.'
      )
    } finally {
      setSaving(false)
    }
  }

  const handleDeactivate = async () => {
    if (!password.trim()) {
      setError('Please enter your password to confirm deactivation.')
      return
    }

    const confirmed = window.confirm(
      'Are you sure you want to temporarily deactivate your shop account? Your business data will be preserved, but all vendor access will be blocked.'
    )

    if (!confirmed) return

    try {
      setDeactivating(true)
      setError('')

      await accountService.deactivateAccount({
        password,
        reason,
      })

      sessionStorage.removeItem('accessToken')
      sessionStorage.removeItem('refreshToken')
      sessionStorage.removeItem('user')

      window.location.href = '/login'
    } catch (err: any) {
      setError(
        err.response?.data?.message || 'Unable to deactivate your account.'
      )
    } finally {
      setDeactivating(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="animate-spin text-blue-600" size={30} />
        <span className="ml-3 text-slate-500">Loading account...</span>
      </div>
    )
  }

  if (error && !account) {
    return (
      <div className="rounded-xl border border-red-200 bg-red-50 p-5 text-red-700">
        {error}
      </div>
    )
  }

  if (!account) return null

  const isOwner = account.owner.role === 'OWNER'

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">
          Vendor Account
        </h1>
        <p className="mt-1 text-sm text-slate-500">
          Manage your owner profile, business information and account status.
        </p>
      </div>

      {message && (
        <div className="rounded-lg border border-green-200 bg-green-50 p-3 text-sm text-green-700">
          {message}
        </div>
      )}

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          {error}
        </div>
      )}

      <div className="grid gap-5 lg:grid-cols-2">
        <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="mb-5 flex items-center gap-3">
            <div className="rounded-lg bg-blue-50 p-3 text-blue-600">
              <UserRound size={22} />
            </div>
            <div>
              <h2 className="font-semibold text-slate-800">Owner Profile</h2>
              <p className="text-xs text-slate-500">
                Your account information
              </p>
            </div>
          </div>

          <div className="space-y-4">
            <Field
              label="Owner Name"
              value={form.name || ''}
              onChange={(value) => updateField('name', value)}
            />

            <Field
              label="Login Email"
              value={account.owner.email}
              disabled
            />

            <Field
              label="Account Role"
              value={account.owner.role}
              disabled
            />
          </div>
        </section>

        <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="mb-5 flex items-center gap-3">
            <div className="rounded-lg bg-indigo-50 p-3 text-indigo-600">
              <Store size={22} />
            </div>
            <div>
              <h2 className="font-semibold text-slate-800">
                Business Information
              </h2>
              <p className="text-xs text-slate-500">
                Your registered business details
              </p>
            </div>
          </div>

          <div className="space-y-4">
            <Field
              label="Business Name"
              value={form.businessName || ''}
              onChange={(value) => updateField('businessName', value)}
            />

            <Field
              label="Phone Number"
              value={form.phone || ''}
              onChange={(value) => updateField('phone', value)}
            />

            <Field
              label="Business Email"
              value={form.email || ''}
              onChange={(value) => updateField('email', value)}
            />

            <Field
              label="Business Address"
              value={form.address || ''}
              onChange={(value) => updateField('address', value)}
            />

            <Field
              label="Tax Number"
              value={form.taxNumber || ''}
              onChange={(value) => updateField('taxNumber', value)}
            />
          </div>
        </section>
      </div>

      <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="mb-5 flex items-center gap-3">
          <div className="rounded-lg bg-green-50 p-3 text-green-600">
            <ShieldCheck size={22} />
          </div>
          <div>
            <h2 className="font-semibold text-slate-800">Account Status</h2>
            <p className="text-xs text-slate-500">
              Your shop registration information
            </p>
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Info label="Business" value={account.tenant.businessName} />
          <Info label="Subdomain" value={account.tenant.subdomain} />
          <Info label="Country" value={account.tenant.country} />
          <Info label="Currency" value={account.tenant.currency} />
          <Info label="Timezone" value={account.tenant.timezone} />
          <Info label="Role" value={account.owner.role} />
          <Info
            label="Registration Date"
            value={new Date(account.tenant.createdAt).toLocaleDateString()}
          />
          <div>
            <p className="mb-1 text-xs text-slate-500">Account Status</p>
            <span className="inline-flex rounded-full bg-green-100 px-3 py-1 text-sm font-medium text-green-700">
              {account.tenant.status}
            </span>
          </div>
        </div>
      </section>

      {isOwner && (
        <>
          <div className="flex justify-end">
            <button
              type="button"
              onClick={handleSave}
              disabled={saving}
              className="flex items-center gap-2 rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
            >
              {saving ? (
                <Loader2 size={17} className="animate-spin" />
              ) : (
                <Save size={17} />
              )}
              {saving ? 'Saving...' : 'Save Account Information'}
            </button>
          </div>

          <section className="rounded-xl border border-red-200 bg-white p-5 shadow-sm">
            <div className="flex items-start gap-3">
              <div className="rounded-lg bg-red-50 p-3 text-red-600">
                <AlertTriangle size={22} />
              </div>
              <div>
                <h2 className="font-semibold text-red-700">
                  Temporarily Deactivate Account
                </h2>
                <p className="mt-1 text-sm text-slate-600">
                  Deactivating your account blocks vendor access. Your products,
                  sales, customers and inventory data will be preserved.
                  Contact the Super Admin if you want to reactivate your shop.
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setShowDeactivate(!showDeactivate)}
              className="mt-5 rounded-lg border border-red-300 px-4 py-2 text-sm font-medium text-red-700 hover:bg-red-50"
            >
              {showDeactivate ? 'Cancel' : 'Deactivate My Account'}
            </button>

            {showDeactivate && (
              <div className="mt-5 max-w-lg space-y-4 border-t border-red-100 pt-5">
                <div>
                  <label className="mb-1 block text-sm font-medium text-slate-700">
                    Reason (optional)
                  </label>
                  <textarea
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    maxLength={500}
                    rows={3}
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                    placeholder="Why are you deactivating your account?"
                  />
                </div>

                <div>
                  <label className="mb-1 block text-sm font-medium text-slate-700">
                    Confirm your password
                  </label>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    autoComplete="current-password"
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                    placeholder="Enter your current password"
                  />
                </div>

                <button
                  type="button"
                  onClick={handleDeactivate}
                  disabled={deactivating || !password}
                  className="flex items-center gap-2 rounded-lg bg-red-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-50"
                >
                  {deactivating ? (
                    <Loader2 size={17} className="animate-spin" />
                  ) : (
                    <LockKeyhole size={17} />
                  )}
                  {deactivating ? 'Deactivating...' : 'Confirm Deactivation'}
                </button>
              </div>
            )}
          </section>
        </>
      )}

      <div className="flex items-center gap-2 text-xs text-slate-400">
        <CalendarDays size={14} />
        Account information is managed by your shop owner and Super Admin.
      </div>
    </div>
  )
}

function Field({
  label,
  value,
  onChange,
  disabled = false,
}: {
  label: string
  value: string
  onChange?: (value: string) => void
  disabled?: boolean
}) {
  return (
    <div>
      <label className="mb-1 block text-sm font-medium text-slate-600">
        {label}
      </label>
      <input
        type="text"
        value={value}
        disabled={disabled}
        onChange={(e) => onChange?.(e.target.value)}
        className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 disabled:bg-slate-50 disabled:text-slate-500"
      />
    </div>
  )
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg bg-slate-50 p-3">
      <p className="text-xs text-slate-500">{label}</p>
      <p className="mt-1 break-words text-sm font-medium text-slate-800">
        {value || '-'}
      </p>
    </div>
  )
}
