import { useState, useEffect, useRef } from 'react'
import { Search, Music, Code2, Image, Play, Square, Sparkles, Loader2, Trash2 } from 'lucide-react'
import Card, { CardHeader, CardContent, CardTitle } from '../components/Card'
import Button from '../components/Button'

export default function Library() {
  const [activeTab, setActiveTab] = useState('snippets')
  const [searchQuery, setSearchQuery] = useState('')
  const [snippets, setSnippets] = useState([])
  const [music, setMusic] = useState([])
  const [playingTrackId, setPlayingTrackId] = useState(null)
  const audioRef = useRef(null)

  // Music generation state
  const [falConfigured, setFalConfigured] = useState(false)
  const [genPresets, setGenPresets] = useState([])
  const [selectedGenPreset, setSelectedGenPreset] = useState(null)
  const [genCustomPrompt, setGenCustomPrompt] = useState('')
  const [genDuration, setGenDuration] = useState(60)
  const [genFilename, setGenFilename] = useState('')
  const [generating, setGenerating] = useState(false)
  const [genError, setGenError] = useState('')
  const [genSuccess, setGenSuccess] = useState('')
  const [showGenerator, setShowGenerator] = useState(false)
  const [presetSearch, setPresetSearch] = useState('')
  const [presetCategory, setPresetCategory] = useState('all')
  const [presetPage, setPresetPage] = useState(0)
  const PRESETS_PER_PAGE = 10

  const handlePlayPreview = (track) => {
    if (playingTrackId === track.id) {
      if (audioRef.current) {
        audioRef.current.pause()
        audioRef.current = null
      }
      setPlayingTrackId(null)
    } else {
      if (audioRef.current) {
        audioRef.current.pause()
      }
      const audio = new Audio(track.url)
      audio.volume = 1.0
      audio.onended = () => {
        setPlayingTrackId(null)
        audioRef.current = null
      }
      audio.onerror = () => {
        setPlayingTrackId(null)
        audioRef.current = null
      }
      audio.play()
      audioRef.current = audio
      setPlayingTrackId(track.id)
    }
  }

  useEffect(() => {
    fetchLibraryItems()
  }, [activeTab])

  useEffect(() => {
    if (activeTab === 'music') {
      fetch('/api/music/status')
        .then(res => res.json())
        .then(data => setFalConfigured(data.configured))
        .catch(() => setFalConfigured(false))
      fetch('/api/music/presets')
        .then(res => res.json())
        .then(data => setGenPresets(data))
        .catch(() => {})
    }
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

  const handleGenerate = async () => {
    const prompt = selectedGenPreset
      ? genPresets.find(p => p.id === selectedGenPreset)?.prompt
      : genCustomPrompt.trim()
    if (!prompt) return

    setGenerating(true)
    setGenError('')
    setGenSuccess('')

    try {
      const response = await fetch('/api/music/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt,
          duration: genDuration,
          filename: genFilename.trim() || undefined,
        }),
      })
      const data = await response.json()
      if (!response.ok) throw new Error(data.error)
      setGenSuccess(`${data.filename} genere avec succes!`)
      setGenFilename('')
      setSelectedGenPreset(null)
      setGenCustomPrompt('')
      fetchLibraryItems()
    } catch (error) {
      setGenError(error.message)
    } finally {
      setGenerating(false)
    }
  }

  const handleDelete = async (track) => {
    const filename = track.url.split('/').pop()
    if (!confirm(`Supprimer "${track.title}" ?`)) return
    try {
      await fetch(`/api/music/${filename}`, { method: 'DELETE' })
      fetchLibraryItems()
    } catch {}
  }

  const tabs = [
    { id: 'snippets', icon: Code2, label: 'Code Snippets' },
    { id: 'music', icon: Music, label: 'Music Tracks' },
    { id: 'templates', icon: Image, label: 'Templates' },
  ]

  const filteredMusic = music.filter(t =>
    !searchQuery || t.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    t.mood?.toLowerCase().includes(searchQuery.toLowerCase())
  )

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
        <div className="space-y-4">
          {/* AI Music Generator Toggle */}
          <div className="flex items-center justify-between">
            <p className="text-sm text-gray-500">{filteredMusic.length} tracks</p>
            <Button
              variant={showGenerator ? 'primary' : 'outline'}
              size="sm"
              onClick={() => setShowGenerator(!showGenerator)}
            >
              <Sparkles size={14} className="inline mr-1.5" />
              Generer avec IA
            </Button>
          </div>

          {/* AI Music Generator Panel */}
          {showGenerator && (
            <Card className="border-purple-200 bg-purple-50/30">
              <CardContent className="pt-5 space-y-4">
                <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                  <Sparkles size={18} className="text-purple-600" />
                  Generateur de Musique IA
                </h3>

                {!falConfigured && (
                  <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
                    <p className="text-sm text-amber-800">
                      Cle API fal.ai non configuree. Allez dans Settings pour ajouter votre cle.
                    </p>
                  </div>
                )}

                {/* Presets with search, categories & pagination */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Style musical ({genPresets.length} styles)</label>

                  {/* Search bar */}
                  <div className="relative mb-3">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={14} />
                    <input
                      type="text"
                      value={presetSearch}
                      onChange={(e) => { setPresetSearch(e.target.value); setPresetPage(0) }}
                      placeholder="Rechercher un style..."
                      className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg text-sm"
                      disabled={generating}
                    />
                  </div>

                  {/* Category filters */}
                  {(() => {
                    const categories = ['all', ...new Set(genPresets.map(p => p.category).filter(Boolean))]
                    return (
                      <div className="flex flex-wrap gap-1.5 mb-3">
                        {categories.map((cat) => (
                          <button
                            key={cat}
                            type="button"
                            onClick={() => { setPresetCategory(cat); setPresetPage(0) }}
                            className={`px-2.5 py-1 rounded-full text-xs font-medium transition-all ${
                              presetCategory === cat
                                ? 'bg-purple-600 text-white'
                                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                            }`}
                          >
                            {cat === 'all' ? 'Tous' : cat}
                          </button>
                        ))}
                      </div>
                    )
                  })()}

                  {/* Filtered & paginated presets */}
                  {(() => {
                    const filtered = genPresets.filter(p => {
                      const matchSearch = !presetSearch || p.name.toLowerCase().includes(presetSearch.toLowerCase()) || p.prompt.toLowerCase().includes(presetSearch.toLowerCase())
                      const matchCat = presetCategory === 'all' || p.category === presetCategory
                      return matchSearch && matchCat
                    })
                    const totalPages = Math.ceil(filtered.length / PRESETS_PER_PAGE)
                    const page = Math.min(presetPage, Math.max(0, totalPages - 1))
                    const paged = filtered.slice(page * PRESETS_PER_PAGE, (page + 1) * PRESETS_PER_PAGE)

                    return (
                      <>
                        <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
                          {paged.map((preset) => (
                            <button
                              key={preset.id}
                              type="button"
                              onClick={() => {
                                setSelectedGenPreset(selectedGenPreset === preset.id ? null : preset.id)
                                if (selectedGenPreset !== preset.id) setGenCustomPrompt('')
                              }}
                              disabled={generating}
                              title={preset.prompt}
                              className={`px-3 py-2 rounded-lg border-2 text-sm font-medium transition-all text-left ${
                                selectedGenPreset === preset.id
                                  ? 'border-purple-500 bg-purple-100 text-purple-800'
                                  : 'border-gray-200 hover:border-gray-300 text-gray-700'
                              }`}
                            >
                              <div className="truncate">{preset.name}</div>
                              {preset.category && <div className="text-[10px] text-gray-400 mt-0.5">{preset.category}</div>}
                            </button>
                          ))}
                        </div>
                        {filtered.length === 0 && (
                          <p className="text-sm text-gray-400 text-center py-4">Aucun style trouve</p>
                        )}
                        {/* Pagination */}
                        {totalPages > 1 && (
                          <div className="flex items-center justify-center gap-2 mt-3">
                            <button
                              type="button"
                              onClick={() => setPresetPage(Math.max(0, page - 1))}
                              disabled={page === 0}
                              className="px-3 py-1 text-sm border rounded-lg disabled:opacity-30 hover:bg-gray-50"
                            >
                              &larr;
                            </button>
                            <span className="text-xs text-gray-500">
                              {page + 1} / {totalPages}
                            </span>
                            <button
                              type="button"
                              onClick={() => setPresetPage(Math.min(totalPages - 1, page + 1))}
                              disabled={page >= totalPages - 1}
                              className="px-3 py-1 text-sm border rounded-lg disabled:opacity-30 hover:bg-gray-50"
                            >
                              &rarr;
                            </button>
                          </div>
                        )}
                      </>
                    )
                  })()}
                </div>

                {/* Custom prompt */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Ou decris ton propre style
                  </label>
                  <textarea
                    value={genCustomPrompt}
                    onChange={(e) => {
                      setGenCustomPrompt(e.target.value)
                      if (e.target.value) setSelectedGenPreset(null)
                    }}
                    className="w-full h-20 px-3 py-2 border border-gray-300 rounded-lg text-sm"
                    placeholder="Ex: Energetic electronic beat with deep bass, fast hi-hats, 140 BPM..."
                    disabled={generating}
                  />
                </div>

                {/* Duration & filename */}
                <div className="flex gap-4">
                  <div className="flex-1">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Duree (secondes)</label>
                    <input
                      type="number"
                      min="10"
                      max="180"
                      value={genDuration}
                      onChange={(e) => setGenDuration(Number(e.target.value))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                      disabled={generating}
                    />
                  </div>
                  <div className="flex-1">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Nom du fichier (optionnel)</label>
                    <input
                      type="text"
                      value={genFilename}
                      onChange={(e) => setGenFilename(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                      placeholder="ex: my-epic-beat"
                      disabled={generating}
                    />
                  </div>
                </div>

                {/* Generate button */}
                <button
                  type="button"
                  onClick={handleGenerate}
                  disabled={generating || !falConfigured || (!selectedGenPreset && !genCustomPrompt.trim())}
                  className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-semibold"
                >
                  {generating ? (
                    <>
                      <Loader2 size={18} className="animate-spin" />
                      Generation en cours...
                    </>
                  ) : (
                    <>
                      <Sparkles size={18} />
                      Generer la musique
                    </>
                  )}
                </button>

                {genError && (
                  <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                    <p className="text-sm text-red-800">{genError}</p>
                  </div>
                )}
                {genSuccess && (
                  <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                    <p className="text-sm text-green-800">{genSuccess}</p>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Track list */}
          <div className="space-y-3">
            {filteredMusic.map((track) => (
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
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handlePlayPreview(track)}
                    >
                      {playingTrackId === track.id ? (
                        <><Square size={14} className="inline mr-1" /> Stop</>
                      ) : (
                        <><Play size={14} className="inline mr-1" /> Preview</>
                      )}
                    </Button>
                    <button
                      onClick={() => handleDelete(track)}
                      className="p-2 text-gray-400 hover:text-red-500 transition-colors"
                      title="Supprimer"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
