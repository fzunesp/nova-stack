import { useAuth } from '@/hooks/useAuth'

export function SettingsPage() {
  const { user } = useAuth()

  return (
    <div>
      <h2 className="text-xl font-semibold mb-6">Settings</h2>

      <div className="bg-white rounded-lg border border-gray-200 p-6 max-w-lg">
        <h3 className="font-medium text-gray-900 mb-4">Profile</h3>
        <div className="space-y-4">
          <div>
            <label className="block text-sm text-gray-500 mb-1">Name</label>
            <p className="text-gray-900">{(user as any)?.name || 'N/A'}</p>
          </div>
          <div>
            <label className="block text-sm text-gray-500 mb-1">Email</label>
            <p className="text-gray-900">{(user as any)?.email || 'N/A'}</p>
          </div>
          <div>
            <label className="block text-sm text-gray-500 mb-1">Company</label>
            <p className="text-gray-900">{(user as any)?.companyName || 'Not set'}</p>
          </div>
        </div>
      </div>
    </div>
  )
}
