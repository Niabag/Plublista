import { useState, useEffect, useRef } from 'react'
import { Save, Upload, Trash2, CheckCircle, XCircle, Loader2, Sparkles, Instagram, Download, Music } from 'lucide-react'
import Card, { CardHeader, CardContent, CardTitle } from '../components/Card'
import Button from '../components/Button'

export default function Settings() {
  const [settings, setSettings] = useState({
    brandLogoUrl: '',
    brandName: '',
    brandNameImageUrl: '',
    brandSlogan: '',
    brandColor: '#000000',
    igUserId: '',
    igPageId: '',
    igAccessToken: '',
    anthropicApiKey: '',
    aiModel: 'claude-sonnet-4-20250514',
    falApiKey: '',
  })

  const [saved, setSaved] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [uploadingName, setUploadingName] = useState(false)
  const [aiTesting, setAiTesting] = useState(false)
  const [aiTestResult, setAiTestResult] = useState(null)
  const [igFetching, setIgFetching] = useState(false)
  const [igFetchResult, setIgFetchResult] = useState(null)
  const [igAccounts, setIgAccounts] = useState([])
  const fileInputRef = useRef(null)
  const nameImageInputRef = useRef(null)

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

  const handleLogoUpload = async (e) => {
    const file = e.target.files[0]
    if (!file) return
    setUploading(true)
    try {
      const formData = new FormData()
      formData.append('logo', file)
      const response = await fetch('/api/settings/logo', { method: 'POST', body: formData })
      const data = await response.json()
      if (data.success) {
        setSettings(prev => ({ ...prev, brandLogoUrl: data.url }))
      }
    } catch (error) {
      console.error('Failed to upload logo:', error)
    }
    setUploading(false)
  }

  const handleBrandNameImageUpload = async (e) => {
    const file = e.target.files[0]
    if (!file) return
    setUploadingName(true)
    try {
      const formData = new FormData()
      formData.append('brandNameImage', file)
      const response = await fetch('/api/settings/brand-name-image', { method: 'POST', body: formData })
      const data = await response.json()
      if (data.success) {
        setSettings(prev => ({ ...prev, brandNameImageUrl: data.url, brandName: '' }))
      }
    } catch (error) {
      console.error('Failed to upload brand name image:', error)
    }
    setUploadingName(false)
  }

  const handleBrandNameImageDelete = async () => {
    try {
      const response = await fetch('/api/settings/brand-name-image', { method: 'DELETE' })
      const data = await response.json()
      if (data.success) {
        setSettings(prev => ({ ...prev, brandNameImageUrl: '' }))
      }
    } catch (error) {
      console.error('Failed to delete brand name image:', error)
    }
  }

  const handleLogoDelete = async () => {
    try {
      const response = await fetch('/api/settings/logo', { method: 'DELETE' })
      const data = await response.json()
      if (data.success) {
        setSettings(prev => ({ ...prev, brandLogoUrl: '' }))
      }
    } catch (error) {
      console.error('Failed to delete logo:', error)
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
            {/* Brand Name : texte OU image */}
            {settings.brandNameImageUrl ? (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Brand Name</label>
                <div className="flex items-center gap-4">
                  <img
                    src={settings.brandNameImageUrl}
                    alt="Brand name"
                    className="h-14 object-contain border border-gray-200 rounded-lg bg-white p-2"
                  />
                  <button
                    type="button"
                    onClick={handleBrandNameImageDelete}
                    className="flex items-center gap-2 px-3 py-2 text-sm text-red-600 border border-red-200 rounded-lg hover:bg-red-50 transition-colors"
                  >
                    <Trash2 size={16} />
                    Supprimer
                  </button>
                </div>
              </div>
            ) : (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Brand Name</label>
                <input
                  type="text"
                  value={settings.brandName}
                  onChange={(e) => setSettings({ ...settings, brandName: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                  placeholder="Nom de votre marque"
                />
                <div className="mt-2">
                  <input
                    ref={nameImageInputRef}
                    type="file"
                    accept="image/png,image/jpeg,image/svg+xml,image/webp"
                    onChange={handleBrandNameImageUpload}
                    className="hidden"
                  />
                  <button
                    type="button"
                    onClick={() => nameImageInputRef.current?.click()}
                    disabled={uploadingName}
                    className="flex items-center gap-2 px-3 py-1.5 text-xs text-gray-500 border border-gray-200 rounded-lg hover:border-primary hover:text-primary transition-colors"
                  >
                    <Upload size={14} />
                    {uploadingName ? 'Upload...' : 'Ou utiliser une image'}
                  </button>
                </div>
              </div>
            )}

            {/* Logo */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Logo</label>
              <div className="flex items-center gap-4">
                {settings.brandLogoUrl && (
                  <img
                    src={settings.brandLogoUrl}
                    alt="Brand logo"
                    className="w-16 h-16 object-contain border border-gray-200 rounded-lg bg-white p-1"
                  />
                )}
                <div className="flex-1">
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/png,image/jpeg,image/svg+xml,image/webp"
                    onChange={handleLogoUpload}
                    className="hidden"
                  />
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploading}
                    className="flex items-center gap-2 px-4 py-2 border-2 border-dashed border-gray-300 rounded-lg hover:border-primary hover:bg-primary/5 transition-colors text-sm text-gray-600"
                  >
                    <Upload size={18} />
                    {uploading ? 'Upload en cours...' : settings.brandLogoUrl ? 'Changer le logo' : 'Choisir un fichier'}
                  </button>
                  <p className="text-xs text-gray-400 mt-1">PNG, JPG, SVG ou WebP (max 5 Mo)</p>
                </div>
              </div>
            </div>

            {/* Slogan */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Slogan</label>
              <input
                type="text"
                value={settings.brandSlogan}
                onChange={(e) => setSettings({ ...settings, brandSlogan: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                placeholder="Votre slogan (affiche sur l'overlay intro)"
              />
              <p className="text-xs text-gray-400 mt-1">Affiche sous le brand name sur l'ecran d'intro</p>
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

      {/* AI Code Generation */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Sparkles size={20} className="text-purple-600" />
            <CardTitle>AI Code Generation</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Anthropic API Key</label>
              <input
                type="password"
                value={settings.anthropicApiKey}
                onChange={(e) => setSettings({ ...settings, anthropicApiKey: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg font-mono"
                placeholder="sk-ant-..."
              />
              <p className="text-xs text-gray-400 mt-1">
                Obtenez votre cle sur console.anthropic.com
              </p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Model</label>
              <select
                value={settings.aiModel}
                onChange={(e) => setSettings({ ...settings, aiModel: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg"
              >
                <option value="claude-sonnet-4-20250514">Claude Sonnet 4 (recommande)</option>
                <option value="claude-opus-4-20250514">Claude Opus 4 (plus puissant)</option>
                <option value="claude-haiku-4-20250514">Claude Haiku 4 (plus rapide)</option>
              </select>
            </div>
            <div>
              <button
                type="button"
                onClick={async () => {
                  setAiTesting(true)
                  setAiTestResult(null)
                  try {
                    const response = await fetch('/api/ai/test', { method: 'POST' })
                    const data = await response.json()
                    setAiTestResult(data)
                  } catch {
                    setAiTestResult({ status: 'error', message: 'Impossible de contacter le serveur.' })
                  }
                  setAiTesting(false)
                }}
                disabled={aiTesting || !settings.anthropicApiKey}
                className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-purple-600 rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {aiTesting ? <Loader2 size={16} className="animate-spin" /> : <Sparkles size={16} />}
                {aiTesting ? 'Test en cours...' : 'Tester la connexion'}
              </button>
              {aiTestResult && (
                <div className={`mt-3 flex items-center gap-2 text-sm ${
                  aiTestResult.status === 'ok' ? 'text-green-600' :
                  aiTestResult.status === 'no_credits' ? 'text-amber-600' :
                  'text-red-500'
                }`}>
                  {aiTestResult.status === 'ok' ? <CheckCircle size={16} /> : <XCircle size={16} />}
                  {aiTestResult.message}
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* AI Music Generation */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Music size={20} className="text-pink-500" />
            <CardTitle>AI Music Generation</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Fal.ai API Key</label>
              <input
                type="password"
                value={settings.falApiKey}
                onChange={(e) => setSettings({ ...settings, falApiKey: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg font-mono"
                placeholder="votre-cle-fal-ai..."
              />
              <p className="text-xs text-gray-400 mt-1">
                Obtenez votre cle sur fal.ai/dashboard/keys
              </p>
            </div>
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h4 className="text-sm font-semibold text-blue-900 mb-2">Comment obtenir votre cle ?</h4>
              <ol className="text-xs text-blue-800 space-y-1 list-decimal list-inside">
                <li>Allez sur <a href="https://fal.ai" target="_blank" rel="noopener noreferrer" className="underline font-medium">fal.ai</a> et creez un compte</li>
                <li>Allez dans Dashboard &gt; Keys</li>
                <li>Creez une nouvelle API Key</li>
                <li>Collez-la ci-dessus et sauvegardez</li>
              </ol>
              <p className="text-xs text-blue-700 mt-2">
                Generez ensuite vos musiques dans Library &gt; Music Tracks &gt; "Generer avec IA"
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Instagram API */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Instagram size={20} className="text-pink-600" />
            <CardTitle>Instagram API</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* Guide */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h4 className="text-sm font-semibold text-blue-900 mb-2">Comment obtenir votre Access Token ?</h4>
              <ol className="text-xs text-blue-800 space-y-1 list-decimal list-inside">
                <li>Allez sur <a href="https://developers.facebook.com" target="_blank" rel="noopener noreferrer" className="underline font-medium">developers.facebook.com</a> et creez une application (type Business)</li>
                <li>Ajoutez le produit "Instagram Graph API"</li>
                <li>Dans Outils &gt; <a href="https://developers.facebook.com/tools/explorer/" target="_blank" rel="noopener noreferrer" className="underline font-medium">Explorateur de l'API Graph</a>, selectionnez votre app</li>
                <li>Ajoutez les permissions : <code className="bg-blue-100 px-1 rounded">pages_show_list</code>, <code className="bg-blue-100 px-1 rounded">instagram_basic</code>, <code className="bg-blue-100 px-1 rounded">instagram_content_publish</code></li>
                <li>Cliquez "Generate Access Token" et autorisez</li>
                <li>Collez le token ci-dessous et cliquez "Recuperer les comptes"</li>
              </ol>
            </div>

            {/* Access Token */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Access Token</label>
              <input
                type="password"
                value={settings.igAccessToken}
                onChange={(e) => { setSettings({ ...settings, igAccessToken: e.target.value }); setIgFetchResult(null); setIgAccounts([]) }}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg font-mono text-sm"
                placeholder="Collez votre token ici..."
              />
            </div>

            {/* Fetch button */}
            <div>
              <button
                type="button"
                onClick={async () => {
                  setIgFetching(true)
                  setIgFetchResult(null)
                  setIgAccounts([])
                  try {
                    const response = await fetch('/api/settings/ig-fetch', {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({ accessToken: settings.igAccessToken }),
                    })
                    const data = await response.json()
                    if (data.status === 'ok' && data.accounts) {
                      setIgAccounts(data.accounts)
                      if (data.accounts.length === 1) {
                        setSettings(prev => ({
                          ...prev,
                          igUserId: data.accounts[0].igUserId,
                          igPageId: data.accounts[0].pageId,
                        }))
                        setIgFetchResult({ status: 'ok', message: `Compte @${data.accounts[0].igUsername || data.accounts[0].igUserId} recupere !` })
                      } else {
                        setIgFetchResult({ status: 'ok', message: `${data.accounts.length} comptes trouves. Selectionnez celui a utiliser.` })
                      }
                    } else {
                      setIgFetchResult(data)
                    }
                  } catch {
                    setIgFetchResult({ status: 'error', message: 'Impossible de contacter le serveur.' })
                  }
                  setIgFetching(false)
                }}
                disabled={igFetching || !settings.igAccessToken}
                className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-pink-600 rounded-lg hover:bg-pink-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {igFetching ? <Loader2 size={16} className="animate-spin" /> : <Download size={16} />}
                {igFetching ? 'Recuperation...' : 'Recuperer les comptes'}
              </button>
              {igFetchResult && (
                <div className={`mt-3 flex items-center gap-2 text-sm ${
                  igFetchResult.status === 'ok' ? 'text-green-600' :
                  igFetchResult.status === 'no_ig' || igFetchResult.status === 'no_pages' ? 'text-amber-600' :
                  'text-red-500'
                }`}>
                  {igFetchResult.status === 'ok' ? <CheckCircle size={16} /> : <XCircle size={16} />}
                  {igFetchResult.message}
                </div>
              )}
            </div>

            {/* Account selection (if multiple) */}
            {igAccounts.length > 1 && (
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">Selectionnez un compte</label>
                {igAccounts.map((account) => (
                  <button
                    key={account.igUserId}
                    type="button"
                    onClick={() => {
                      setSettings(prev => ({ ...prev, igUserId: account.igUserId, igPageId: account.pageId }))
                      setIgFetchResult({ status: 'ok', message: `Compte @${account.igUsername || account.igUserId} selectionne !` })
                    }}
                    className={`w-full flex items-center gap-3 p-3 border-2 rounded-lg transition-all text-left ${
                      settings.igUserId === account.igUserId
                        ? 'border-pink-500 bg-pink-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    {account.igProfilePic && (
                      <img src={account.igProfilePic} alt="" className="w-10 h-10 rounded-full" />
                    )}
                    <div>
                      <div className="text-sm font-medium">{account.igUsername ? `@${account.igUsername}` : `IG ${account.igUserId}`}</div>
                      <div className="text-xs text-gray-500">Page: {account.pageName} ({account.pageId})</div>
                    </div>
                    {settings.igUserId === account.igUserId && (
                      <CheckCircle size={18} className="ml-auto text-pink-600" />
                    )}
                  </button>
                ))}
              </div>
            )}

            {/* Manual fields (read-only when fetched, editable otherwise) */}
            <div className="border-t pt-4 mt-4">
              <h4 className="text-xs font-semibold text-gray-500 uppercase mb-3">Credentials actuels</h4>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">IG User ID</label>
                  <input
                    type="text"
                    value={settings.igUserId}
                    onChange={(e) => setSettings({ ...settings, igUserId: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg font-mono text-sm"
                    placeholder="Non configure"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">Page ID</label>
                  <input
                    type="text"
                    value={settings.igPageId}
                    onChange={(e) => setSettings({ ...settings, igPageId: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg font-mono text-sm"
                    placeholder="Non configure"
                  />
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
