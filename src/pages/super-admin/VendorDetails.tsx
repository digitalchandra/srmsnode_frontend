
import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import superAdminApi from '../../services/superAdminApi'

type Vendor = {
  _id: string
  businessName?: string
  subdomain?: string
  country?: string
  currency?: string
  timezone?: string
  status?: string
  createdAt?: string
  approvedAt?: string
  suspendedAt?: string
  rejectedAt?: string
  rejectionReason?: string
  owner?: {
    name?: string
    email?: string
    status?: string
    createdAt?: string
  } | null
}

type Activity = {
  _id: string
  action: string
  reason?: string | null
  previousStatus?: string
  newStatus?: string
  createdAt: string
  adminId?: {
    name?: string
    email?: string
  } | null
}

type Subscription = {
      _id: string
      planType: string
      billingCycle: string
      subscriptionStatus: string
      amount: number
      currency: string
      startDate: string
      endDate: string
      isManuallyManaged: boolean
      notes?: string
      grantedBy?: {
        name?: string
        email?: string
      } | null
      createdAt?: string
    }



const formatDate = (date?: string) => {
  if (!date) return '—'

  const parsed = new Date(date)

  if (Number.isNaN(parsed.getTime())) return '—'

  return parsed.toLocaleString()
}

const statusStyle = (status?: string) => {
  switch (status) {
    case 'ACTIVE':
      return 'bg-green-100 text-green-700'
    case 'PENDING':
      return 'bg-yellow-100 text-yellow-700'
    case 'SUSPENDED':
      return 'bg-orange-100 text-orange-700'
    case 'REJECTED':
      return 'bg-red-100 text-red-700'
    default:
      return 'bg-gray-100 text-gray-700'
  }
}

export default function VendorDetails() {
  const { id } = useParams()

  const navigate = useNavigate()

  const [vendor, setVendor] = useState<Vendor | null>(null)

  const [activities, setActivities] = useState<Activity[]>([])

  const [loading, setLoading] = useState(true)

  const [error, setError] = useState('')

  const [subscription, setSubscription] = useState<Subscription | null>(null)

  const [subscriptionHistory, setSubscriptionHistory] = useState<Subscription[]>([])

  const [subscriptionLoading, setSubscriptionLoading] = useState(false)

  const [subscriptionError, setSubscriptionError] = useState('')

  const [subscriptionMessage, setSubscriptionMessage] = useState('')

  const [durationMonths, setDurationMonths] = useState('3')

  const [subscriptionNotes, setSubscriptionNotes] = useState('')

  const [subscriptionActionLoading, setSubscriptionActionLoading] = useState(false)


  useEffect(() => {
    const fetchDetails = async () => {
      if (!id) {
        setError('Vendor ID is missing.')
        setLoading(false)
        return
      }

      try {
        setLoading(true)
        setError('')

        const [vendorResponse, activityResponse] = await Promise.all([
          superAdminApi.get(`/super-admin/vendors/${id}`),
          superAdminApi.get(`/super-admin/vendors/${id}/activity`),
        ])

        setVendor(vendorResponse.data.data.vendor)
        setActivities(activityResponse.data.data.activities || [])
      } catch (err: any) {
        const status = err.response?.status

        if (status === 401 || status === 403) {
          sessionStorage.removeItem('superAdminAccessToken')
          sessionStorage.removeItem('superAdmin')
          navigate('/super-admin/login', { replace: true })
          return
        }

        setError(
          err.response?.data?.message || 'Unable to load vendor details.'
        )
      } finally {
        setLoading(false)
      }
    }

    fetchDetails()
  }, [id, navigate])


const fetchSubscriptionData = async () => {
  if (!id) return

  try {
    setSubscriptionLoading(true)
    setSubscriptionError('')

    const [currentResponse, historyResponse] = await Promise.all([
      superAdminApi.get(`/super-admin/vendors/${id}/subscriptions/current`),
      superAdminApi.get(`/super-admin/vendors/${id}/subscriptions/history`),
    ])

    setSubscription(currentResponse.data.data.subscription || null)

    setSubscriptionHistory(
      historyResponse.data.data.subscriptions || []
    )
  } catch (err: any) {
    setSubscriptionError(
      err.response?.data?.message || 'Unable to load subscription information.'
    )
  } finally {
    setSubscriptionLoading(false)
  }
}

const handleSubscriptionAction = async (action: 'grant' | 'extend') => {
  if (!id) return

  try {
    setSubscriptionActionLoading(true)
    setSubscriptionError('')
    setSubscriptionMessage('')

    const response = await superAdminApi.post(
      `/super-admin/vendors/${id}/subscriptions/${action}`,
      {
        durationMonths: Number(durationMonths),
        notes: subscriptionNotes,
      }
    )

    setSubscriptionMessage(response.data.message)

    setSubscriptionNotes('')

    await fetchSubscriptionData()
  } catch (err: any) {
    setSubscriptionError(
      err.response?.data?.message || 'Subscription operation failed.'
    )
  } finally {
    setSubscriptionActionLoading(false)
  }
}


  if (loading) {
    return (
      <div className="p-8 text-center text-gray-600">
        Loading vendor details...
      </div>
    )
  }


    

  if (error || !vendor) {
    return (
      <div className="p-6">
        <button
          onClick={() => navigate('/super-admin/vendors')}
          className="mb-5 text-blue-600 hover:underline"
        >
          ← Back to Vendors
        </button>

        <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-red-700">
          {error || 'Vendor not found.'}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6 p-4 md:p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <button
            onClick={() => navigate('/super-admin/vendors')}
            className="mb-3 text-sm text-blue-600 hover:underline"
          >
            ← Back to Vendors
          </button>

          <h1 className="text-2xl font-bold text-gray-800">
            Vendor Details
          </h1>

          <p className="mt-1 text-sm text-gray-500">
            Business information and account activity
          </p>
        </div>

        <span
          className={`rounded-full px-4 py-2 text-sm font-semibold ${statusStyle(vendor.status)}`}
        >
          {vendor.status || 'UNKNOWN'}
        </span>
      </div>

      {/* Business Information */}
      <section className="rounded-xl border bg-white p-5 shadow-sm">
        <h2 className="mb-4 text-lg font-semibold text-gray-800">
          Business Information
        </h2>

        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          <div>
            <p className="text-sm text-gray-500">Business Name</p>
            <p className="mt-1 font-medium text-gray-800">
              {vendor.businessName || '—'}
            </p>
          </div>

          <div>
            <p className="text-sm text-gray-500">Subdomain</p>
            <p className="mt-1 font-medium text-gray-800">
              {vendor.subdomain || '—'}
            </p>
          </div>

          <div>
            <p className="text-sm text-gray-500">Country</p>
            <p className="mt-1 font-medium text-gray-800">
              {vendor.country || '—'}
            </p>
          </div>

          <div>
            <p className="text-sm text-gray-500">Currency</p>
            <p className="mt-1 font-medium text-gray-800">
              {vendor.currency || '—'}
            </p>
          </div>

          <div>
            <p className="text-sm text-gray-500">Timezone</p>
            <p className="mt-1 font-medium text-gray-800">
              {vendor.timezone || '—'}
            </p>
          </div>

          <div>
            <p className="text-sm text-gray-500">Registered Date</p>
            <p className="mt-1 font-medium text-gray-800">
              {formatDate(vendor.createdAt)}
            </p>
          </div>
        </div>
      </section>

      {/* Owner Information */}
      <section className="rounded-xl border bg-white p-5 shadow-sm">
        <h2 className="mb-4 text-lg font-semibold text-gray-800">
          Owner Information
        </h2>

        {vendor.owner ? (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            <div>
              <p className="text-sm text-gray-500">Owner Name</p>
              <p className="mt-1 font-medium text-gray-800">
                {vendor.owner.name || '—'}
              </p>
            </div>

            <div>
              <p className="text-sm text-gray-500">Email</p>
              <p className="mt-1 font-medium text-gray-800">
                {vendor.owner.email || '—'}
              </p>
            </div>

            <div>
              <p className="text-sm text-gray-500">Owner Account Status</p>
              <p className="mt-1 font-medium text-gray-800">
                {vendor.owner.status || '—'}
              </p>
            </div>

            <div>
              <p className="text-sm text-gray-500">Owner Account Created</p>
              <p className="mt-1 font-medium text-gray-800">
                {formatDate(vendor.owner.createdAt)}
              </p>
            </div>
          </div>
        ) : (
          <p className="text-sm text-gray-500">
            No owner information found.
          </p>
        )}
      </section>

      {/* Account Dates */}
      <section className="rounded-xl border bg-white p-5 shadow-sm">
        <h2 className="mb-4 text-lg font-semibold text-gray-800">
          Account Status History
        </h2>

        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          <div>
            <p className="text-sm text-gray-500">Approved Date</p>
            <p className="mt-1 font-medium text-gray-800">
              {formatDate(vendor.approvedAt)}
            </p>
          </div>

          <div>
            <p className="text-sm text-gray-500">Suspended Date</p>
            <p className="mt-1 font-medium text-gray-800">
              {formatDate(vendor.suspendedAt)}
            </p>
          </div>

          <div>
            <p className="text-sm text-gray-500">Rejected Date</p>
            <p className="mt-1 font-medium text-gray-800">
              {formatDate(vendor.rejectedAt)}
            </p>
          </div>
        </div>

        {vendor.rejectionReason && (
          <div className="mt-5 rounded-lg bg-red-50 p-3">
            <p className="text-sm font-semibold text-red-700">
              Rejection Reason
            </p>
            <p className="mt-1 text-sm text-red-600">
              {vendor.rejectionReason}
            </p>
          </div>
        )}
      </section>

      {/* Activity History */}
      <section className="rounded-xl border bg-white p-5 shadow-sm">
        <div className="mb-5 flex flex-wrap items-center justify-between gap-2">
          <h2 className="text-lg font-semibold text-gray-800">
            Activity History
          </h2>

          <span className="rounded-full bg-gray-100 px-3 py-1 text-sm text-gray-600">
            {activities.length} activities
          </span>
        </div>

        {activities.length === 0 ? (
          <p className="py-6 text-center text-sm text-gray-500">
            No activity history available yet.
          </p>
        ) : (
          <div className="space-y-5">
            {activities.map((activity) => (
              <div
                key={activity._id}
                className="relative border-l-2 border-blue-200 pb-2 pl-5"
              >
                <span className="absolute -left-[7px] top-1 h-3 w-3 rounded-full bg-blue-500" />

                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="font-semibold text-gray-800">
                    {activity.action}
                  </span>

                  <span className="text-xs text-gray-500">
                    {formatDate(activity.createdAt)}
                  </span>
                </div>

                <p className="mt-2 text-sm text-gray-600">
                  Status changed from{' '}
                  <strong>{activity.previousStatus || '—'}</strong> to{' '}
                  <strong>{activity.newStatus || '—'}</strong>
                </p>

                <p className="mt-1 text-sm text-gray-600">
                  Admin:{' '}
                  {activity.adminId?.name || 'Unknown'} (
                  {activity.adminId?.email || '—'})
                </p>

                {activity.reason && (
                  <p className="mt-2 rounded-lg bg-gray-50 p-3 text-sm text-gray-600">
                    Reason: {activity.reason}
                  </p>
                )}
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Subscription Management */}
      <section className="rounded-xl border bg-white p-5 shadow-sm">
        <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold text-gray-800">
              Subscription Management
            </h2>
            <p className="mt-1 text-sm text-gray-500">
              Manage free subscription periods and extensions.
            </p>
          </div>

          <button
            onClick={fetchSubscriptionData}
            disabled={subscriptionLoading}
            className="rounded-lg border px-4 py-2 text-sm hover:bg-gray-50 disabled:opacity-50"
          >
            Refresh
          </button>
        </div>

        {subscriptionError && (
          <div className="mb-4 rounded-lg bg-red-50 p-3 text-sm text-red-700">
            {subscriptionError}
          </div>
        )}

        {subscriptionMessage && (
          <div className="mb-4 rounded-lg bg-green-50 p-3 text-sm text-green-700">
            {subscriptionMessage}
          </div>
        )}

        {subscriptionLoading ? (
          <p className="py-5 text-center text-gray-500">
            Loading subscription information...
          </p>
        ) : (
          <>
            <div className="mb-6 rounded-lg border p-4">
              <h3 className="mb-3 font-semibold text-gray-800">
                Current Subscription
              </h3>

              {subscription ? (
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  <div>
                    <p className="text-sm text-gray-500">Plan</p>
                    <p className="font-semibold">{subscription.planType}</p>
                  </div>

                  <div>
                    <p className="text-sm text-gray-500">Status</p>
                    <span className="inline-block rounded-full bg-green-100 px-3 py-1 text-sm font-semibold text-green-700">
                      {subscription.subscriptionStatus}
                    </span>
                  </div>

                  <div>
                    <p className="text-sm text-gray-500">Billing Cycle</p>
                    <p className="font-semibold">{subscription.billingCycle}</p>
                  </div>

                  <div>
                    <p className="text-sm text-gray-500">Amount</p>
                    <p className="font-semibold">
                      {subscription.currency} {subscription.amount}
                    </p>
                  </div>

                  <div>
                    <p className="text-sm text-gray-500">Start Date</p>
                    <p className="font-semibold">{formatDate(subscription.startDate)}</p>
                  </div>

                  <div>
                    <p className="text-sm text-gray-500">Expiry Date</p>
                    <p className="font-semibold">{formatDate(subscription.endDate)}</p>
                  </div>

                  <div>
                    <p className="text-sm text-gray-500">Granted By</p>
                    <p className="font-semibold">
                      {subscription.grantedBy?.name || 'Unknown'}
                    </p>
                  </div>
                </div>
              ) : (
                <p className="text-sm text-gray-500">
                  No current subscription found.
                </p>
              )}
            </div>

            <div className="mb-6 rounded-lg border p-4">
              <h3 className="mb-4 font-semibold text-gray-800">
                Grant or Extend Free Subscription
              </h3>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-2 block text-sm font-medium text-gray-700">
                    Duration
                  </label>

                  <select
                    value={durationMonths}
                    onChange={(e) => setDurationMonths(e.target.value)}
                    className="w-full rounded-lg border p-2.5"
                  >
                    <option value="1">1 Month</option>
                    <option value="3">3 Months</option>
                    <option value="6">6 Months</option>
                    <option value="12">12 Months</option>
                  </select>
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium text-gray-700">
                    Admin Notes
                  </label>

                  <input
                    type="text"
                    maxLength={500}
                    value={subscriptionNotes}
                    onChange={(e) => setSubscriptionNotes(e.target.value)}
                    placeholder="Enter reason or notes"
                    className="w-full rounded-lg border p-2.5"
                  />
                </div>
              </div>

              <div className="mt-4 flex flex-wrap gap-3">
                <button
                  onClick={() => handleSubscriptionAction('grant')}
                  disabled={subscriptionActionLoading || !!subscription}
                  className="rounded-lg bg-blue-600 px-4 py-2.5 text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Grant Free Subscription
                </button>

                <button
                  onClick={() => handleSubscriptionAction('extend')}
                  disabled={subscriptionActionLoading || subscriptionHistory.length === 0}
                  className="rounded-lg bg-green-600 px-4 py-2.5 text-white hover:bg-green-700 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Extend Subscription
                </button>
              </div>

              {subscriptionActionLoading && (
                <p className="mt-3 text-sm text-gray-500">
                  Processing subscription...
                </p>
              )}
            </div>

            <div>
              <div className="mb-3 flex items-center justify-between">
                <h3 className="font-semibold text-gray-800">
                  Subscription History
                </h3>

                <span className="rounded-full bg-gray-100 px-3 py-1 text-sm text-gray-600">
                  {subscriptionHistory.length} records
                </span>
              </div>

              {subscriptionHistory.length === 0 ? (
                <p className="py-5 text-center text-sm text-gray-500">
                  No subscription history available.
                </p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[650px] text-left text-sm">
                    <thead className="bg-gray-50 text-gray-600">
                      <tr>
                        <th className="p-3">Plan</th>
                        <th className="p-3">Duration</th>
                        <th className="p-3">Status</th>
                        <th className="p-3">Start Date</th>
                        <th className="p-3">Expiry Date</th>
                        <th className="p-3">Amount</th>
                        <th className="p-3">Granted By</th>
                      </tr>
                    </thead>

                    <tbody className="divide-y">
                      {subscriptionHistory.map((item) => (
                        <tr key={item._id}>
                          <td className="p-3 font-medium">{item.planType}</td>
                          <td className="p-3">{item.billingCycle}</td>
                          <td className="p-3">
                            <span className="rounded-full bg-gray-100 px-2 py-1 text-xs">
                              {item.subscriptionStatus}
                            </span>
                          </td>
                          <td className="p-3">{formatDate(item.startDate)}</td>
                          <td className="p-3">{formatDate(item.endDate)}</td>
                          <td className="p-3">
                            {item.currency} {item.amount}
                          </td>
                          <td className="p-3">
                            {item.grantedBy?.name || 'Unknown'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </>
        )}
      </section>



    </div>
  )
}
