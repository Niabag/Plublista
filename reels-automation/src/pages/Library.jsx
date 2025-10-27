import { useState, useEffect } from 'react'
import { Search, Music, Code2, Image } from 'lucide-react'
import Card, { CardHeader, CardContent, CardTitle } from '../components/Card'
import Button from '../components/Button'

export default function Library() {
  const [activeTab, setActiveTab] = useState('snippets')
  const [searchQuery, setSearchQuery] = useState('')
  const [snippets, setSnippets] = useState([])
  const [music, setMusic] = useState([])

  useEffect(() => {
    fetchLibraryItems()
  }, [activeTab])

  const fetchLibraryItems = async () => {
    try {
      const response = await fetch(`/api/library/${activeTab}`)
      const data = await response.json()
      if (activeTab === 'snippets') setSnippets(data)
      else if (activeTab === 'music') setMusic(data)
    } catch (error) {
      console.error('Failed to fetch library items:', error)
    }
  }

  const tabs = [
    { id: 'snippets', icon: Code2, label: 'Code Snippets' },
    { id: 'music', icon: Music, label: 'Music Tracks' },
    { id: 'templates', icon: Image, label: 'Templates' },
  ]

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-gray-900">Library</h1>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-gray-200">
        {tabs.map((tab) => {
          const Icon = tab.icon
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-3 border-b-2 transition-colors ${
                activeTab === tab.id
                  ? 'border-primary text-primary'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              <Icon size={20} />
              <span className="font-medium">{tab.label}</span>
            </button>
          )
        })}
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder={`Search ${activeTab}...`}
          className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-lg"
        />
      </div>

      {/* Content */}
      {activeTab === 'snippets' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {snippets.map((snippet) => (
            <Card key={snippet.id} className="hover:shadow-md transition-shadow cursor-pointer">
              <CardContent className="pt-6">
                <h3 className="font-semibold text-gray-900 mb-2">{snippet.title}</h3>
                <div className="flex flex-wrap gap-2 mb-3">
                  {snippet.tags.map((tag) => (
                    <span
                      key={tag}
                      className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
                <pre className="bg-gray-900 text-gray-100 p-3 rounded text-xs overflow-hidden">
                  <code>{snippet.preview}</code>
                </pre>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {activeTab === 'music' && (
        <div className="space-y-3">
          {music.map((track) => (
            <Card key={track.id} className="hover:shadow-md transition-shadow">
              <CardContent className="flex items-center gap-4 py-4">
                <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-500 rounded flex items-center justify-center">
                  <Music className="text-white" size={24} />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-gray-900">{track.title}</h3>
                  <p className="text-sm text-gray-500">
                    {track.bpm} BPM • {track.mood} • {track.duration}s
                  </p>
                </div>
                <Button variant="outline" size="sm">
                  Preview
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
