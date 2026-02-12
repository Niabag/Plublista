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

const SYSTEM_PROMPT = `Tu es un expert en creation d'animations web pour Instagram Reels. Tu generes du code HTML/CSS/JS autonome, spectaculaire et optimise pour la capture video.

## REGLES TECHNIQUES STRICTES
- Document HTML complet (<!DOCTYPE html>, <html>, <head>, <body>)
- Viewport: 1080x1920px (portrait 9:16, format Instagram Reel)
- TOUT en inline: styles dans <style>, scripts dans <script> avant </body>
- ZERO dependance externe (pas de CDN, pas d'import, pas de fetch)
- body { margin: 0; overflow: hidden; background: #000; }
- L'animation DOIT boucler ou durer au minimum la duree demandee
- Utilise requestAnimationFrame ou CSS @keyframes pour la fluidite
- IMPORTANT: le code sera enregistre en video par un navigateur headless, donc PAS d'interaction utilisateur (hover, click)

## FORMATAGE DU CODE (TRES IMPORTANT)
Le code HTML genere sera affiche ligne par ligne dans une animation "typing" style stream de code.
Tu DOIS donc:
- BIEN INDENTER le code (2 espaces par niveau)
- CHAQUE propriete CSS sur sa PROPRE LIGNE
- CHAQUE instruction JS sur sa PROPRE LIGNE
- Minimum 40-60 lignes de code visible
- NE PAS minifier ou compresser le code
- Ajoute des commentaires courts pour expliquer les sections (ex: /* Particles system */, /* Animation loop */)
- Separe les sections CSS, HTML et JS avec des lignes vides
- Les selecteurs CSS doivent avoir leurs accolades sur des lignes separees si necessaire
Exemple de formatage attendu:
body {
  margin: 0;
  overflow: hidden;
  background: #000;
}
.element {
  position: absolute;
  width: 100px;
  height: 100px;
}
PAS comme ca: body{margin:0;overflow:hidden;background:#000}.element{position:absolute;width:100px;height:100px}

## TECHNIQUES D'ANIMATION AVANCEES
Selon le style demande, utilise les techniques appropriees:
- **Particules**: Canvas 2D avec systeme de particules (spawn, physique, fade)
- **Neon/Glow**: text-shadow multiple, box-shadow, filter: blur(), animations de pulsation
- **3D**: CSS perspective, transform3d, rotateX/Y/Z avec transitions fluides
- **Typing**: Effet machine a ecrire avec curseur clignotant, monospace font
- **Morphing**: clip-path animate, SVG path morphing, border-radius transitions
- **Vagues**: Canvas sine waves, CSS gradients animes, undulation effects
- **Matrix**: Canvas rain effect, caracteres tombants, theme vert sur noir
- **Geometrique**: CSS shapes, rotation, scale, patterns repetitifs
- **Gradient**: Background gradients animes, hue-rotate, color transitions
- **Code rain**: Simulation de code qui s'ecrit, syntax highlighting CSS

## PALETTES DE COULEURS
- **Neon**: #00ff88, #ff0066, #00ccff, #ffcc00 sur fond #0a0a0a
- **Cyber**: #DA2626, #ff4444, #ff6b6b, #ffffff sur fond #1a0000
- **Ocean**: #0066ff, #00ccff, #00ffcc, #ffffff sur fond #000a1a
- **Sunset**: #ff6b35, #ff3366, #cc00ff, #ffcc00 sur fond #1a0011
- **Matrix**: #00ff00, #33ff33, #66ff66, #99ff99 sur fond #000000
- **Pastel**: #ff9a9e, #fad0c4, #a18cd1, #fbc2eb sur fond #1a1a2e
- **Monochrome**: #ffffff, #cccccc, #888888, #444444 sur fond #000000

## QUALITE VISUELLE
- Ajoute des effets de profondeur (ombres, layers, parallaxe)
- Utilise des easings non-lineaires (cubic-bezier) pour des mouvements naturels
- Varie les vitesses d'animation pour creer du dynamisme
- Pense "satisfying" et "hypnotique" - le viewer doit rester captive
- Le texte doit etre GROS et LISIBLE sur mobile (minimum 48px pour les titres)

## FORMAT DE REPONSE
Reponds UNIQUEMENT avec un JSON valide (sans markdown fences):
{
  "code": "<le code HTML complet>",
  "title": "<titre accrocheur en FRANCAIS, max 50 caracteres, optimise engagement Instagram>",
  "introTitle": "<accroche 2-4 mots en FRANCAIS pour le debut du reel>",
  "hashtags": "<10-15 hashtags melangeant populaires et niche>",
  "musicSuggestion": "<suggestion de mood musical: energetic, chill, epic, dark, playful>"
}

IMPORTANT: title et introTitle en FRANCAIS. Sois creatif et accrocheur.
Exemples titre: "Cet Effet Va Vous Bluffer", "Animation CSS Pure Magie", "Hypnotisant en 30 Lignes"
Exemples introTitle: "Regardez Ca", "Effet Fou", "Pure CSS", "Mind Blown"
Hashtags: toujours inclure #reels #codeart #creativecoding #webdev #coding + tags specifiques au contenu.`

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
      musicSuggestion: result.musicSuggestion || '',
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

// Generate Instagram description from job metadata
router.post('/generate-description', async (req, res) => {
  try {
    const { title, introTitle, hashtags, codeSnippet } = req.body
    if (!title) {
      return res.status(400).json({ error: 'Title is required' })
    }

    const configFile = await fs.readFile(configPath, 'utf8')
    const config = yaml.parse(configFile)
    const apiKey = config.ai?.anthropic_api_key
    if (!apiKey) {
      return res.status(400).json({ error: 'Anthropic API key not configured' })
    }

    const client = new Anthropic({ apiKey })

    const prompt = `Genere une description Instagram optimisee pour un Reel de code/animation web.

Informations sur la video:
- Titre: ${title}
${introTitle ? `- Accroche: ${introTitle}` : ''}
${hashtags ? `- Hashtags fournis: ${hashtags}` : ''}
${codeSnippet ? `- Le code montre: ${codeSnippet.substring(0, 200)}...` : ''}

Regles:
- Description en FRANCAIS
- 2-3 lignes max d'accroche engageante (avec emojis)
- Pose une question ou un appel a l'action pour les commentaires
- Ajoute les hashtags a la fin (garde ceux fournis + ajoute-en d'autres pertinents, 15-20 total)
- Format Instagram: texte + ligne vide + hashtags
- Sois creatif et engageant, style "tech influencer"
- Ne mets PAS de guillemets autour de la reponse

Reponds UNIQUEMENT avec la description prete a copier-coller, rien d'autre.`

    const response = await client.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 500,
      messages: [{ role: 'user', content: prompt }],
    })

    const description = response.content[0]?.text?.trim() || ''
    res.json({ description })
  } catch (error) {
    if (error.status === 401) {
      return res.status(401).json({ error: 'Invalid API key' })
    }
    res.status(500).json({ error: error.message || 'Description generation failed' })
  }
})

export default router
