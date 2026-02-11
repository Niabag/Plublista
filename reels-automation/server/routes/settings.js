import express from 'express'
import fs from 'fs/promises'
import path from 'path'
import { fileURLToPath } from 'url'
import yaml from 'yaml'
import multer from 'multer'
import { exec } from 'child_process'
import { promisify } from 'util'
import { WebSocket } from 'ws'

const execAsync = promisify(exec)

const router = express.Router()
const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const brandDir = path.join(__dirname, '../../assets/brand')
const allowedExts = ['.png', '.jpg', '.jpeg', '.svg', '.webp']

const uploadLogo = multer({
  storage: multer.diskStorage({
    destination: (req, file, cb) => cb(null, brandDir),
    filename: (req, file, cb) => cb(null, `logo${path.extname(file.originalname)}`),
  }),
  fileFilter: (req, file, cb) => cb(null, allowedExts.includes(path.extname(file.originalname).toLowerCase())),
  limits: { fileSize: 5 * 1024 * 1024 },
})

const uploadBrandName = multer({
  storage: multer.diskStorage({
    destination: (req, file, cb) => cb(null, brandDir),
    filename: (req, file, cb) => cb(null, `brand-name${path.extname(file.originalname)}`),
  }),
  fileFilter: (req, file, cb) => cb(null, allowedExts.includes(path.extname(file.originalname).toLowerCase())),
  limits: { fileSize: 5 * 1024 * 1024 },
})

const configPath = path.join(__dirname, '../../config.yaml')

// Get settings
router.get('/', async (req, res) => {
  try {
    const configFile = await fs.readFile(configPath, 'utf8')
    const config = yaml.parse(configFile)
    
    res.json({
      brandName: config.brand.name_text || '',
      brandNameImageUrl: config.brand.name_image_path ? `/assets/brand/${path.basename(config.brand.name_image_path)}` : '',
      brandLogoUrl: config.brand.logo_path ? `/assets/brand/${path.basename(config.brand.logo_path)}` : '',
      brandSlogan: config.brand.slogan || '',
      brandColor: '#000000',
      obsHost: config.obs.host,
      obsPort: config.obs.port,
      obsPassword: config.obs.password,
      vscodePath: config.paths?.vscode || '',
      chromePath: config.paths?.chrome || '',
      igUserId: config.instagram.ig_user_id,
      igPageId: config.instagram.page_id,
      igAccessToken: config.instagram.access_token,
      anthropicApiKey: config.ai?.anthropic_api_key || '',
      aiModel: config.ai?.model || 'claude-sonnet-4-20250514',
    })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

// Update settings
router.put('/', async (req, res) => {
  try {
    const configFile = await fs.readFile(configPath, 'utf8')
    const config = yaml.parse(configFile)
    
    // Update config with new values
    if (req.body.brandName) config.brand.name_text = req.body.brandName
    if (req.body.brandSlogan !== undefined) config.brand.slogan = req.body.brandSlogan
    if (req.body.brandLogoUrl) config.brand.logo_path = req.body.brandLogoUrl
    if (req.body.obsHost) config.obs.host = req.body.obsHost
    if (req.body.obsPort) config.obs.port = req.body.obsPort
    if (req.body.obsPassword) config.obs.password = req.body.obsPassword
    if (req.body.igUserId) config.instagram.ig_user_id = req.body.igUserId
    if (req.body.igPageId) config.instagram.page_id = req.body.igPageId
    if (req.body.igAccessToken) config.instagram.access_token = req.body.igAccessToken
    
    if (!config.paths) config.paths = {}
    if (req.body.vscodePath) config.paths.vscode = req.body.vscodePath
    if (req.body.chromePath) config.paths.chrome = req.body.chromePath

    if (!config.ai) config.ai = {}
    if (req.body.anthropicApiKey !== undefined) config.ai.anthropic_api_key = req.body.anthropicApiKey
    if (req.body.aiModel) config.ai.model = req.body.aiModel
    
    await fs.writeFile(configPath, yaml.stringify(config), 'utf8')
    
    res.json({ success: true })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

// Upload brand logo
router.post('/logo', uploadLogo.single('logo'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded or invalid format' })
    }
    const logoPath = `assets/brand/${req.file.filename}`

    // Update config.yaml
    const configFile = await fs.readFile(configPath, 'utf8')
    const config = yaml.parse(configFile)
    config.brand.logo_path = logoPath
    await fs.writeFile(configPath, yaml.stringify(config), 'utf8')

    res.json({ success: true, logoPath, url: `/assets/brand/${req.file.filename}` })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

// Delete brand logo
router.delete('/logo', async (req, res) => {
  try {
    const configFile = await fs.readFile(configPath, 'utf8')
    const config = yaml.parse(configFile)
    const logoPath = config.brand.logo_path
    if (logoPath) {
      const fullPath = path.join(__dirname, '../..', logoPath)
      await fs.unlink(fullPath).catch(() => {})
      config.brand.logo_path = ''
      await fs.writeFile(configPath, yaml.stringify(config), 'utf8')
    }
    res.json({ success: true })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

// Upload brand name image
router.post('/brand-name-image', uploadBrandName.single('brandNameImage'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded or invalid format' })
    }
    const imagePath = `assets/brand/${req.file.filename}`

    const configFile = await fs.readFile(configPath, 'utf8')
    const config = yaml.parse(configFile)
    config.brand.name_image_path = imagePath
    config.brand.name_text = ''
    await fs.writeFile(configPath, yaml.stringify(config), 'utf8')

    res.json({ success: true, url: `/assets/brand/${req.file.filename}` })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

// Delete brand name image
router.delete('/brand-name-image', async (req, res) => {
  try {
    const configFile = await fs.readFile(configPath, 'utf8')
    const config = yaml.parse(configFile)
    const imagePath = config.brand.name_image_path
    if (imagePath) {
      const fullPath = path.join(__dirname, '../..', imagePath)
      await fs.unlink(fullPath).catch(() => {})
      config.brand.name_image_path = ''
      await fs.writeFile(configPath, yaml.stringify(config), 'utf8')
    }
    res.json({ success: true })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

// Auto-detect application paths and OBS connection
router.get('/detect', async (req, res) => {
  const results = { vscodePath: '', chromePath: '', obsHost: '', obsPort: '', obsStatus: '' }

  // Detect VS Code
  const vscodePaths = [
    path.join(process.env.LOCALAPPDATA || '', 'Programs/Microsoft VS Code/Code.exe'),
    path.join(process.env.PROGRAMFILES || '', 'Microsoft VS Code/Code.exe'),
    path.join(process.env['PROGRAMFILES(X86)'] || '', 'Microsoft VS Code/Code.exe'),
  ]
  for (const p of vscodePaths) {
    try {
      await fs.access(p)
      results.vscodePath = p
      break
    } catch {}
  }
  // Fallback: try where command
  if (!results.vscodePath) {
    try {
      const { stdout } = await execAsync('where code 2>nul')
      const lines = stdout.trim().split('\n')
      if (lines[0]) {
        const codeCmd = lines[0].trim()
        // 'code' is usually a cmd script, resolve the actual exe
        const dir = path.dirname(codeCmd)
        const exePath = path.join(dir, 'Code.exe')
        try { await fs.access(exePath); results.vscodePath = exePath } catch {
          results.vscodePath = codeCmd
        }
      }
    } catch {}
  }

  // Detect Chrome / Edge
  const chromePaths = [
    path.join(process.env.PROGRAMFILES || '', 'Google/Chrome/Application/chrome.exe'),
    path.join(process.env['PROGRAMFILES(X86)'] || '', 'Google/Chrome/Application/chrome.exe'),
    path.join(process.env.LOCALAPPDATA || '', 'Google/Chrome/Application/chrome.exe'),
    path.join(process.env.PROGRAMFILES || '', 'Microsoft/Edge/Application/msedge.exe'),
    path.join(process.env['PROGRAMFILES(X86)'] || '', 'Microsoft/Edge/Application/msedge.exe'),
  ]
  for (const p of chromePaths) {
    try {
      await fs.access(p)
      results.chromePath = p
      break
    } catch {}
  }

  // Detect OBS WebSocket config from OBS Studio files
  let obsHost = '127.0.0.1'
  let obsPort = '4455'
  let obsPassword = ''

  // Try reading OBS global.ini for WebSocket settings
  const appData = process.env.APPDATA || ''
  const globalIniPath = path.join(appData, 'obs-studio', 'global.ini')
  const wsConfigPath = path.join(appData, 'obs-studio', 'plugin_config', 'obs-websocket', 'config.json')

  // Method 1: Read plugin_config/obs-websocket/config.json (OBS 28+ built-in WebSocket)
  try {
    const wsConfig = JSON.parse(await fs.readFile(wsConfigPath, 'utf8'))
    if (wsConfig.server_port) obsPort = String(wsConfig.server_port)
    if (wsConfig.server_password) obsPassword = wsConfig.server_password
  } catch {}

  // Method 2: Fallback to global.ini [OBSWebSocket] section
  if (!obsPassword) {
    try {
      const iniContent = await fs.readFile(globalIniPath, 'utf8')
      const portMatch = iniContent.match(/\[OBSWebSocket\][\s\S]*?ServerPort=(\d+)/)
      const passMatch = iniContent.match(/\[OBSWebSocket\][\s\S]*?ServerPassword=(.+)/)
      if (portMatch) obsPort = portMatch[1]
      if (passMatch) obsPassword = passMatch[1].trim()
    } catch {}
  }

  results.obsHost = obsHost
  results.obsPort = obsPort
  results.obsPassword = obsPassword

  // Test connection with detected settings
  try {
    results.obsStatus = await new Promise((resolve) => {
      const ws = new WebSocket(`ws://${obsHost}:${obsPort}`, { handshakeTimeout: 2000 })
      const timeout = setTimeout(() => { ws.close(); resolve('unreachable') }, 3000)
      ws.on('open', () => { clearTimeout(timeout); ws.close(); resolve('connected') })
      ws.on('error', () => { clearTimeout(timeout); resolve('unreachable') })
    })
  } catch {
    results.obsStatus = 'unreachable'
  }

  res.json(results)
})

// Fetch Instagram credentials from Facebook Graph API using access token
router.post('/ig-fetch', async (req, res) => {
  try {
    const { accessToken } = req.body
    if (!accessToken) {
      return res.status(400).json({ error: 'Access Token requis.' })
    }

    // Step 1: Get Facebook Pages with Instagram Business Account
    const pagesUrl = `https://graph.facebook.com/v21.0/me/accounts?fields=id,name,instagram_business_account{id,username,profile_picture_url}&access_token=${encodeURIComponent(accessToken)}`
    console.log('📸 Fetching Instagram accounts from Facebook API...')
    const pagesRes = await fetch(pagesUrl, { signal: AbortSignal.timeout(15000) })
    console.log('📸 Facebook API response:', pagesRes.status)
    const pagesData = await pagesRes.json()

    if (pagesData.error) {
      const msg = pagesData.error.message || ''
      if (pagesData.error.code === 190) {
        return res.json({ status: 'invalid_token', message: 'Token invalide ou expire. Generez un nouveau token.' })
      }
      return res.json({ status: 'error', message: `Erreur Facebook: ${msg}` })
    }

    if (!pagesData.data || pagesData.data.length === 0) {
      return res.json({ status: 'no_pages', message: 'Aucune Page Facebook trouvee. Verifiez que votre compte a une Page.' })
    }

    // Find pages with Instagram Business Account
    const pagesWithIg = pagesData.data.filter(p => p.instagram_business_account)

    if (pagesWithIg.length === 0) {
      return res.json({
        status: 'no_ig',
        message: 'Aucun compte Instagram Business/Creator lie a vos Pages Facebook. Verifiez que votre compte Instagram est bien connecte a une Page Facebook.',
        pages: pagesData.data.map(p => ({ id: p.id, name: p.name })),
      })
    }

    // Return all pages with IG accounts so user can pick if multiple
    const accounts = pagesWithIg.map(p => ({
      pageId: p.id,
      pageName: p.name,
      igUserId: p.instagram_business_account.id,
      igUsername: p.instagram_business_account.username || '',
      igProfilePic: p.instagram_business_account.profile_picture_url || '',
    }))

    res.json({ status: 'ok', accounts })
  } catch (error) {
    console.error('📸 ig-fetch error:', error.message, error.cause || '')
    res.json({ status: 'error', message: `Erreur: ${error.message}` })
  }
})

export default router
