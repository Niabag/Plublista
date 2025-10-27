import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Upload, Code, FileText, CheckCircle } from 'lucide-react'
import Card, { CardHeader, CardContent, CardTitle } from '../components/Card'
import Button from '../components/Button'

export default function CreateWizard() {
  const navigate = useNavigate()
  const [step, setStep] = useState(1)
  const [formData, setFormData] = useState({
    inputMode: 'paste',
    code: '',
    title: '',
    hashtags: '',
    musicStyle: 'tech/energetic',
    targetDuration: 45,
    brandOverlay: true,
    scheduleEnabled: false,
    scheduleDate: '',
    scheduleTime: '',
  })

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
              <div className="grid grid-cols-3 gap-4">
                {[
                  { value: 'paste', icon: FileText, label: 'Paste Code' },
                  { value: 'upload', icon: Upload, label: 'Upload File' },
                  { value: 'library', icon: Code, label: 'From Library' },
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
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Code Snippet</label>
                <textarea
                  value={formData.code}
                  onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                  className="w-full h-64 px-4 py-3 border border-gray-300 rounded-lg font-mono text-sm"
                  placeholder="Paste your code here..."
                />
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
                  <option value="tech/energetic">Tech/Energetic</option>
                  <option value="chill">Chill</option>
                  <option value="upbeat">Upbeat</option>
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
