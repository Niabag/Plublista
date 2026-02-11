import express from 'express'
import fs from 'fs/promises'
import path from 'path'
import { fileURLToPath } from 'url'

const router = express.Router()
const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// Get library items by type
router.get('/:type', async (req, res) => {
  try {
    const { type } = req.params
    
    if (type === 'snippets') {
      const snippets = [
        {
          id: 1,
          title: 'Glassmorphism Card',
          tags: ['CSS', 'UI', 'Effect'],
          preview: '<div class="glass">\n  <h2>Glassmorphism</h2>\n</div>',
          code: '<div class="glass"><h2>Glassmorphism</h2></div>',
        },
        {
          id: 2,
          title: 'Animated Button',
          tags: ['CSS', 'Animation', 'Button'],
          preview: '<button class="animated">\n  Click Me\n</button>',
          code: '<button class="animated">Click Me</button>',
        },
      ]
      return res.json(snippets)
    }
    
    if (type === 'music') {
      const musicDir = path.join(__dirname, '..', '..', 'assets', 'music')
      const files = await fs.readdir(musicDir)
      const mp3Files = files.filter(f => f.endsWith('.mp3')).sort()

      const moodMap = {
        'cyber-pulse': { bpm: 130, mood: 'Energetic' }, 'digital-rush': { bpm: 140, mood: 'Energetic' },
        'neon-drive': { bpm: 128, mood: 'Energetic' }, 'pixel-storm': { bpm: 135, mood: 'Energetic' },
        'turbo-code': { bpm: 138, mood: 'Energetic' }, 'electric-flow': { bpm: 126, mood: 'Energetic' },
        'hyper-loop': { bpm: 142, mood: 'Energetic' }, 'power-grid': { bpm: 132, mood: 'Energetic' },
        'fast-forward': { bpm: 136, mood: 'Energetic' }, 'velocity': { bpm: 144, mood: 'Energetic' },
        'tech-energy': { bpm: 128, mood: 'Energetic' },
        'chill-coding': { bpm: 85, mood: 'Relaxed' }, 'midnight-dev': { bpm: 75, mood: 'Relaxed' },
        'soft-focus': { bpm: 80, mood: 'Relaxed' }, 'calm-stream': { bpm: 72, mood: 'Relaxed' },
        'zen-code': { bpm: 78, mood: 'Relaxed' }, 'dream-logic': { bpm: 82, mood: 'Relaxed' },
        'quiet-hours': { bpm: 70, mood: 'Relaxed' }, 'slow-build': { bpm: 76, mood: 'Relaxed' },
        'gentle-flow': { bpm: 84, mood: 'Relaxed' }, 'mellow-byte': { bpm: 88, mood: 'Relaxed' },
        'deep-space': { bpm: 60, mood: 'Ambient' }, 'cloud-nine': { bpm: 65, mood: 'Ambient' },
        'void-echo': { bpm: 62, mood: 'Ambient' }, 'aurora-code': { bpm: 68, mood: 'Ambient' },
        'nebula-drift': { bpm: 58, mood: 'Ambient' }, 'stellar-hum': { bpm: 64, mood: 'Ambient' },
        'cosmic-debug': { bpm: 66, mood: 'Ambient' }, 'ether-wave': { bpm: 70, mood: 'Ambient' },
        'upbeat-tutorial': { bpm: 110, mood: 'Upbeat' }, 'happy-deploy': { bpm: 115, mood: 'Upbeat' },
        'sunny-stack': { bpm: 108, mood: 'Upbeat' }, 'bright-compile': { bpm: 112, mood: 'Upbeat' },
        'good-vibes': { bpm: 118, mood: 'Upbeat' }, 'positive-push': { bpm: 106, mood: 'Upbeat' },
        'cheerful-merge': { bpm: 114, mood: 'Upbeat' }, 'light-refactor': { bpm: 120, mood: 'Upbeat' },
        'dark-syntax': { bpm: 95, mood: 'Dark' }, 'shadow-code': { bpm: 100, mood: 'Dark' },
        'night-build': { bpm: 92, mood: 'Dark' }, 'deep-debug': { bpm: 98, mood: 'Dark' },
        'low-frequency': { bpm: 90, mood: 'Dark' }, 'binary-noir': { bpm: 105, mood: 'Dark' },
        'minimal-loop': { bpm: 95, mood: 'Focus' }, 'pure-focus': { bpm: 100, mood: 'Focus' },
        'clean-slate': { bpm: 90, mood: 'Focus' }, 'sharp-mind': { bpm: 105, mood: 'Focus' },
        'crystal-clear': { bpm: 88, mood: 'Focus' },
        'retro-wave': { bpm: 126, mood: 'Energetic' }, 'smooth-operator': { bpm: 97, mood: 'Relaxed' },
      }

      const music = mp3Files.map((file, idx) => {
        const name = file.replace('.mp3', '')
        const title = name.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')
        const meta = moodMap[name] || { bpm: 100, mood: 'Unknown' }
        return {
          id: idx + 1,
          title,
          bpm: meta.bpm,
          mood: meta.mood,
          duration: 60,
          url: `/assets/music/${file}`,
        }
      })
      return res.json(music)
    }
    
    res.json([])
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

export default router
