import express from 'express'
import fs from 'fs/promises'
import path from 'path'
import { fileURLToPath } from 'url'
import yaml from 'yaml'

const router = express.Router()
const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const configPath = path.join(__dirname, '../../config.yaml')

// Get settings
router.get('/', async (req, res) => {
  try {
    const configFile = await fs.readFile(configPath, 'utf8')
    const config = yaml.parse(configFile)
    
    res.json({
      brandName: config.brand.name_text || '',
      brandLogoUrl: config.brand.logo_path || '',
      brandColor: '#000000',
      obsHost: config.obs.host,
      obsPort: config.obs.port,
      obsPassword: config.obs.password,
      vscodePath: config.paths?.vscode || '',
      chromePath: config.paths?.chrome || '',
      igUserId: config.instagram.ig_user_id,
      igPageId: config.instagram.page_id,
      igAccessToken: config.instagram.access_token,
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
    
    await fs.writeFile(configPath, yaml.stringify(config), 'utf8')
    
    res.json({ success: true })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

export default router
