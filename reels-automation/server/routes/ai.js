import express from 'express'
import multer from 'multer'
import fs from 'fs/promises'
import path from 'path'
import { fileURLToPath } from 'url'
import yaml from 'yaml'
import Anthropic from '@anthropic-ai/sdk'

const router = express.Router()
const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const configPath = path.join(__dirname, '../../config.yaml')

const uploadDir = path.join(__dirname, '../../uploads/ai-references')
const upload = multer({
  storage: multer.diskStorage({
    destination: async (req, file, cb) => {
      await fs.mkdir(uploadDir, { recursive: true })
      cb(null, uploadDir)
    },
    filename: (req, file, cb) => {
      cb(null, `ref-${Date.now()}${path.extname(file.originalname)}`)
    },
  }),
  fileFilter: (req, file, cb) => {
    const allowed = ['.png', '.jpg', '.jpeg', '.gif', '.webp']
    cb(null, allowed.includes(path.extname(file.originalname).toLowerCase()))
  },
  limits: { fileSize: 10 * 1024 * 1024 },
})

const SYSTEM_PROMPT = `You are a code generator for Instagram Reels animations. Generate a complete, self-contained HTML file with inline CSS and JavaScript. The output must:
- Be a full HTML document (<!DOCTYPE html> with <html>, <head>, <body>)
- Use a viewport of 1080x1920 pixels (9:16 portrait, Instagram Reel format)
- Include all styles in a <style> tag in <head>
- Include all scripts in a <script> tag before </body>
- Create visually striking, animated content suitable for short video recording
- Use no external dependencies (no CDN links, no imports)
- Set body margin to 0 and overflow to hidden
- Use a dark background color
- Make the animation loop or last at least 30 seconds
- Use modern CSS features (animations, gradients, transforms)

You MUST respond with a valid JSON object (no markdown fences) containing these fields:
{
  "code": "<the full HTML code>",
  "title": "<un titre accrocheur et court pour le reel (max 50 caracteres), en FRANCAIS, optimise pour l'engagement Instagram>",
  "introTitle": "<un texte d'intro court et percutant (2-4 mots) en FRANCAIS, qui apparait au debut du reel, comme une accroche>",
  "hashtags": "<10-15 hashtags Instagram pertinents separes par des espaces, melangeant tags populaires et de niche>"
}

IMPORTANT: The title and introTitle MUST be written in French.
For the title: make it engaging, use action words, create curiosity. Examples: "Effet CSS Incroyable", "Magie du Code", "Animation Hypnotique".
For the introTitle: short punchy text in French like "Regardez Ca", "Effet Fou", "Magie CSS", "Art du Code".
For the hashtags: include a mix of #webdev #coding #frontend #css #html #javascript plus specific tags related to the animation content. Always include #reels #codeart #creativecoding. Add French tags like #developpement #codage #programmation.`

function parseAiResponse(text) {
  const trimmed = text.trim()
  // Try direct JSON parse
  try {
    const parsed = JSON.parse(trimmed)
    if (parsed.code) return parsed
  } catch {}
  // Try extracting JSON from markdown fences
  const jsonFence = trimmed.match(/```(?:json)?\s*\n([\s\S]*?)```/)
  if (jsonFence) {
    try {
      const parsed = JSON.parse(jsonFence[1].trim())
      if (parsed.code) return parsed
    } catch {}
  }
  // Fallback: treat the whole thing as code
  const fenceMatch = trimmed.match(/```(?:html)?\s*\n([\s\S]*?)```/)
  const code = fenceMatch ? fenceMatch[1].trim() : trimmed
  return { code, title: '', introTitle: '', hashtags: '' }
}

// Check if AI is configured
router.get('/status', async (req, res) => {
  try {
    const configFile = await fs.readFile(configPath, 'utf8')
    const config = yaml.parse(configFile)
    const hasKey = !!(config.ai && config.ai.anthropic_api_key)
    res.json({ configured: hasKey, model: config.ai?.model || 'claude-sonnet-4-20250514' })
  } catch {
    res.json({ configured: false, model: '' })
  }
})

// Test API key
router.post('/test', async (req, res) => {
  try {
    const configFile = await fs.readFile(configPath, 'utf8')
    const config = yaml.parse(configFile)
    const apiKey = config.ai?.anthropic_api_key
    const model = config.ai?.model || 'claude-sonnet-4-20250514'

    if (!apiKey) {
      return res.json({ status: 'no_key', message: 'Aucune cle API configuree.' })
    }

    const client = new Anthropic({ apiKey })
    // Use haiku for test (cheapest, always available)
    const response = await client.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 10,
      messages: [{ role: 'user', content: 'Hi' }],
    })

    res.json({ status: 'ok', message: `Cle API valide ! Connexion reussie. (modele configure: ${model})` })
  } catch (error) {
    const msg = error.message || ''
    if (error.status === 401) {
      return res.json({ status: 'invalid_key', message: 'Cle API invalide. Verifiez votre cle sur console.anthropic.com.' })
    }
    if (error.status === 429) {
      return res.json({ status: 'rate_limit', message: 'Limite de requetes atteinte. Reessayez dans quelques instants.' })
    }
    if (msg.includes('credit') || msg.includes('balance')) {
      return res.json({ status: 'no_credits', message: 'Solde insuffisant. Ajoutez des credits sur console.anthropic.com > Plans & Billing.' })
    }
    res.json({ status: 'error', message: `Erreur: ${msg}` })
  }
})

// Generate code from prompt + optional image
router.post('/generate', upload.single('referenceImage'), async (req, res) => {
  try {
    const { prompt } = req.body
    if (!prompt || !prompt.trim()) {
      return res.status(400).json({ error: 'Prompt is required' })
    }

    const configFile = await fs.readFile(configPath, 'utf8')
    const config = yaml.parse(configFile)
    const apiKey = config.ai?.anthropic_api_key
    const model = config.ai?.model || 'claude-sonnet-4-20250514'

    if (!apiKey) {
      return res.status(400).json({ error: 'Anthropic API key not configured. Go to Settings to add your key.' })
    }

    const client = new Anthropic({ apiKey })

    // Build message content
    const content = []

    // Add reference image if provided
    if (req.file) {
      const imageData = await fs.readFile(req.file.path)
      const base64 = imageData.toString('base64')
      const ext = path.extname(req.file.originalname).toLowerCase().replace('.', '')
      const mediaType = ext === 'jpg' ? 'image/jpeg' : `image/${ext}`
      content.push({
        type: 'image',
        source: { type: 'base64', media_type: mediaType, data: base64 },
      })
      // Cleanup uploaded file
      await fs.unlink(req.file.path).catch(() => {})
    }

    content.push({ type: 'text', text: prompt })

    const response = await client.messages.create({
      model,
      max_tokens: 8192,
      system: SYSTEM_PROMPT,
      messages: [{ role: 'user', content }],
    })

    const rawText = response.content[0]?.text || ''
    const result = parseAiResponse(rawText)

    res.json({
      code: result.code,
      title: result.title || '',
      introTitle: result.introTitle || '',
      hashtags: result.hashtags || '',
      model: response.model,
      usage: response.usage,
    })
  } catch (error) {
    // Cleanup uploaded file on error
    if (req.file) await fs.unlink(req.file.path).catch(() => {})

    if (error.status === 401) {
      return res.status(401).json({ error: 'Invalid API key. Check your Anthropic API key in Settings.' })
    }
    if (error.status === 429) {
      return res.status(429).json({ error: 'Rate limit exceeded. Please wait and try again.' })
    }
    res.status(500).json({ error: error.message || 'Generation failed' })
  }
})

export default router
