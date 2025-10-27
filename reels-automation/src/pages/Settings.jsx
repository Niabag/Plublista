import { useState, useEffect } from 'react'
import { Save } from 'lucide-react'
import Card, { CardHeader, CardContent, CardTitle } from '../components/Card'
import Button from '../components/Button'

export default function Settings() {
  const [settings, setSettings] = useState({
    brandLogoUrl: '',
    brandName: '',
    brandColor: '#000000',
    obsHost: '127.0.0.1',
    obsPort: '4455',
    obsPassword: '',
    vscodePath: '',
    chromePath: '',
    igUserId: '',
    igPageId: '',
    igAccessToken: '',
  })

  const [saved, setSaved] = useState(false)

  useEffect(() => {
    fetchSettings()
  }, [])

  const fetchSettings = async () => {
    try {
      const response = await fetch('/api/settings')
      const data = await response.json()
      setSettings(data)
    } catch (error) {
      console.error('Failed to fetch settings:', error)
    }
  }

  const handleSave = async () => {
    try {
      await fetch('/api/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings),
      })
      setSaved(true)
      setTimeout(() => setSaved(false), 3000)
    } catch (error) {
      console.error('Failed to save settings:', error)
    }
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-gray-900">Settings</h1>
        <Button onClick={handleSave} className="flex items-center gap-2">
          <Save size={20} />
          {saved ? 'Saved!' : 'Save Changes'}
        </Button>
      </div>

      {/* Brand Settings */}
      <Card>
        <CardHeader>
          <CardTitle>Brand Settings</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Brand Name</label>
              <input
                type="text"
                value={settings.brandName}
                onChange={(e) => setSettings({ ...settings, brandName: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Logo URL</label>
              <input
                type="text"
                value={settings.brandLogoUrl}
                onChange={(e) => setSettings({ ...settings, brandLogoUrl: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Brand Color</label>
              <input
                type="color"
                value={settings.brandColor}
                onChange={(e) => setSettings({ ...settings, brandColor: e.target.value })}
                className="w-20 h-10 border border-gray-300 rounded-lg"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* OBS Settings */}
      <Card>
        <CardHeader>
          <CardTitle>OBS WebSocket Settings</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Host</label>
                <input
                  type="text"
                  value={settings.obsHost}
                  onChange={(e) => setSettings({ ...settings, obsHost: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Port</label>
                <input
                  type="text"
                  value={settings.obsPort}
                  onChange={(e) => setSettings({ ...settings, obsPort: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Password</label>
              <input
                type="password"
                value={settings.obsPassword}
                onChange={(e) => setSettings({ ...settings, obsPassword: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Application Paths */}
      <Card>
        <CardHeader>
          <CardTitle>Application Paths</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">VS Code Path</label>
              <input
                type="text"
                value={settings.vscodePath}
                onChange={(e) => setSettings({ ...settings, vscodePath: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg font-mono text-sm"
                placeholder="C:\Users\you\AppData\Local\Programs\Microsoft VS Code\Code.exe"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Chrome Path</label>
              <input
                type="text"
                value={settings.chromePath}
                onChange={(e) => setSettings({ ...settings, chromePath: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg font-mono text-sm"
                placeholder="C:\Program Files\Google\Chrome\Application\chrome.exe"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Instagram API */}
      <Card>
        <CardHeader>
          <CardTitle>Instagram API Credentials</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">IG User ID</label>
              <input
                type="text"
                value={settings.igUserId}
                onChange={(e) => setSettings({ ...settings, igUserId: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg font-mono"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">IG Page ID</label>
              <input
                type="text"
                value={settings.igPageId}
                onChange={(e) => setSettings({ ...settings, igPageId: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg font-mono"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Access Token</label>
              <input
                type="password"
                value={settings.igAccessToken}
                onChange={(e) => setSettings({ ...settings, igAccessToken: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg font-mono"
              />
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
