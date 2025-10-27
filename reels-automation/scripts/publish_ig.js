/**
 * Instagram Reels Publishing Script
 * Publishes video to Instagram via Graph API
 */

import fetch from 'node-fetch'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import yaml from 'yaml'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

async function loadConfig() {
  const configPath = path.join(__dirname, '../config.yaml')
  const configFile = fs.readFileSync(configPath, 'utf8')
  return yaml.parse(configFile)
}

async function publishToInstagram(videoUrl, caption, config) {
  const { ig_user_id, access_token } = config.instagram
  
  console.log('📱 Publishing to Instagram...')
  
  try {
    // Step 1: Create media container
    console.log('   Creating media container...')
    const createResponse = await fetch(
      `https://graph.facebook.com/v19.0/${ig_user_id}/media`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          media_type: 'REELS',
          video_url: videoUrl,
          caption: caption,
          access_token: access_token,
        }),
      }
    )
    
    const createData = await createResponse.json()
    
    if (createData.error) {
      throw new Error(`Failed to create container: ${createData.error.message}`)
    }
    
    const creationId = createData.id
    console.log(`   ✅ Container created: ${creationId}`)
    
    // Step 2: Wait for processing
    console.log('   Waiting for video to process...')
    await new Promise(resolve => setTimeout(resolve, 5000))
    
    // Step 3: Publish the media
    console.log('   Publishing media...')
    const publishResponse = await fetch(
      `https://graph.facebook.com/v19.0/${ig_user_id}/media_publish`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          creation_id: creationId,
          access_token: access_token,
        }),
      }
    )
    
    const publishData = await publishResponse.json()
    
    if (publishData.error) {
      throw new Error(`Failed to publish: ${publishData.error.message}`)
    }
    
    console.log('✨ Successfully published to Instagram!')
    console.log(`   Media ID: ${publishData.id}`)
    
    return publishData
  } catch (error) {
    console.error('❌ Publishing failed:', error.message)
    throw error
  }
}

async function main() {
  const args = process.argv.slice(2)
  
  if (args.length < 2) {
    console.log('Usage: node publish_ig.js <video_url> <caption>')
    process.exit(1)
  }
  
  const videoUrl = args[0]
  const caption = args.slice(1).join(' ')
  
  const config = await loadConfig()
  
  console.log('📊 Publishing details:')
  console.log(`   Video: ${videoUrl}`)
  console.log(`   Caption: ${caption}`)
  
  await publishToInstagram(videoUrl, caption, config)
}

main().catch(error => {
  console.error('Fatal error:', error)
  process.exit(1)
})
