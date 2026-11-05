
import { useEffect, useState } from 'react'

import api from '../services/api'
import {
  Building2,
  Globe,
  Receipt,
  Package,
  Bell,
  Loader2,
} from 'lucide-react'

interface SettingsData {
  business: {
    businessName: string
    logo: string
    phone: string
    email: string
    address: string
    taxNumber: string
  }
  regional: {
    country: string
    currency: string
    supportedCurrencies: string[]
    timezone: string
    dateFormat: string
    numberFormat: string
  }
  sales: {
    invoicePrefix: string
    nextInvoiceNumber: number
    taxEnabled: boolean
    taxRate: number
    allowDiscount: boolean
  }
  inventory: {
    lowStockAlert: boolean
    expiryAlert: boolean
    expiryAlertDays: number
  }
  notifications: {
    emailNotifications: boolean
    lowStockNotifications: boolean
    expiryNotifications: boolean
  }
}

const sections = [
  { name: 'Business Information', icon: Building2 },
  { name: 'Regional & Currency', icon: Globe },
  { name: 'Sales & Invoice', icon: Receipt },
  { name: 'Inventory', icon: Package },
  { name: 'Notifications', icon: Bell },
]

export default function SettingsPage() {
  const [settings, setSettings] = useState<SettingsData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const [savingBusiness, setSavingBusiness] = useState(false)
  const [businessMessage, setBusinessMessage] = useState('')

  const [savingRegional, setSavingRegional] = useState(false)
  const [regionalMessage, setRegionalMessage] = useState('')

  const [savingSales, setSavingSales] = useState(false)
  const [salesMessage, setSalesMessage] = useState('')

  const [savingInventory, setSavingInventory] = useState(false)
  const [inventoryMessage, setInventoryMessage] = useState('')

  const [savingNotifications, setSavingNotifications] = useState(false)
  const [notificationMessage, setNotificationMessage] = useState('')

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const response = await api.get('/settings')
        setSettings(response.data.data)
      } catch (err: any) {
        setError(
          err.response?.data?.message || 'Unable to load settings.'
        )
      } finally {
        setLoading(false)
      }
    }

    fetchSettings()
  }, [])

  
  const handleSaveBusiness = async () => {
    if (!settings) return

    try {
        setSavingBusiness(true)
        setBusinessMessage('')

        const response = await api.put('/settings', {
        business: settings.business,
        })

        setSettings(response.data.data)
        setBusinessMessage('Business information saved successfully!')
    } catch (err: any) {
        setBusinessMessage(
        err.response?.data?.message || 'Failed to save business information.'
        )
    } finally {
        setSavingBusiness(false)
    }
    }

    const handleSaveRegional = async () => {
        if (!settings) return

        try {
            setSavingRegional(true)
            setRegionalMessage('')

            const response = await api.put('/settings', {
            regional: settings.regional,
            })

            setSettings(response.data.data)
            setRegionalMessage('Regional settings saved successfully!')
        } catch (err: any) {
            setRegionalMessage(
            err.response?.data?.message || 'Failed to save regional settings.'
            )
        } finally {
            setSavingRegional(false)
        }
        }

    const handleSaveSales = async () => {
        if (!settings) return

        try {
            setSavingSales(true)
            setSalesMessage('')

            const response = await api.put('/settings', {
            sales: {
                invoicePrefix: settings.sales.invoicePrefix,
                taxEnabled: settings.sales.taxEnabled,
                taxRate: settings.sales.taxRate,
                allowDiscount: settings.sales.allowDiscount,
            },
            })

            setSettings(response.data.data)
            setSalesMessage('Sales settings saved successfully!')
        } catch (err: any) {
            setSalesMessage(
            err.response?.data?.message || 'Failed to save sales settings.'
            )
        } finally {
            setSavingSales(false)
        }
    }

    const handleSaveInventory = async () => {
        if (!settings) return

        try {
            setSavingInventory(true)
            setInventoryMessage('')

            const response = await api.put('/settings', {
            inventory: settings.inventory,
            })

            setSettings(response.data.data)
            setInventoryMessage('Inventory settings saved successfully!')
        } catch (err: any) {
            setInventoryMessage(
            err.response?.data?.message || 'Failed to save inventory settings.'
            )
        } finally {
            setSavingInventory(false)
        }
    }

    const handleSaveNotifications = async () => {
        if (!settings) return

        try {
            setSavingNotifications(true)
            setNotificationMessage('')

            const response = await api.put('/settings', {
            notifications: settings.notifications,
            })

            setSettings(response.data.data)
            setNotificationMessage('Notification settings saved successfully!')
        } catch (err: any) {
            setNotificationMessage(
            err.response?.data?.message || 'Failed to save notification settings.'
            )
        } finally {
            setSavingNotifications(false)
        }
        }


  

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="animate-spin text-blue-600" size={30} />
        <span className="ml-3 text-slate-500">Loading settings...</span>
      </div>
    )
  }

  if (error) {
    return (
      <div className="rounded-xl border border-red-200 bg-red-50 p-5 text-red-700">
        {error}
      </div>
    )
  }

  if (!settings) return null

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">
          Settings
        </h1>
        <p className="mt-1 text-sm text-slate-500">
          Manage your business preferences and configurations.
        </p>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
        {sections.map(({ name, icon: Icon }) => (
          <div
            key={name}
            className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white p-4"
          >
            <div className="rounded-lg bg-blue-50 p-2 text-blue-600">
              <Icon size={20} />
            </div>
            <span className="text-sm font-medium text-slate-700">
              {name}
            </span>
          </div>
        ))}
      </div>

      <div className="grid gap-5 lg:grid-cols-2">

        <SettingsCard title="Business Information">
        {(
            [
            ['businessName', 'Business Name'],
            ['phone', 'Phone Number'],
            ['email', 'Email Address'],
            ['address', 'Business Address'],
            ['taxNumber', 'Tax Number'],
            ] as const
        ).map(([key, label]) => (
            <div key={key}>
            <label className="mb-1 block text-sm font-medium text-slate-600">
                {label}
            </label>

            <input
                type="text"
                value={settings.business[key]}
                onChange={(e) =>
                setSettings({
                    ...settings,
                    business: {
                    ...settings.business,
                    [key]: e.target.value,
                    },
                })
                }
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            />
            </div>
        ))}

        {businessMessage && (
            <p className="text-sm text-blue-600">{businessMessage}</p>
        )}

        <button
            type="button"
            onClick={handleSaveBusiness}
            disabled={savingBusiness}
            className="rounded-lg bg-blue-600 px-5 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
        >
            {savingBusiness ? 'Saving...' : 'Save Business Information'}
        </button>
        </SettingsCard>

        
        
        <SettingsCard title="Regional & Currency">
        <div>
            <label className="mb-1 block text-sm font-medium text-slate-600">
            Country
            </label>
            <input
            type="text"
            value={settings.regional.country}
            onChange={(e) =>
                setSettings({
                ...settings,
                regional: {
                    ...settings.regional,
                    country: e.target.value,
                },
                })
            }
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
            placeholder="e.g. Japan"
            />
        </div>

        <div>
            <label className="mb-1 block text-sm font-medium text-slate-600">
            Default Currency
            </label>
            <select
            value={settings.regional.currency}
            onChange={(e) =>
                setSettings({
                ...settings,
                regional: {
                    ...settings.regional,
                    currency: e.target.value,
                    supportedCurrencies: settings.regional.supportedCurrencies.includes(e.target.value)
                    ? settings.regional.supportedCurrencies
                    : [...settings.regional.supportedCurrencies, e.target.value],
                },
                })
            }
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
            >
            <option value="NPR">NPR - Nepalese Rupee</option>
            <option value="INR">INR - Indian Rupee</option>
            <option value="JPY">JPY - Japanese Yen</option>
            <option value="USD">USD - US Dollar</option>
            </select>
        </div>

        <div>
            <label className="mb-1 block text-sm font-medium text-slate-600">
            Supported Currencies
            </label>
            <div className="flex flex-wrap gap-4">
            {['NPR', 'INR', 'JPY', 'USD'].map((currency) => (
                <label key={currency} className="flex items-center gap-2 text-sm">
                <input
                    type="checkbox"
                    checked={settings.regional.supportedCurrencies.includes(currency)}
                    onChange={(e) => {
                    const current = settings.regional.supportedCurrencies
                    const updated = e.target.checked
                        ? [...current, currency]
                        : current.filter((item) => item !== currency)

                    if (!updated.includes(settings.regional.currency)) return

                    setSettings({
                        ...settings,
                        regional: {
                        ...settings.regional,
                        supportedCurrencies: updated,
                        },
                    })
                    }}
                />
                {currency}
                </label>
            ))}
            </div>
            <p className="mt-1 text-xs text-slate-500">
            The default currency must remain selected.
            </p>
        </div>

        <div>
            <label className="mb-1 block text-sm font-medium text-slate-600">
            Timezone
            </label>
            <input
            type="text"
            value={settings.regional.timezone}
            onChange={(e) =>
                setSettings({
                ...settings,
                regional: {
                    ...settings.regional,
                    timezone: e.target.value,
                },
                })
            }
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
            placeholder="Asia/Tokyo"
            />
        </div>

        <div>
            <label className="mb-1 block text-sm font-medium text-slate-600">
            Date Format
            </label>
            <select
            value={settings.regional.dateFormat}
            onChange={(e) =>
                setSettings({
                ...settings,
                regional: {
                    ...settings.regional,
                    dateFormat: e.target.value,
                },
                })
            }
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
            >
            <option value="YYYY-MM-DD">YYYY-MM-DD</option>
            <option value="DD/MM/YYYY">DD/MM/YYYY</option>
            <option value="MM/DD/YYYY">MM/DD/YYYY</option>
            </select>
        </div>

        <div>
            <label className="mb-1 block text-sm font-medium text-slate-600">
            Number Format
            </label>
            <select
            value={settings.regional.numberFormat}
            onChange={(e) =>
                setSettings({
                ...settings,
                regional: {
                    ...settings.regional,
                    numberFormat: e.target.value,
                },
                })
            }
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
            >
            <option value="en-US">English (US)</option>
            <option value="en-IN">English (India)</option>
            <option value="ja-JP">Japanese</option>
            <option value="ne-NP">Nepali</option>
            </select>
        </div>

        <button
            type="button"
            onClick={handleSaveRegional}
            disabled={savingRegional}
            className="rounded-lg bg-blue-600 px-5 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
        >
            {savingRegional ? 'Saving...' : 'Save Regional Settings'}
        </button>

        {regionalMessage && (
            <p className="text-sm text-blue-600">{regionalMessage}</p>
        )}
        </SettingsCard>


        <SettingsCard title="Sales & Invoice">
        <div>
            <label className="mb-1 block text-sm font-medium text-slate-600">
            Invoice Prefix
            </label>
            <input
            type="text"
            value={settings.sales.invoicePrefix}
            onChange={(e) =>
                setSettings({
                ...settings,
                sales: {
                    ...settings.sales,
                    invoicePrefix: e.target.value,
                },
                })
            }
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
            placeholder="INV"
            />
        </div>

        <div className="flex items-center justify-between">
            <label className="text-sm font-medium text-slate-600">
            Enable Tax
            </label>
            <input
            type="checkbox"
            checked={settings.sales.taxEnabled}
            onChange={(e) =>
                setSettings({
                ...settings,
                sales: {
                    ...settings.sales,
                    taxEnabled: e.target.checked,
                },
                })
            }
            />
        </div>

        <div>
            <label className="mb-1 block text-sm font-medium text-slate-600">
            Tax Rate (%)
            </label>
            <input
            type="number"
            min="0"
            max="100"
            value={settings.sales.taxRate}
            onChange={(e) =>
                setSettings({
                ...settings,
                sales: {
                    ...settings.sales,
                    taxRate: Number(e.target.value),
                },
                })
            }
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
            />
        </div>

        <div className="flex items-center justify-between">
            <label className="text-sm font-medium text-slate-600">
            Allow Discount
            </label>
            <input
            type="checkbox"
            checked={settings.sales.allowDiscount}
            onChange={(e) =>
                setSettings({
                ...settings,
                sales: {
                    ...settings.sales,
                    allowDiscount: e.target.checked,
                },
                })
            }
            />
        </div>

        <div className="rounded-lg bg-slate-50 p-3">
            <p className="text-sm text-slate-500">Next Invoice Number</p>
            <p className="mt-1 font-semibold text-slate-800">
            {settings.sales.nextInvoiceNumber}
            </p>
            <p className="mt-1 text-xs text-slate-400">
            Managed automatically by the sales system.
            </p>
        </div>

        {salesMessage && (
            <p className="text-sm text-blue-600">{salesMessage}</p>
        )}

        <button
            type="button"
            onClick={handleSaveSales}
            disabled={savingSales}
            className="rounded-lg bg-blue-600 px-5 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
        >
            {savingSales ? 'Saving...' : 'Save Sales Settings'}
        </button>
        </SettingsCard>


        <SettingsCard title="Inventory">
        <div className="flex items-center justify-between">
            <label className="text-sm font-medium text-slate-600">
            Low Stock Alert
            </label>
            <input
            type="checkbox"
            checked={settings.inventory.lowStockAlert}
            onChange={(e) =>
                setSettings({
                ...settings,
                inventory: {
                    ...settings.inventory,
                    lowStockAlert: e.target.checked,
                },
                })
            }
            />
        </div>

        <div className="flex items-center justify-between">
            <label className="text-sm font-medium text-slate-600">
            Expiry Alert
            </label>
            <input
            type="checkbox"
            checked={settings.inventory.expiryAlert}
            onChange={(e) =>
                setSettings({
                ...settings,
                inventory: {
                    ...settings.inventory,
                    expiryAlert: e.target.checked,
                },
                })
            }
            />
        </div>

        <div>
            <label className="mb-1 block text-sm font-medium text-slate-600">
            Expiry Alert Days
            </label>
            <input
            type="number"
            min="1"
            step="1"
            value={settings.inventory.expiryAlertDays}
            onChange={(e) =>
                setSettings({
                ...settings,
                inventory: {
                    ...settings.inventory,
                    expiryAlertDays: Number(e.target.value),
                },
                })
            }
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
            />
            <p className="mt-1 text-xs text-slate-400">
            Number of days before product expiry to trigger an alert.
            </p>
        </div>

        {inventoryMessage && (
            <p className="text-sm text-blue-600">{inventoryMessage}</p>
        )}

        <button
            type="button"
            onClick={handleSaveInventory}
            disabled={savingInventory}
            className="rounded-lg bg-blue-600 px-5 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
        >
            {savingInventory ? 'Saving...' : 'Save Inventory Settings'}
        </button>
        </SettingsCard>


    
        <SettingsCard title="Notifications">
        <div className="flex items-center justify-between">
            <div>
            <p className="text-sm font-medium text-slate-700">
                Email Notifications
            </p>
            <p className="text-xs text-slate-400">
                Enable email notifications for your shop.
            </p>
            </div>

            <input
            type="checkbox"
            checked={settings.notifications.emailNotifications}
            onChange={(e) =>
                setSettings({
                ...settings,
                notifications: {
                    ...settings.notifications,
                    emailNotifications: e.target.checked,
                },
                })
            }
            />
        </div>

        <div className="flex items-center justify-between">
            <div>
            <p className="text-sm font-medium text-slate-700">
                Low Stock Notifications
            </p>
            <p className="text-xs text-slate-400">
                Get notified when product stock is low.
            </p>
            </div>

            <input
            type="checkbox"
            checked={settings.notifications.lowStockNotifications}
            onChange={(e) =>
                setSettings({
                ...settings,
                notifications: {
                    ...settings.notifications,
                    lowStockNotifications: e.target.checked,
                },
                })
            }
            />
        </div>

        <div className="flex items-center justify-between">
            <div>
            <p className="text-sm font-medium text-slate-700">
                Expiry Notifications
            </p>
            <p className="text-xs text-slate-400">
                Get notified about products approaching expiry.
            </p>
            </div>

            <input
            type="checkbox"
            checked={settings.notifications.expiryNotifications}
            onChange={(e) =>
                setSettings({
                ...settings,
                notifications: {
                    ...settings.notifications,
                    expiryNotifications: e.target.checked,
                },
                })
            }
            />
        </div>

        {notificationMessage && (
            <p className="text-sm text-blue-600">
            {notificationMessage}
            </p>
        )}

        <button
            type="button"
            onClick={handleSaveNotifications}
            disabled={savingNotifications}
            className="rounded-lg bg-blue-600 px-5 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
        >
            {savingNotifications ? 'Saving...' : 'Save Notification Settings'}
        </button>
        </SettingsCard>

      </div>
    </div>
  )
}

function SettingsCard({
  title,
  children,
}: {
  title: string
  children: React.ReactNode
}) {
  return (
    <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
      <h2 className="mb-4 text-lg font-semibold text-slate-800">
        {title}
      </h2>
      <div className="space-y-3">{children}</div>
    </section>
  )
}


