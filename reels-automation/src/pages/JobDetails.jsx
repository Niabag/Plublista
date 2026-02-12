import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Play, Download, Share2, ArrowLeft, CheckCircle, XCircle, Clock, RotateCcw, Loader2, Zap, Sparkles, Copy, Check } from 'lucide-react'
import Card, { CardHeader, CardContent, CardTitle } from '../components/Card'
import Button from '../components/Button'

export default function JobDetails() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [job, setJob] = useState(null)
  const [logs, setLogs] = useState([])
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    fetchJobDetails()
    const interval = setInterval(fetchJobDetails, 2000)
    return () => clearInterval(interval)
  }, [id])

  const fetchJobDetails = async () => {
    try {
      const response = await fetch(`/api/jobs/${id}`)
      if (!response.ok) {
        if (response.status === 404) {
          setJob({ status: 'lost', title: 'Job introuvable', timeline: [], logs: [] })
        }
        return
      }
      const data = await response.json()
      setJob(data)
      setLogs(data.logs || [])
    } catch (error) {
      console.error('Failed to fetch job details:', error)
    }
  }

  const handleDownload = () => {
    if (job.videoUrl) {
      const link = document.createElement('a')
      link.href = job.videoUrl
      link.download = `job-${job.id}.mp4`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
    }
  }

  const handlePublish = async (jobId) => {
    if (!confirm('Êtes-vous sûr de vouloir publier cette vidéo sur Instagram maintenant?')) {
      return
    }

    try {
      const response = await fetch(`/api/jobs/${jobId}/publish`, {
        method: 'POST',
      })
      
      if (response.ok) {
        alert('✅ Publication démarrée!')
        fetchJobDetails()
      } else {
        const error = await response.json()
        alert(`❌ Erreur: ${error.error}`)
      }
    } catch (error) {
      alert(`❌ Erreur: ${error.message}`)
    }
  }

  const handleCopyDescription = async () => {
    if (!job?.description) return
    try {
      await navigator.clipboard.writeText(job.description)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      // Fallback for older browsers
      const textarea = document.createElement('textarea')
      textarea.value = job.description
      document.body.appendChild(textarea)
      textarea.select()
      document.execCommand('copy')
      document.body.removeChild(textarea)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  const handleRetry = async () => {
    try {
      const response = await fetch(`/api/jobs/${id}/retry`, { method: 'POST' })
      if (response.ok) {
        fetchJobDetails()
      } else {
        const error = await response.json()
        alert(`Erreur: ${error.error}`)
      }
    } catch (error) {
      alert(`Erreur: ${error.message}`)
    }
  }

  if (!job) {
    return <div className="text-center py-12">Loading...</div>
  }

  const getStepIcon = (status) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="text-green-400" size={22} />
      case 'failed':
        return <XCircle className="text-red-500" size={22} />
      case 'running':
        return <Loader2 className="text-blue-400 animate-spin" size={22} />
      default:
        return <div className="w-[22px] h-[22px] rounded-full border-2 border-gray-600" />
    }
  }

  const completedSteps = job?.timeline?.filter(s => s.status === 'completed').length || 0
  const totalSteps = job?.timeline?.length || 1
  const progressPercent = Math.round((completedSteps / totalSteps) * 100)
  const isProcessing = job?.status === 'processing'
  const runningStepIndex = job?.timeline?.findIndex(s => s.status === 'running') ?? -1

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <Button variant="outline" onClick={() => navigate('/')} className="mb-4">
          <ArrowLeft size={16} className="mr-2" />
          Back to Dashboard
        </Button>
        <div className="flex items-center gap-4">
          <h1 className="text-3xl font-bold text-gray-900">{job.title}</h1>
          {job.status === 'failed' && (
            <Button onClick={handleRetry}>
              <RotateCcw size={16} className="mr-2" />
              Relancer
            </Button>
          )}
        </div>
        <p className="text-gray-500 mt-1">
          Created {new Date(job.createdAt).toLocaleString()}
        </p>
      </div>

      <div className="grid grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="col-span-2 space-y-6">
          {/* Video Preview */}
          {job.videoUrl && (
            <Card>
              <CardHeader>
                <CardTitle>Preview</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="bg-black rounded-lg overflow-hidden aspect-[9/16] max-w-sm mx-auto">
                  <video src={job.videoUrl} controls className="w-full h-full" />
                </div>
                <div className="flex gap-2 mt-4 justify-center">
                  <Button variant="outline" onClick={handleDownload}>
                    <Download size={16} className="mr-2" />
                    Télécharger
                  </Button>
                  {job.status === 'completed' && job.publishStatus !== 'published' && (
                    <Button onClick={() => handlePublish(job.id)}>
                      <Share2 size={16} className="mr-2" />
                      {job.publishStatus === 'scheduled' ? 'Publier maintenant' : 'Publier sur Instagram'}
                    </Button>
                  )}
                  {job.publishStatus === 'published' && (
                    <div className="text-green-600 flex items-center gap-2">
                      <CheckCircle size={16} />
                      Publié le {new Date(job.publishedAt).toLocaleString('fr-FR')}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Instagram Description */}
          {job.description && (
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Description Instagram</CardTitle>
                  <button
                    onClick={handleCopyDescription}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                      copied
                        ? 'bg-green-100 text-green-700'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    {copied ? <Check size={14} /> : <Copy size={14} />}
                    {copied ? 'Copié !' : 'Copier'}
                  </button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="bg-gradient-to-br from-purple-50 to-pink-50 border border-purple-100 rounded-lg p-4 whitespace-pre-wrap text-sm text-gray-800 leading-relaxed">
                  {job.description}
                </div>
              </CardContent>
            </Card>
          )}
          {job.status === 'completed' && !job.description && (
            <Card>
              <CardContent className="py-4">
                <div className="flex items-center gap-2 text-sm text-gray-500">
                  <Loader2 size={14} className="animate-spin" />
                  Génération de la description Instagram...
                </div>
              </CardContent>
            </Card>
          )}

          {/* Timeline */}
          <Card className="overflow-hidden">
            <CardHeader className="bg-gradient-to-r from-gray-900 to-gray-800 text-white pb-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {isProcessing && <Zap size={20} className="text-yellow-400 animate-pulse" />}
                  <CardTitle className="text-white">
                    {job.status === 'completed' ? 'Pipeline terminé' : job.status === 'failed' ? 'Pipeline échoué' : isProcessing ? 'Pipeline en cours...' : 'Pipeline'}
                  </CardTitle>
                </div>
                <span className="text-2xl font-bold text-white tabular-nums">
                  {progressPercent}%
                </span>
              </div>
              {/* Progress bar */}
              <div className="mt-3 h-2 bg-gray-700 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-1000 ease-out ${
                    job.status === 'failed' ? 'bg-red-500' :
                    progressPercent === 100 ? 'bg-green-400' :
                    'bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500'
                  }`}
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
              {isProcessing && runningStepIndex >= 0 && (
                <p className="mt-2 text-sm text-gray-300 flex items-center gap-1.5">
                  <Loader2 size={14} className="animate-spin" />
                  {job.timeline[runningStepIndex].name}...
                </p>
              )}
            </CardHeader>
            <CardContent className="p-0">
              <div className="relative">
                {job.timeline?.map((step, index) => {
                  const isRunning = step.status === 'running'
                  const isCompleted = step.status === 'completed'
                  const isFailed = step.status === 'failed'
                  const isPending = !isRunning && !isCompleted && !isFailed
                  const isLast = index === job.timeline.length - 1

                  return (
                    <div
                      key={index}
                      className={`relative flex items-center gap-4 px-5 py-3.5 transition-all duration-500 ${
                        isRunning ? 'bg-blue-50 border-l-4 border-l-blue-500' :
                        isCompleted ? 'bg-white border-l-4 border-l-green-400' :
                        isFailed ? 'bg-red-50 border-l-4 border-l-red-500' :
                        'bg-gray-50 border-l-4 border-l-gray-200'
                      } ${!isLast ? 'border-b border-gray-100' : ''}`}
                    >
                      {/* Icon */}
                      <div className={`relative z-10 flex-shrink-0 ${isRunning ? 'scale-110' : ''} transition-transform duration-300`}>
                        {getStepIcon(step.status)}
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <h4 className={`font-semibold text-sm ${
                            isRunning ? 'text-blue-700' :
                            isCompleted ? 'text-gray-800' :
                            isFailed ? 'text-red-700' :
                            'text-gray-400'
                          }`}>
                            {step.name}
                          </h4>
                          {isCompleted && step.duration > 0 && (
                            <span className="text-xs font-mono text-green-600 bg-green-50 px-2 py-0.5 rounded-full">
                              {step.duration}s
                            </span>
                          )}
                          {isFailed && (
                            <span className="text-xs font-mono text-red-600 bg-red-100 px-2 py-0.5 rounded-full">
                              échoué
                            </span>
                          )}
                        </div>
                        {isRunning && (
                          <div className="mt-1.5">
                            <div className="h-1.5 bg-blue-100 rounded-full overflow-hidden">
                              <div className="h-full bg-gradient-to-r from-blue-400 to-blue-600 rounded-full animate-timeline-progress" />
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Step number */}
                      <div className={`flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                        isCompleted ? 'bg-green-100 text-green-600' :
                        isRunning ? 'bg-blue-100 text-blue-600' :
                        isFailed ? 'bg-red-100 text-red-600' :
                        'bg-gray-100 text-gray-400'
                      }`}>
                        {index + 1}
                      </div>
                    </div>
                  )
                })}
              </div>

              {/* Footer */}
              {job.status === 'completed' && (
                <div className="px-5 py-3 bg-gradient-to-r from-green-50 to-emerald-50 border-t border-green-100 flex items-center gap-2">
                  <Sparkles size={16} className="text-green-500" />
                  <span className="text-sm font-medium text-green-700">Vidéo prête !</span>
                </div>
              )}
            </CardContent>
          </Card>

          {/* CSS for progress animation */}
          <style>{`
            @keyframes timeline-progress {
              0% { width: 5%; }
              50% { width: 80%; }
              100% { width: 5%; }
            }
            .animate-timeline-progress {
              animation: timeline-progress 2s ease-in-out infinite;
            }
          `}</style>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Job Info */}
          <Card>
            <CardHeader>
              <CardTitle>Informations</CardTitle>
            </CardHeader>
            <CardContent>
              <dl className="space-y-3 text-sm">
                <div>
                  <dt className="text-gray-500">Statut</dt>
                  <dd className="font-medium text-gray-900">{job.status}</dd>
                </div>
                {job.publishStatus && (
                  <div>
                    <dt className="text-gray-500">Publication</dt>
                    <dd className="font-medium text-gray-900">
                      {job.publishStatus === 'scheduled' && '📅 Planifiée'}
                      {job.publishStatus === 'published' && '✅ Publiée'}
                      {job.publishStatus === 'draft' && '📝 Brouillon'}
                      {job.publishStatus === 'publishing' && '⏳ En cours...'}
                    </dd>
                  </div>
                )}
                {job.scheduledFor && (
                  <div>
                    <dt className="text-gray-500">Date planifiée</dt>
                    <dd className="font-medium text-gray-900">
                      {new Date(job.scheduledFor).toLocaleString('fr-FR', {
                        weekday: 'long',
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </dd>
                  </div>
                )}
                <div>
                  <dt className="text-gray-500">Durée</dt>
                  <dd className="font-medium text-gray-900">{job.duration}s</dd>
                </div>
                <div>
                  <dt className="text-gray-500">Musique</dt>
                  <dd className="font-medium text-gray-900">{job.musicStyle}</dd>
                </div>
                <div>
                  <dt className="text-gray-500">Hashtags</dt>
                  <dd className="font-medium text-gray-900">{job.hashtags}</dd>
                </div>
              </dl>
            </CardContent>
          </Card>

          {/* Logs */}
          <Card>
            <CardHeader>
              <CardTitle>Logs</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="bg-gray-900 text-gray-100 p-3 rounded text-xs font-mono h-64 overflow-y-auto">
                {logs.map((log, index) => (
                  <div key={index} className="mb-1">
                    <span className="text-gray-500">[{log.timestamp}]</span> {log.message}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
