import express from 'express'
import fs from 'fs/promises'
import path from 'path'
import { fileURLToPath } from 'url'
import yaml from 'yaml'
import { fal } from '@fal-ai/client'

const router = express.Router()
const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const configPath = path.join(__dirname, '../../config.yaml')
const musicDir = path.join(__dirname, '../../assets/music')

async function getFalKey() {
  const configFile = await fs.readFile(configPath, 'utf8')
  const config = yaml.parse(configFile)
  return config.ai?.fal_api_key || ''
}

// Check if fal.ai is configured
router.get('/status', async (req, res) => {
  try {
    const key = await getFalKey()
    res.json({ configured: !!key })
  } catch {
    res.json({ configured: false })
  }
})

// Music generation presets - loaded from JSON file
let presetsCache = null
router.get('/presets', async (req, res) => {
  try {
    if (!presetsCache) {
      const presetsPath = path.join(__dirname, '../data/music-presets.json')
      const data = await fs.readFile(presetsPath, 'utf8')
      presetsCache = JSON.parse(data)
    }
    res.json(presetsCache)
  } catch (error) {
    res.json([])
  }
})

// Generate music via fal.ai
router.post('/generate', async (req, res) => {
  try {
    const key = await getFalKey()
    if (!key) {
      return res.status(400).json({ error: 'Cle API fal.ai non configuree. Allez dans Settings.' })
    }

    const { prompt, duration = 60, filename } = req.body
    if (!prompt) {
      return res.status(400).json({ error: 'Prompt requis.' })
    }

    fal.config({ credentials: key })

    console.log(`🎵 Generating music: "${prompt.substring(0, 50)}..." (${duration}s)`)

    const result = await fal.subscribe('CassetteAI/music-generator', {
      input: {
        prompt,
        duration: Math.min(Math.max(duration, 10), 180),
      },
      logs: true,
      onQueueUpdate: (update) => {
        if (update.status === 'IN_PROGRESS') {
          console.log('🎵 Music generation in progress...')
        }
      },
    })

    const audioUrl = result.data?.audio_file?.url
    if (!audioUrl) {
      return res.status(500).json({ error: 'Pas d\'URL audio dans la reponse fal.ai' })
    }

    console.log(`🎵 Music generated, downloading from: ${audioUrl}`)

    // Download the audio file
    const audioRes = await fetch(audioUrl)
    if (!audioRes.ok) {
      return res.status(500).json({ error: 'Erreur telechargement audio' })
    }

    const audioBuffer = Buffer.from(await audioRes.arrayBuffer())

    // Generate filename
    const safeName = (filename || prompt.substring(0, 30))
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '')
    const finalName = `${safeName}.mp3`
    const outputPath = path.join(musicDir, finalName)

    // The file from CassetteAI is WAV, convert to MP3 via ffmpeg
    const wavPath = path.join(musicDir, `${safeName}-temp.wav`)
    await fs.writeFile(wavPath, audioBuffer)

    // Convert WAV to MP3
    const { exec } = await import('child_process')
    const { promisify } = await import('util')
    const execAsync = promisify(exec)

    // Find ffmpeg
    const ffmpegPaths = [
      path.join(__dirname, '../../node_modules/ffmpeg-static/ffmpeg.exe'),
      'ffmpeg',
    ]
    let ffmpegCmd = 'ffmpeg'
    for (const fp of ffmpegPaths) {
      try {
        await fs.access(fp)
        ffmpegCmd = `"${fp}"`
        break
      } catch {}
    }

    try {
      await execAsync(`${ffmpegCmd} -i "${wavPath}" -codec:a libmp3lame -b:a 320k -y "${outputPath}"`)
      await fs.unlink(wavPath).catch(() => {})
      console.log(`🎵 Music saved: ${finalName} (320kbps MP3)`)
    } catch (ffmpegError) {
      // If ffmpeg fails, save as WAV directly
      console.log('🎵 FFmpeg conversion failed, saving as WAV')
      const wavFinalPath = path.join(musicDir, `${safeName}.wav`)
      await fs.rename(wavPath, wavFinalPath)
      return res.json({
        success: true,
        filename: `${safeName}.wav`,
        url: `/assets/music/${safeName}.wav`,
        format: 'wav',
      })
    }

    res.json({
      success: true,
      filename: finalName,
      url: `/assets/music/${finalName}`,
      format: 'mp3',
    })
  } catch (error) {
    console.error('🎵 Music generation error:', error.message)
    if (error.status === 401 || error.message?.includes('Unauthorized')) {
      return res.status(401).json({ error: 'Cle API fal.ai invalide.' })
    }
    res.status(500).json({ error: error.message || 'Erreur generation musique' })
  }
})

// Delete a music track
router.delete('/:filename', async (req, res) => {
  try {
    const filePath = path.join(musicDir, req.params.filename)
    await fs.unlink(filePath)
    res.json({ success: true })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

export default router
