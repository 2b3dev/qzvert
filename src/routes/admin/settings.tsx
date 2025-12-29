import { createFileRoute, redirect } from '@tanstack/react-router'
import {
  AlertTriangle,
  Database,
  HardDrive,
  Loader2,
  Save,
  Server,
  Settings,
  Sparkles,
  ToggleRight,
  Trash2,
} from 'lucide-react'
import { useEffect, useState } from 'react'
import { toast } from 'sonner'
import { AdminLayout } from '../../components/layouts/AdminLayout'
import { Button } from '../../components/ui/button'
import { Input } from '../../components/ui/input'
import { cn } from '../../lib/utils'
import {
  checkAdminAccess,
  clearAllReports,
  clearOldPlayRecords,
  getDatabaseStats,
  getStorageStats,
  getSystemSettings,
  updateSystemSettings,
  type DatabaseStats,
  type StorageStats,
  type SystemSettings,
} from '../../server/admin-settings'

export const Route = createFileRoute('/admin/settings')({
  beforeLoad: async () => {
    const { isAdmin } = await checkAdminAccess()
    if (!isAdmin) {
      throw redirect({ to: '/' })
    }
  },
  component: AdminSettings,
})

// Toggle component
function Toggle({
  checked,
  onChange,
  disabled,
}: {
  checked: boolean
  onChange: (checked: boolean) => void
  disabled?: boolean
}) {
  return (
    <button
      onClick={() => !disabled && onChange(!checked)}
      disabled={disabled}
      className={cn(
        'relative inline-flex h-6 w-11 items-center rounded-full transition-colors',
        checked ? 'bg-primary' : 'bg-muted',
        disabled && 'opacity-50 cursor-not-allowed',
      )}
    >
      <span
        className={cn(
          'inline-block h-4 w-4 transform rounded-full bg-white transition-transform',
          checked ? 'translate-x-6' : 'translate-x-1',
        )}
      />
    </button>
  )
}

function AdminSettings() {
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [settings, setSettings] = useState<SystemSettings | null>(null)
  const [storageStats, setStorageStats] = useState<StorageStats | null>(null)
  const [dbStats, setDbStats] = useState<DatabaseStats | null>(null)

  // Danger zone loading states
  const [clearingReports, setClearingReports] = useState(false)
  const [clearingRecords, setClearingRecords] = useState(false)

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true)
      try {
        const [settingsData, storageData, dbData] = await Promise.all([
          getSystemSettings(),
          getStorageStats(),
          getDatabaseStats(),
        ])
        setSettings(settingsData)
        setStorageStats(storageData)
        setDbStats(dbData)
      } catch (error) {
        console.error('Failed to fetch settings:', error)
        toast.error('Failed to load settings')
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [])

  const handleSave = async () => {
    if (!settings) return

    setSaving(true)
    try {
      await updateSystemSettings({ data: settings })
      toast.success('Settings saved successfully')
    } catch (error) {
      console.error('Failed to save settings:', error)
      toast.error('Failed to save settings')
    } finally {
      setSaving(false)
    }
  }

  const handleClearReports = async () => {
    if (
      !confirm(
        'Are you sure you want to delete all resolved reports? This cannot be undone.',
      )
    )
      return

    setClearingReports(true)
    try {
      const result = await clearAllReports()
      toast.success(`Deleted ${result.deletedCount} resolved reports`)
      // Refresh db stats
      const dbData = await getDatabaseStats()
      setDbStats(dbData)
    } catch (error) {
      console.error('Failed to clear reports:', error)
      toast.error('Failed to clear reports')
    } finally {
      setClearingReports(false)
    }
  }

  const handleClearOldRecords = async () => {
    if (
      !confirm(
        'Are you sure you want to delete play records older than 90 days? This cannot be undone.',
      )
    )
      return

    setClearingRecords(true)
    try {
      const result = await clearOldPlayRecords({ data: { daysOld: 90 } })
      toast.success(`Deleted ${result.deletedCount} old play records`)
      // Refresh db stats
      const dbData = await getDatabaseStats()
      setDbStats(dbData)
    } catch (error) {
      console.error('Failed to clear records:', error)
      toast.error('Failed to clear records')
    } finally {
      setClearingRecords(false)
    }
  }

  const updateSetting = <K extends keyof SystemSettings>(
    key: K,
    value: SystemSettings[K],
  ) => {
    if (!settings) return
    setSettings({ ...settings, [key]: value })
  }

  if (loading) {
    return (
      <AdminLayout title="Settings" activeItem="settings">
        <div className="flex items-center justify-center py-24">
          <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
        </div>
      </AdminLayout>
    )
  }

  return (
    <AdminLayout title="Settings" activeItem="settings">
      <div className="space-y-6 max-w-4xl">
        {/* General Settings */}
        <div className="bg-card border border-border rounded-xl p-6">
          <div className="flex items-center gap-2 mb-6">
            <Settings className="w-5 h-5 text-primary" />
            <h2 className="text-lg font-semibold text-foreground">
              General Settings
            </h2>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-foreground mb-1">
                Site Name
              </label>
              <Input
                value={settings?.siteName || ''}
                onChange={(e) => updateSetting('siteName', e.target.value)}
                placeholder="QzVert"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-1">
                Site Description
              </label>
              <Input
                value={settings?.siteDescription || ''}
                onChange={(e) =>
                  updateSetting('siteDescription', e.target.value)
                }
                placeholder="AI-powered Learning Platform"
              />
            </div>

            <div className="flex items-center justify-between py-2">
              <div>
                <p className="font-medium text-foreground">Maintenance Mode</p>
                <p className="text-sm text-muted-foreground">
                  Disable access to the site for non-admin users
                </p>
              </div>
              <Toggle
                checked={settings?.maintenanceMode || false}
                onChange={(checked) => updateSetting('maintenanceMode', checked)}
              />
            </div>

            {settings?.maintenanceMode && (
              <div>
                <label className="block text-sm font-medium text-foreground mb-1">
                  Maintenance Message
                </label>
                <Input
                  value={settings?.maintenanceMessage || ''}
                  onChange={(e) =>
                    updateSetting('maintenanceMessage', e.target.value)
                  }
                  placeholder="We are currently performing maintenance..."
                />
              </div>
            )}
          </div>
        </div>

        {/* Limits Settings */}
        <div className="bg-card border border-border rounded-xl p-6">
          <div className="flex items-center gap-2 mb-6">
            <Server className="w-5 h-5 text-blue-500" />
            <h2 className="text-lg font-semibold text-foreground">Limits</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-foreground mb-1">
                Max Activities per User
              </label>
              <Input
                type="number"
                value={settings?.maxActivitiesPerUser || 100}
                onChange={(e) =>
                  updateSetting('maxActivitiesPerUser', parseInt(e.target.value))
                }
                min={1}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-1">
                Max Questions per Activity
              </label>
              <Input
                type="number"
                value={settings?.maxQuestionsPerActivity || 50}
                onChange={(e) =>
                  updateSetting(
                    'maxQuestionsPerActivity',
                    parseInt(e.target.value),
                  )
                }
                min={1}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-1">
                Max File Upload (MB)
              </label>
              <Input
                type="number"
                value={settings?.maxFileUploadSizeMB || 5}
                onChange={(e) =>
                  updateSetting('maxFileUploadSizeMB', parseInt(e.target.value))
                }
                min={1}
              />
            </div>
          </div>
        </div>

        {/* AI Settings */}
        <div className="bg-card border border-border rounded-xl p-6">
          <div className="flex items-center gap-2 mb-6">
            <Sparkles className="w-5 h-5 text-purple-500" />
            <h2 className="text-lg font-semibold text-foreground">
              AI Settings
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-foreground mb-1">
                AI Credits per New User
              </label>
              <Input
                type="number"
                value={settings?.aiCreditsPerUser || 100}
                onChange={(e) =>
                  updateSetting('aiCreditsPerUser', parseInt(e.target.value))
                }
                min={0}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-1">
                AI Credits per Generation
              </label>
              <Input
                type="number"
                value={settings?.aiCreditsPerGeneration || 10}
                onChange={(e) =>
                  updateSetting(
                    'aiCreditsPerGeneration',
                    parseInt(e.target.value),
                  )
                }
                min={1}
              />
            </div>
          </div>
        </div>

        {/* Feature Toggles */}
        <div className="bg-card border border-border rounded-xl p-6">
          <div className="flex items-center gap-2 mb-6">
            <ToggleRight className="w-5 h-5 text-green-500" />
            <h2 className="text-lg font-semibold text-foreground">Features</h2>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between py-2">
              <div>
                <p className="font-medium text-foreground">
                  Enable Public Activities
                </p>
                <p className="text-sm text-muted-foreground">
                  Allow users to publish activities publicly
                </p>
              </div>
              <Toggle
                checked={settings?.enablePublicActivities ?? true}
                onChange={(checked) =>
                  updateSetting('enablePublicActivities', checked)
                }
              />
            </div>

            <div className="flex items-center justify-between py-2">
              <div>
                <p className="font-medium text-foreground">
                  Enable User Registration
                </p>
                <p className="text-sm text-muted-foreground">
                  Allow new users to register
                </p>
              </div>
              <Toggle
                checked={settings?.enableUserRegistration ?? true}
                onChange={(checked) =>
                  updateSetting('enableUserRegistration', checked)
                }
              />
            </div>

            <div className="flex items-center justify-between py-2">
              <div>
                <p className="font-medium text-foreground">
                  Enable AI Generation
                </p>
                <p className="text-sm text-muted-foreground">
                  Allow AI-powered content generation
                </p>
              </div>
              <Toggle
                checked={settings?.enableAIGeneration ?? true}
                onChange={(checked) =>
                  updateSetting('enableAIGeneration', checked)
                }
              />
            </div>

            <div className="flex items-center justify-between py-2">
              <div>
                <p className="font-medium text-foreground">
                  Require Email Verification
                </p>
                <p className="text-sm text-muted-foreground">
                  Require users to verify email before using the platform
                </p>
              </div>
              <Toggle
                checked={settings?.requireEmailVerification ?? false}
                onChange={(checked) =>
                  updateSetting('requireEmailVerification', checked)
                }
              />
            </div>
          </div>
        </div>

        {/* Save Button */}
        <div className="flex justify-end">
          <Button onClick={handleSave} disabled={saving}>
            {saving ? (
              <Loader2 className="w-4 h-4 animate-spin mr-2" />
            ) : (
              <Save className="w-4 h-4 mr-2" />
            )}
            Save Settings
          </Button>
        </div>

        {/* System Info */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Storage Stats */}
          <div className="bg-card border border-border rounded-xl p-6">
            <div className="flex items-center gap-2 mb-4">
              <HardDrive className="w-5 h-5 text-amber-500" />
              <h2 className="text-lg font-semibold text-foreground">Storage</h2>
            </div>

            {storageStats && (
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Thumbnails</span>
                  <span className="font-medium text-foreground">
                    {storageStats.thumbnailsCount} files (
                    {storageStats.thumbnailsSizeMB} MB)
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Total Used</span>
                  <span className="font-medium text-foreground">
                    {storageStats.totalStorageMB} MB
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Limit</span>
                  <span className="font-medium text-foreground">
                    {storageStats.storageLimitMB} MB
                  </span>
                </div>
                <div className="mt-4">
                  <div className="h-2 rounded-full bg-muted overflow-hidden">
                    <div
                      className="h-full bg-amber-500 transition-all"
                      style={{
                        width: `${Math.min((storageStats.totalStorageMB / storageStats.storageLimitMB) * 100, 100)}%`,
                      }}
                    />
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    {Math.round(
                      (storageStats.totalStorageMB /
                        storageStats.storageLimitMB) *
                        100,
                    )}
                    % used
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Database Stats */}
          <div className="bg-card border border-border rounded-xl p-6">
            <div className="flex items-center gap-2 mb-4">
              <Database className="w-5 h-5 text-blue-500" />
              <h2 className="text-lg font-semibold text-foreground">
                Database
              </h2>
            </div>

            {dbStats && (
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Profiles</span>
                  <span className="font-medium text-foreground">
                    {dbStats.profilesCount.toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Activities</span>
                  <span className="font-medium text-foreground">
                    {dbStats.activitiesCount.toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Stages</span>
                  <span className="font-medium text-foreground">
                    {dbStats.stagesCount.toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Questions</span>
                  <span className="font-medium text-foreground">
                    {dbStats.questionsCount.toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Reports</span>
                  <span className="font-medium text-foreground">
                    {dbStats.reportsCount.toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Play Records</span>
                  <span className="font-medium text-foreground">
                    {dbStats.playRecordsCount.toLocaleString()}
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Danger Zone */}
        <div className="bg-card border border-red-500/30 rounded-xl p-6">
          <div className="flex items-center gap-2 mb-6">
            <AlertTriangle className="w-5 h-5 text-red-500" />
            <h2 className="text-lg font-semibold text-red-500">Danger Zone</h2>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 rounded-lg bg-red-500/5 border border-red-500/20">
              <div>
                <p className="font-medium text-foreground">
                  Clear Resolved Reports
                </p>
                <p className="text-sm text-muted-foreground">
                  Delete all reports with &quot;resolved&quot; status
                </p>
              </div>
              <Button
                variant="destructive"
                size="sm"
                onClick={handleClearReports}
                disabled={clearingReports}
              >
                {clearingReports ? (
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                ) : (
                  <Trash2 className="w-4 h-4 mr-2" />
                )}
                Clear Reports
              </Button>
            </div>

            <div className="flex items-center justify-between p-4 rounded-lg bg-red-500/5 border border-red-500/20">
              <div>
                <p className="font-medium text-foreground">
                  Clear Old Play Records
                </p>
                <p className="text-sm text-muted-foreground">
                  Delete play records older than 90 days
                </p>
              </div>
              <Button
                variant="destructive"
                size="sm"
                onClick={handleClearOldRecords}
                disabled={clearingRecords}
              >
                {clearingRecords ? (
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                ) : (
                  <Trash2 className="w-4 h-4 mr-2" />
                )}
                Clear Records
              </Button>
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  )
}
