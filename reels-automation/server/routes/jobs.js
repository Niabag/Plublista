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

// Get scheduled jobs (must be before /:id to avoid being caught by it)
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
        { name: 'Préparer l\'espace de travail', status: 'pending', duration: 0 },
        { name: 'Générer la Stream View', status: 'pending', duration: 0 },
        { name: 'Enregistrer avec Playwright', status: 'pending', duration: 0 },
        { name: 'Capturer le contenu', status: 'pending', duration: 0 },
        { name: 'Sauvegarder l\'enregistrement', status: 'pending', duration: 0 },
        { name: 'Post-traitement vidéo', status: 'pending', duration: 0 },
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
    startStep(job, 0)
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
    
    completeStep(job, 0)
    startStep(job, 1)
    addLog(job, '✅ Workspace créé')

    // Call the Python orchestrator script
    const pythonPath = process.env.PYTHON_PATH || 'python'
    const orchestratorPath = path.join(__dirname, '../../scripts/orchestrator.py')
    
    addLog(job, '🎬 Lancement de l\'orchestrateur Python...')
    addLog(job, `⏱️  Durée vidéo: ${job.targetDuration || 17} secondes`)
    addLog(job, `🎵 Musique: ${job.musicStyle || 'tech/energetic'}`)
    
    const { spawn } = await import('child_process')
    
    const pythonProcess = spawn(pythonPath, [
      '-u',
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

    pythonProcess.stdout.on('data', (data) => {
      const output = data.toString()
      addLog(job, output.trim())

      // Map Python log output to timeline step transitions
      // Timeline: [0]=Workspace, [1]=Generate HTML, [2]=Record, [3]=Capture, [4]=Save, [5]=Post-process
      // Process each line individually (output may contain multiple lines)
      const lines = output.split('\n')
      for (const line of lines) {
        // Step 0→1: Workspace done, HTML generation starting
        if (line.includes('STEP 2') || line.includes('Generating Stream View HTML')) {
          if (job.timeline[0]?.status === 'running') {
            completeStep(job, 0)
            startStep(job, 1)
          }
        }
        // Step 1→2: HTML done, Playwright recording starting
        if (line.includes('STEP 3') || line.includes('Recording with Playwright')) {
          if (job.timeline[1]?.status === 'running') {
            completeStep(job, 1)
            startStep(job, 2)
          }
        }
        // Step 2→3: Recording started, capturing content
        if (line.includes('STEP 4') || line.includes('Recording content captured')) {
          if (job.timeline[2]?.status === 'running') {
            completeStep(job, 2)
            startStep(job, 3)
          }
        }
        // Step 3→4: Content captured, saving
        if (line.includes('STEP 5') || line.includes('Recording saved')) {
          if (job.timeline[3]?.status === 'running') {
            completeStep(job, 3)
            startStep(job, 4)
          }
        }
        // Step 4→5: Saved, post-processing
        if (line.includes('STEP 6') || line.includes('Post-processing video')) {
          if (job.timeline[4]?.status === 'running') {
            completeStep(job, 4)
            startStep(job, 5)
          }
        }
      }

      // Detect failures
      if (output.includes('[ERROR]') || output.includes('Pipeline failed')) {
        const runningStep = job.timeline.findIndex(s => s.status === 'running')
        if (runningStep >= 0) {
          updateTimeline(job, runningStep, 'failed', 0)
        }
      }
    })

    pythonProcess.stderr.on('data', (data) => {
      addLog(job, `⚠️ ${data.toString().trim()}`)
    })

    pythonProcess.on('close', (code) => {
      if (code === 0) {
        completeStep(job, job.timeline.length - 1)
        job.status = 'completed'
        job.videoUrl = `/out/final/job-${job.id}.mp4`
        job.duration = job.targetDuration || 45
        addLog(job, '✅ Vidéo créée avec succès!')
      } else {
        job.status = 'failed'
        const runningStep = job.timeline.findIndex(s => s.status === 'running')
        if (runningStep >= 0) {
          updateTimeline(job, runningStep, 'failed', 0)
        }
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

const stepStartTimes = new Map()

function startStep(job, index) {
  stepStartTimes.set(`${job.id}-${index}`, Date.now())
  updateTimeline(job, index, 'running', 0)
}

function completeStep(job, index) {
  const key = `${job.id}-${index}`
  const startTime = stepStartTimes.get(key)
  const duration = startTime ? Math.round((Date.now() - startTime) / 1000) : 0
  stepStartTimes.delete(key)
  updateTimeline(job, index, 'completed', duration)
}

function updateTimeline(job, index, status, duration = 0) {
  if (job.timeline[index]) {
    job.timeline[index].status = status
    if (duration > 0) {
      job.timeline[index].duration = duration
    }
  }
}

// Retry failed job
router.post('/:id/retry', async (req, res) => {
  try {
    const job = jobs.get(parseInt(req.params.id))
    if (!job) {
      return res.status(404).json({ error: 'Job not found' })
    }

    // Reset job state
    job.status = 'queued'
    job.logs = []
    job.videoUrl = null
    job.timeline = [
      { name: 'Préparer l\'espace de travail', status: 'pending', duration: 0 },
      { name: 'Générer la Stream View', status: 'pending', duration: 0 },
      { name: 'Enregistrer avec Playwright', status: 'pending', duration: 0 },
      { name: 'Capturer le contenu', status: 'pending', duration: 0 },
      { name: 'Sauvegarder l\'enregistrement', status: 'pending', duration: 0 },
      { name: 'Post-traitement vidéo', status: 'pending', duration: 0 },
    ]

    addLog(job, '🔄 Relancement du job...')
    processJob(job)

    res.json({ success: true })
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
