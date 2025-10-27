import express from 'express'

const router = express.Router()

// In-memory queue (replace with database in production)
const queue = []

// Get queue
router.get('/', async (req, res) => {
  try {
    res.json(queue)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

// Add to queue
router.post('/', async (req, res) => {
  try {
    const item = {
      id: Date.now(),
      ...req.body,
      status: 'queued',
      createdAt: new Date().toISOString(),
    }
    queue.push(item)
    res.json(item)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

export default router
