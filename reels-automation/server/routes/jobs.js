import express from 'express'
import { spawn } from 'child_process'
import path from 'path'
import { fileURLToPath } from 'url'
import fs from 'fs/promises'

const router = express.Router()
const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// In-memory storage (replace with database in production)
const jobs = new Map()
let jobIdCounter = 1

// Get recent jobs
router.get('/recent', async (req, res) => {
  try {
    const recentJobs = Array.from(jobs.values())
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
      .slice(0, 10)
    res.json(recentJobs)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

// Get job by ID
router.get('/:id', async (req, res) => {
  try {
    const job = jobs.get(parseInt(req.params.id))
    if (!job) {
      return res.status(404).json({ error: 'Job not found' })
    }
    res.json(job)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

// Create new job
router.post('/create', async (req, res) => {
  try {
    const { code, title, introTitle, hashtags, musicStyle, targetDuration, brandOverlay, scheduleEnabled, scheduleDate, scheduleTime } = req.body

    const jobId = jobIdCounter++
    
    // Calculate scheduled date/time
    let scheduledFor = null
    let publishStatus = 'draft'
    
    if (scheduleEnabled && scheduleDate && scheduleTime) {
      scheduledFor = new Date(`${scheduleDate}T${scheduleTime}`).toISOString()
      publishStatus = 'scheduled'
    }
    
    const job = {
      id: jobId,
      title,
      introTitle,
      code,
      hashtags,
      musicStyle,
      targetDuration,
      brandOverlay,
      status: 'queued',
      publishStatus,
      scheduledFor,
      createdAt: new Date().toISOString(),
      logs: [],
      timeline: [
        { name: 'Initialize workspace', status: 'pending', duration: 0 },
        { name: 'Open VS Code', status: 'pending', duration: 3 },
        { name: 'Paste code', status: 'pending', duration: 10 },
        { name: 'Start OBS recording', status: 'pending', duration: 2 },
        { name: 'Type code', status: 'pending', duration: 5 },
        { name: 'Launch browser demo', status: 'pending', duration: 8 },
        { name: 'Stop recording', status: 'pending', duration: 2 },
        { name: 'Post-process video', status: 'pending', duration: 0 },
      ],
    }

    jobs.set(jobId, job)

    // Start the automation process
    processJob(job)

    res.json({ id: jobId })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

// Process job (orchestrate automation)
async function processJob(job) {
  try {
    job.status = 'processing'
    addLog(job, '🚀 Démarrage de l\'automatisation...')

    // Create workspace
    const workspacePath = path.join(__dirname, '../../workspace', `job-${job.id}`)
    await fs.mkdir(workspacePath, { recursive: true })
    
    // Copy shared images from assets/images to workspace
    const assetsImagesPath = path.join(__dirname, '../../assets/images')
    try {
      const imageFiles = await fs.readdir(assetsImagesPath)
      for (const file of imageFiles) {
        if (file.endsWith('.png') || file.endsWith('.jpg') || file.endsWith('.jpeg') || 
            file.endsWith('.gif') || file.endsWith('.svg') || file.endsWith('.webp')) {
          const srcPath = path.join(assetsImagesPath, file)
          const destPath = path.join(workspacePath, file)
          await fs.copyFile(srcPath, destPath)
          addLog(job, `📷 Image copiée: ${file}`)
        }
      }
    } catch (err) {
      // Si le dossier n'existe pas ou est vide, continuer sans erreur
      if (err.code !== 'ENOENT') {
        console.warn('Avertissement lors de la copie des images:', err.message)
      }
    }
    
    // Prepare HTML content - add boilerplate if it's a fragment
    let htmlContent = job.code
    const isFragment = !job.code.toLowerCase().trim().startsWith('<!doctype') && 
                       !job.code.toLowerCase().trim().startsWith('<html')
    
    if (isFragment) {
      // Wrap fragment in complete HTML structure
      htmlContent = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Document</title>
</head>
<body>
    ${job.code.trim()}
</body>
</html>`
    }
    
    // Write code to file
    const codePath = path.join(workspacePath, 'snippet.html')
    await fs.writeFile(codePath, htmlContent)
    
    updateTimeline(job, 0, 'completed', 1)
    addLog(job, '✅ Workspace créé')

    // Call the Python orchestrator script
    const pythonPath = process.env.PYTHON_PATH || 'python'
    const orchestratorPath = path.join(__dirname, '../../scripts/orchestrator.py')
    
    addLog(job, '🎬 Lancement de l\'orchestrateur Python...')
    addLog(job, `⏱️  Durée vidéo: ${job.targetDuration || 17} secondes`)
    
    const { spawn } = await import('child_process')
    
    const pythonProcess = spawn(pythonPath, [
      orchestratorPath,
      '--job-id', job.id.toString(),
      '--code-file', codePath,
      '--title', job.title,
      '--intro-title', job.introTitle || '',
      '--music-style', job.musicStyle || 'tech/energetic',
      '--video-duration', (job.targetDuration || 17).toString()
    ], {
      cwd: path.join(__dirname, '../../'),
      env: { 
        ...process.env,
        PYTHONIOENCODING: 'utf-8',
        PYTHONUTF8: '1'
      }
    })

    let currentStep = 1
    
    pythonProcess.stdout.on('data', (data) => {
      const output = data.toString()
      addLog(job, output.trim())
      
      // Update timeline based on log output
      // STEP 1: Workspace (already done before Python starts)
      if (output.includes('STEP 2')) {
        // Open VS Code
        updateTimeline(job, 0, 'completed', 3)
        updateTimeline(job, 1, 'running', 0)
        currentStep = 2
      } else if (output.includes('STEP 3')) {
        // Paste code
        updateTimeline(job, 1, 'completed', 10)
        updateTimeline(job, 2, 'running', 0)
        currentStep = 3
      } else if (output.includes('STEP 4')) {
        // Start OBS recording
        updateTimeline(job, 2, 'completed', 2)
        updateTimeline(job, 3, 'running', 0)
        currentStep = 4
      } else if (output.includes('STEP 5')) {
        // Simulate typing
        updateTimeline(job, 3, 'completed', 5)
        updateTimeline(job, 4, 'running', 0)
        currentStep = 5
      } else if (output.includes('STEP 6')) {
        // Launch browser
        updateTimeline(job, 4, 'completed', 8)
        updateTimeline(job, 5, 'running', 0)
        currentStep = 6
      } else if (output.includes('STEP 7')) {
        // Stop recording
        updateTimeline(job, 5, 'completed', 2)
        updateTimeline(job, 6, 'running', 0)
        currentStep = 7
      } else if (output.includes('STEP 8')) {
        // Post-process
        updateTimeline(job, 6, 'completed', 0)
        updateTimeline(job, 7, 'running', 0)
        currentStep = 8
      }
      
      // Detect failures
      if (output.includes('[ERROR]') || output.includes('Pipeline failed')) {
        // Mark current running step as failed
        const runningStep = job.timeline.findIndex(s => s.status === 'running')
        if (runningStep >= 0) {
          updateTimeline(job, runningStep, 'failed', 0)
        }
      }
      
      // Detect success completions
      if (output.includes('[SUCCESS]')) {
        const runningStep = job.timeline.findIndex(s => s.status === 'running')
        if (runningStep >= 0 && runningStep < job.timeline.length - 1) {
          updateTimeline(job, runningStep, 'completed', 0)
        }
      }
    })

    pythonProcess.stderr.on('data', (data) => {
      addLog(job, `⚠️ ${data.toString().trim()}`)
    })

    pythonProcess.on('close', (code) => {
      if (code === 0) {
        updateTimeline(job, job.timeline.length - 1, 'completed', 0)
        job.status = 'completed'
        job.videoUrl = `/out/final/job-${job.id}.mp4`
        job.duration = job.targetDuration || 45
        addLog(job, '✅ Vidéo créée avec succès!')
      } else {
        job.status = 'failed'
        addLog(job, `❌ Erreur: Le processus s'est terminé avec le code ${code}`)
      }
    })

  } catch (error) {
    job.status = 'failed'
    addLog(job, `❌ Erreur: ${error.message}`)
  }
}

function addLog(job, message) {
  job.logs.push({
    timestamp: new Date().toISOString(),
    message,
  })
}

function updateTimeline(job, index, status, duration = 0) {
  if (job.timeline[index]) {
    job.timeline[index].status = status
    if (duration > 0) {
      job.timeline[index].duration = duration
    }
  }
}

// Get scheduled jobs
router.get('/scheduled', async (req, res) => {
  try {
    const scheduledJobs = Array.from(jobs.values())
      .filter(job => job.publishStatus === 'scheduled' && job.scheduledFor)
      .sort((a, b) => new Date(a.scheduledFor) - new Date(b.scheduledFor))
    res.json(scheduledJobs)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

// Publish job to Instagram
router.post('/:id/publish', async (req, res) => {
  try {
    const job = jobs.get(parseInt(req.params.id))
    if (!job) {
      return res.status(404).json({ error: 'Job not found' })
    }

    if (job.status !== 'completed') {
      return res.status(400).json({ error: 'Job is not ready for publishing' })
    }

    // Update publish status
    job.publishStatus = 'publishing'
    addLog(job, 'Starting Instagram publication...')

    // Here you would call the actual Instagram API
    // For now, we'll simulate it
    setTimeout(() => {
      job.publishStatus = 'published'
      job.publishedAt = new Date().toISOString()
      addLog(job, '✅ Successfully published to Instagram!')
    }, 2000)

    res.json({ success: true, message: 'Publishing started' })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

// Update job schedule
router.patch('/:id/schedule', async (req, res) => {
  try {
    const job = jobs.get(parseInt(req.params.id))
    if (!job) {
      return res.status(404).json({ error: 'Job not found' })
    }

    const { scheduleDate, scheduleTime } = req.body
    
    if (scheduleDate && scheduleTime) {
      job.scheduledFor = new Date(`${scheduleDate}T${scheduleTime}`).toISOString()
      job.publishStatus = 'scheduled'
      addLog(job, `📅 Scheduled for ${new Date(job.scheduledFor).toLocaleString()}`)
    } else {
      job.scheduledFor = null
      job.publishStatus = 'draft'
      addLog(job, 'Schedule removed')
    }

    res.json(job)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

export default router
