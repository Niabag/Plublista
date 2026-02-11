import { useState, useEffect, useRef, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { Upload, Code, FileText, CheckCircle, Sparkles, Loader2, ImageIcon, Eye, EyeOff } from 'lucide-react'
import Card, { CardHeader, CardContent, CardTitle } from '../components/Card'
import Button from '../components/Button'

export default function CreateWizard() {
  const navigate = useNavigate()
  const [step, setStep] = useState(1)
  const [musicTracks, setMusicTracks] = useState([])

  useEffect(() => {
    fetch('/api/library/music')
      .then(res => res.json())
      .then(data => setMusicTracks(data))
      .catch(err => console.error('Failed to load music:', err))
  }, [])

  const [aiPrompt, setAiPrompt] = useState('')
  const [aiReferenceImage, setAiReferenceImage] = useState(null)
  const [aiImagePreview, setAiImagePreview] = useState(null)
  const [aiGenerating, setAiGenerating] = useState(false)
  const [aiError, setAiError] = useState('')
  const [aiConfigured, setAiConfigured] = useState(false)
  const [showPreview, setShowPreview] = useState(true)
  const previewRef = useRef(null)
  const aiFileInputRef = useRef(null)

  useEffect(() => {
    fetch('/api/ai/status')
      .then(res => res.json())
      .then(data => setAiConfigured(data.configured))
      .catch(() => setAiConfigured(false))
  }, [])

  const handleAiImageSelect = (e) => {
    const file = e.target.files[0]
    if (!file) return
    setAiReferenceImage(file)
    const reader = new FileReader()
    reader.onload = (ev) => setAiImagePreview(ev.target.result)
    reader.readAsDataURL(file)
  }

  const handleAiGenerate = async () => {
    setAiGenerating(true)
    setAiError('')
    try {
      const body = new FormData()
      body.append('prompt', aiPrompt)
      if (aiReferenceImage) {
        body.append('referenceImage', aiReferenceImage)
      }
      const response = await fetch('/api/ai/generate', { method: 'POST', body })
      const data = await response.json()
      if (!response.ok) throw new Error(data.error || 'Generation failed')
      setFormData(prev => ({
        ...prev,
        code: data.code,
        title: data.title || prev.title,
        introTitle: data.introTitle || prev.introTitle,
        hashtags: data.hashtags || prev.hashtags,
      }))
    } catch (error) {
      setAiError(error.message)
    } finally {
      setAiGenerating(false)
    }
  }

  const [formData, setFormData] = useState({
    inputMode: 'paste',
    code: '',
    title: '',
    introTitle: '',
    hashtags: '',
    musicStyle: '/assets/music/tech-energy.mp3',
    targetDuration: 45,
    brandOverlay: true,
    scheduleEnabled: false,
    scheduleDate: '',
    scheduleTime: '',
  })

  const previewUrl = useMemo(() => {
    if (!formData.code) return null
    const blob = new Blob([formData.code], { type: 'text/html' })
    return URL.createObjectURL(blob)
  }, [formData.code])

  useEffect(() => {
    return () => { if (previewUrl) URL.revokeObjectURL(previewUrl) }
  }, [previewUrl])

  const handleSubmit = async () => {
    try {
      const response = await fetch('/api/jobs/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })
      const data = await response.json()
      navigate(`/job/${data.id}`)
    } catch (error) {
      console.error('Failed to create job:', error)
    }
  }

  const renderStep = () => {
    switch (step) {
      case 1:
        return (
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Input Mode</label>
              <div className="grid grid-cols-4 gap-4">
                {[
                  { value: 'paste', icon: FileText, label: 'Paste Code' },
                  { value: 'upload', icon: Upload, label: 'Upload File' },
                  { value: 'library', icon: Code, label: 'From Library' },
                  { value: 'generate', icon: Sparkles, label: 'AI Generate' },
                ].map((mode) => {
                  const Icon = mode.icon
                  return (
                    <button
                      key={mode.value}
                      onClick={() => setFormData({ ...formData, inputMode: mode.value })}
                      className={`p-6 border-2 rounded-lg transition-all ${
                        formData.inputMode === mode.value
                          ? 'border-primary bg-primary/5'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <Icon size={32} className="mx-auto mb-2" />
                      <div className="text-sm font-medium">{mode.label}</div>
                    </button>
                  )
                })}
              </div>
            </div>

            {formData.inputMode === 'paste' && (
              <div className="space-y-3">
                {formData.code && (
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <label className="block text-sm font-medium text-gray-700">Apercu</label>
                      <button
                        type="button"
                        onClick={() => setShowPreview(!showPreview)}
                        className="flex items-center gap-1 text-xs text-gray-500 hover:text-gray-700"
                      >
                        {showPreview ? <EyeOff size={14} /> : <Eye size={14} />}
                        {showPreview ? 'Masquer' : 'Afficher'}
                      </button>
                    </div>
                    {showPreview && (
                      <div className="border border-gray-300 rounded-lg overflow-hidden bg-black relative" style={{ width: 225, height: 400 }}>
                        <iframe
                          src={previewUrl}
                          title="Preview"
                          sandbox="allow-scripts allow-same-origin"
                          style={{ width: '1080px', height: '1920px', transform: 'scale(0.2083)', transformOrigin: 'top left', position: 'absolute', top: 0, left: 0, border: 'none' }}
                        />
                      </div>
                    )}
                  </div>
                )}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Code Snippet</label>
                  <textarea
                    value={formData.code}
                    onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                    className="w-full h-64 px-4 py-3 border border-gray-300 rounded-lg font-mono text-sm"
                    placeholder="Paste your code here..."
                  />
                </div>
              </div>
            )}

            {formData.inputMode === 'generate' && (
              <div className="space-y-4">
                {!aiConfigured && (
                  <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
                    <p className="text-sm text-amber-800">
                      Cle API Anthropic non configuree. Allez dans Settings pour ajouter votre cle.
                    </p>
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Decrivez ce que vous voulez creer
                  </label>
                  <textarea
                    value={aiPrompt}
                    onChange={(e) => setAiPrompt(e.target.value)}
                    className="w-full h-32 px-4 py-3 border border-gray-300 rounded-lg text-sm"
                    placeholder="Exemple : Une animation neon avec le texte 'Hello World' sur fond sombre avec des particules..."
                    disabled={aiGenerating}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Image de reference (optionnel)
                  </label>
                  <div className="flex items-center gap-4">
                    <input
                      ref={aiFileInputRef}
                      type="file"
                      accept="image/png,image/jpeg,image/gif,image/webp"
                      onChange={handleAiImageSelect}
                      className="hidden"
                    />
                    <button
                      type="button"
                      onClick={() => aiFileInputRef.current?.click()}
                      disabled={aiGenerating}
                      className="flex items-center gap-2 px-4 py-2 border-2 border-dashed border-gray-300 rounded-lg hover:border-purple-400 hover:bg-purple-50 transition-colors text-sm text-gray-600"
                    >
                      <ImageIcon size={18} />
                      {aiReferenceImage ? aiReferenceImage.name : 'Choisir une image'}
                    </button>
                    {aiImagePreview && (
                      <div className="relative">
                        <img src={aiImagePreview} alt="Reference" className="h-16 w-16 object-cover rounded-lg border" />
                        <button
                          type="button"
                          onClick={() => { setAiReferenceImage(null); setAiImagePreview(null) }}
                          className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs"
                        >
                          x
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleAiGenerate}
                  disabled={aiGenerating || !aiPrompt.trim() || !aiConfigured}
                  className="flex items-center gap-2 px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium"
                >
                  {aiGenerating ? (
                    <>
                      <Loader2 size={20} className="animate-spin" />
                      Generation en cours...
                    </>
                  ) : (
                    <>
                      <Sparkles size={20} />
                      Generer le code
                    </>
                  )}
                </button>

                {aiError && (
                  <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                    <p className="text-sm text-red-800">{aiError}</p>
                  </div>
                )}

                {formData.code && (
                  <>
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <label className="block text-sm font-medium text-gray-700">Apercu du rendu</label>
                        <button
                          type="button"
                          onClick={() => setShowPreview(!showPreview)}
                          className="flex items-center gap-1 text-xs text-gray-500 hover:text-gray-700"
                        >
                          {showPreview ? <EyeOff size={14} /> : <Eye size={14} />}
                          {showPreview ? 'Masquer' : 'Afficher'}
                        </button>
                      </div>
                      {showPreview && (
                        <div className="border border-gray-300 rounded-lg overflow-hidden bg-black relative" style={{ width: 225, height: 400 }}>
                          <iframe
                            srcDoc={formData.code}
                            title="Preview"
                            sandbox="allow-scripts allow-same-origin"
                            style={{ width: '1080px', height: '1920px', transform: 'scale(0.2083)', transformOrigin: 'top left', position: 'absolute', top: 0, left: 0, border: 'none' }}
                          />
                        </div>
                      )}
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Code genere (modifiable)
                      </label>
                      <textarea
                        value={formData.code}
                        onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                        className="w-full h-64 px-4 py-3 border border-gray-300 rounded-lg font-mono text-sm"
                      />
                    </div>
                  </>
                )}
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Title</label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                  placeholder="Amazing CSS Effect"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Intro Title</label>
                <input
                  type="text"
                  value={formData.introTitle}
                  onChange={(e) => setFormData({ ...formData, introTitle: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                  placeholder="Balle Rouge"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Hashtags</label>
                <input
                  type="text"
                  value={formData.hashtags}
                  onChange={(e) => setFormData({ ...formData, hashtags: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                  placeholder="#webdev #coding #css"
                />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Music Style</label>
                <select
                  value={formData.musicStyle}
                  onChange={(e) => setFormData({ ...formData, musicStyle: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                >
                  {Object.entries(
                    musicTracks.reduce((acc, t) => {
                      ;(acc[t.mood] = acc[t.mood] || []).push(t)
                      return acc
                    }, {})
                  ).map(([mood, tracks]) => (
                    <optgroup key={mood} label={mood}>
                      {tracks.map((t) => (
                        <option key={t.id} value={t.url}>
                          {t.title} ({t.bpm} BPM)
                        </option>
                      ))}
                    </optgroup>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Target Duration (s)
                </label>
                <input
                  type="number"
                  value={formData.targetDuration}
                  onChange={(e) => setFormData({ ...formData, targetDuration: parseInt(e.target.value) })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                  min="35"
                  max="60"
                />
              </div>
              <div className="flex items-end">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.brandOverlay}
                    onChange={(e) => setFormData({ ...formData, brandOverlay: e.target.checked })}
                    className="w-5 h-5 text-primary"
                  />
                  <span className="text-sm font-medium text-gray-700">Brand Overlay</span>
                </label>
              </div>
            </div>

            {/* Schedule Section */}
            <div className="border-t pt-6 mt-6">
              <div className="mb-4">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.scheduleEnabled}
                    onChange={(e) => setFormData({ ...formData, scheduleEnabled: e.target.checked })}
                    className="w-5 h-5 text-primary"
                  />
                  <span className="text-sm font-medium text-gray-700">📅 Planifier la publication</span>
                </label>
              </div>

              {formData.scheduleEnabled && (
                <div className="grid grid-cols-2 gap-4 ml-7">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Date de publication
                    </label>
                    <input
                      type="date"
                      value={formData.scheduleDate}
                      onChange={(e) => setFormData({ ...formData, scheduleDate: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                      min={new Date().toISOString().split('T')[0]}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Heure de publication
                    </label>
                    <input
                      type="time"
                      value={formData.scheduleTime}
                      onChange={(e) => setFormData({ ...formData, scheduleTime: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                    />
                  </div>
                  {formData.scheduleDate && formData.scheduleTime && (
                    <div className="col-span-2">
                      <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                        <p className="text-sm text-blue-800">
                          📅 Publication prévue le{' '}
                          <strong>
                            {new Date(formData.scheduleDate + 'T' + formData.scheduleTime).toLocaleString('fr-FR', {
                              weekday: 'long',
                              year: 'numeric',
                              month: 'long',
                              day: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </strong>
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        )

      case 2:
        return (
          <div className="text-center py-12">
            <CheckCircle size={64} className="text-green-500 mx-auto mb-4" />
            <h3 className="text-xl font-semibold mb-2">Validation Complete</h3>
            <p className="text-gray-500">Code validated successfully. Ready to record!</p>
          </div>
        )

      default:
        return null
    }
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <h1 className="text-3xl font-bold text-gray-900">Create New Reel</h1>

      {/* Steps */}
      <div className="flex items-center justify-center gap-4 mb-8">
        {[1, 2].map((s) => (
          <div key={s} className="flex items-center gap-2">
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center font-medium ${
                step >= s ? 'bg-primary text-white' : 'bg-gray-200 text-gray-500'
              }`}
            >
              {s}
            </div>
            <span className="text-sm font-medium text-gray-700">
              {s === 1 ? 'Code Input' : 'Validation'}
            </span>
            {s < 2 && <div className="w-16 h-0.5 bg-gray-300 ml-2" />}
          </div>
        ))}
      </div>

      <Card>
        <CardContent className="pt-6">{renderStep()}</CardContent>
      </Card>

      <div className="flex justify-between">
        <Button variant="outline" onClick={() => navigate('/')}>
          Cancel
        </Button>
        <div className="flex gap-2">
          {step > 1 && (
            <Button variant="outline" onClick={() => setStep(step - 1)}>
              Previous
            </Button>
          )}
          {step < 2 ? (
            <Button onClick={() => setStep(step + 1)}>Next</Button>
          ) : (
            <Button onClick={handleSubmit}>Start Recording</Button>
          )}
        </div>
      </div>
    </div>
  )
}
