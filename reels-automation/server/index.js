import express from 'express'
import cors from 'cors'
import multer from 'multer'
import dotenv from 'dotenv'
import path from 'path'
import { fileURLToPath } from 'url'
import fs from 'fs/promises'
import jobsRouter from './routes/jobs.js'
import libraryRouter from './routes/library.js'
import settingsRouter from './routes/settings.js'
import queueRouter from './routes/queue.js'
import aiRouter from './routes/ai.js'
import JobScheduler from './scheduler.js'

dotenv.config()

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const app = express()
const PORT = process.env.PORT || 3000

// Middleware
app.use(cors())
app.use(express.json())
app.use(express.urlencoded({ extended: true }))

// Static files
app.use('/uploads', express.static(path.join(__dirname, '../uploads')))
app.use('/out', express.static(path.join(__dirname, '../out')))
app.use('/assets', express.static(path.join(__dirname, '../assets')))

// Routes
app.use('/api/jobs', jobsRouter)
app.use('/api/library', libraryRouter)
app.use('/api/settings', settingsRouter)
app.use('/api/queue', queueRouter)
app.use('/api/ai', aiRouter)

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() })
})

// Error handler
app.use((err, req, res, next) => {
  console.error(err.stack)
  res.status(500).json({ error: err.message })
})

// Initialize scheduler
const scheduler = new JobScheduler()

app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`)
  console.log(`📱 Instagram Reels Automation API ready`)
  
  // Start job scheduler
  scheduler.start()
})

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully')
  scheduler.stop()
  process.exit(0)
})

process.on('SIGINT', () => {
  console.log('SIGINT received, shutting down gracefully')
  scheduler.stop()
  process.exit(0)
})
