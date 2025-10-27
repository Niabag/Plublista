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
      const music = [
        {
          id: 1,
          title: 'Tech Energy',
          bpm: 128,
          mood: 'Energetic',
          duration: 60,
          url: '/assets/music/tech-energy.mp3',
        },
        {
          id: 2,
          title: 'Chill Coding',
          bpm: 90,
          mood: 'Relaxed',
          duration: 90,
          url: '/assets/music/chill-coding.mp3',
        },
      ]
      return res.json(music)
    }
    
    res.json([])
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

export default router
