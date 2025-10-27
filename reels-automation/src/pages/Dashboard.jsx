import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { PlusCircle, Play, Clock, CheckCircle, XCircle } from 'lucide-react'
import Card, { CardHeader, CardContent, CardTitle } from '../components/Card'
import Button from '../components/Button'

export default function Dashboard() {
  const [queue, setQueue] = useState([])
  const [recentRuns, setRecentRuns] = useState([])

  useEffect(() => {
    // Fetch queue and recent runs from API
    fetchQueue()
    fetchRecentRuns()
  }, [])

  const fetchQueue = async () => {
    try {
      const response = await fetch('/api/queue')
      const data = await response.json()
      setQueue(data)
    } catch (error) {
      console.error('Failed to fetch queue:', error)
    }
  }

  const fetchRecentRuns = async () => {
    try {
      const response = await fetch('/api/jobs/recent')
      const data = await response.json()
      setRecentRuns(data)
    } catch (error) {
      console.error('Failed to fetch recent runs:', error)
    }
  }

  const getStatusIcon = (status) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="text-green-500" size={20} />
      case 'failed':
        return <XCircle className="text-red-500" size={20} />
      case 'processing':
        return <Play className="text-blue-500" size={20} />
      default:
        return <Clock className="text-gray-400" size={20} />
    }
  }

  const getStatusColor = (status) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800'
      case 'failed':
        return 'bg-red-100 text-red-800'
      case 'processing':
        return 'bg-blue-100 text-blue-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-500 mt-1">Manage your Instagram Reels automation</p>
        </div>
        <Link to="/create">
          <Button size="lg">
            <PlusCircle size={20} className="mr-2" />
            New Reel
          </Button>
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-gray-900">{queue.length}</div>
            <div className="text-sm text-gray-500">Queued</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-gray-900">
              {recentRuns.filter(r => r.status === 'processing').length}
            </div>
            <div className="text-sm text-gray-500">Processing</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-gray-900">
              {recentRuns.filter(r => r.status === 'completed').length}
            </div>
            <div className="text-sm text-gray-500">Completed</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-gray-900">
              {recentRuns.filter(r => r.status === 'failed').length}
            </div>
            <div className="text-sm text-gray-500">Failed</div>
          </CardContent>
        </Card>
      </div>

      {/* Queue */}
      <Card>
        <CardHeader>
          <CardTitle>Upcoming Posts</CardTitle>
        </CardHeader>
        <CardContent>
          {queue.length === 0 ? (
            <p className="text-gray-500 text-center py-8">No posts in queue</p>
          ) : (
            <div className="space-y-3">
              {queue.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <div className="flex-1">
                    <h4 className="font-medium text-gray-900">{item.title}</h4>
                    <p className="text-sm text-gray-500 mt-1">
                      {item.scheduledFor ? (
                        <>
                          📅 Planifié: {new Date(item.scheduledFor).toLocaleString('fr-FR', {
                            weekday: 'short',
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </>
                      ) : (
                        <>Créé: {new Date(item.createdAt).toLocaleString('fr-FR')}</>
                      )}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(item.status)}`}>
                      {item.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Recent Runs */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Runs</CardTitle>
        </CardHeader>
        <CardContent>
          {recentRuns.length === 0 ? (
            <p className="text-gray-500 text-center py-8">No recent runs</p>
          ) : (
            <div className="space-y-3">
              {recentRuns.map((run) => (
                <Link
                  key={run.id}
                  to={`/job/${run.id}`}
                  className="flex items-center gap-4 p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  {run.thumbnail && (
                    <img
                      src={run.thumbnail}
                      alt={run.title}
                      className="w-16 h-28 object-cover rounded"
                    />
                  )}
                  <div className="flex-1">
                    <h4 className="font-medium text-gray-900">{run.title}</h4>
                    <p className="text-sm text-gray-500 mt-1">
                      {run.duration}s • {new Date(run.createdAt).toLocaleString()}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    {getStatusIcon(run.status)}
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(run.status)}`}>
                      {run.status}
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
