import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Play, Download, Share2, ArrowLeft, CheckCircle, XCircle, Clock } from 'lucide-react'
import Card, { CardHeader, CardContent, CardTitle } from '../components/Card'
import Button from '../components/Button'

export default function JobDetails() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [job, setJob] = useState(null)
  const [logs, setLogs] = useState([])

  useEffect(() => {
    fetchJobDetails()
    const interval = setInterval(fetchJobDetails, 2000)
    return () => clearInterval(interval)
  }, [id])

  const fetchJobDetails = async () => {
    try {
      const response = await fetch(`/api/jobs/${id}`)
      const data = await response.json()
      setJob(data)
      setLogs(data.logs || [])
    } catch (error) {
      console.error('Failed to fetch job details:', error)
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

  if (!job) {
    return <div className="text-center py-12">Loading...</div>
  }

  const getStepIcon = (status) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="text-green-500" size={20} />
      case 'failed':
        return <XCircle className="text-red-500" size={20} />
      case 'running':
        return <Clock className="text-blue-500 animate-spin" size={20} />
      default:
        return <Clock className="text-gray-400" size={20} />
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <Button variant="outline" onClick={() => navigate('/')} className="mb-4">
          <ArrowLeft size={16} className="mr-2" />
          Back to Dashboard
        </Button>
        <h1 className="text-3xl font-bold text-gray-900">{job.title}</h1>
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
                  <Button variant="outline">
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

          {/* Timeline */}
          <Card>
            <CardHeader>
              <CardTitle>Processing Timeline</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {job.timeline?.map((step, index) => (
                  <div key={index} className="flex items-start gap-3">
                    <div className="mt-1">{getStepIcon(step.status)}</div>
                    <div className="flex-1">
                      <h4 className="font-medium text-gray-900">{step.name}</h4>
                      <p className="text-sm text-gray-500">
                        {step.duration ? `${step.duration}s` : 'In progress...'}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
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
