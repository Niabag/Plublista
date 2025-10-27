/**
 * Job Scheduler
 * Monitors scheduled jobs and publishes them at the right time
 */

import fetch from 'node-fetch'

class JobScheduler {
  constructor() {
    this.scheduledJobs = new Map()
    this.checkInterval = 60000 // Check every minute
    this.intervalId = null
  }

  start() {
    console.log('📅 Job Scheduler started')
    this.intervalId = setInterval(() => this.checkScheduledJobs(), this.checkInterval)
  }

  stop() {
    if (this.intervalId) {
      clearInterval(this.intervalId)
      console.log('📅 Job Scheduler stopped')
    }
  }

  async checkScheduledJobs() {
    try {
      // Fetch all scheduled jobs from API
      const response = await fetch('http://localhost:3000/api/jobs/scheduled')
      const jobs = await response.json()

      const now = new Date()

      for (const job of jobs) {
        if (!job.scheduledFor) continue

        const scheduledTime = new Date(job.scheduledFor)
        
        // If scheduled time has passed, publish the job
        if (scheduledTime <= now && job.publishStatus === 'scheduled') {
          console.log(`📤 Publishing scheduled job: ${job.title} (ID: ${job.id})`)
          await this.publishJob(job)
        }
      }
    } catch (error) {
      console.error('❌ Scheduler error:', error.message)
    }
  }

  async publishJob(job) {
    try {
      // Call Instagram publish endpoint
      const response = await fetch(`http://localhost:3000/api/jobs/${job.id}/publish`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      })

      const result = await response.json()

      if (response.ok) {
        console.log(`✅ Job ${job.id} published successfully`)
      } else {
        console.error(`❌ Failed to publish job ${job.id}:`, result.error)
      }
    } catch (error) {
      console.error(`❌ Error publishing job ${job.id}:`, error.message)
    }
  }

  // Add or update a scheduled job
  scheduleJob(job) {
    if (job.scheduledFor) {
      this.scheduledJobs.set(job.id, job)
      console.log(`📅 Job ${job.id} scheduled for ${new Date(job.scheduledFor).toLocaleString()}`)
    }
  }

  // Remove a scheduled job
  unscheduleJob(jobId) {
    if (this.scheduledJobs.has(jobId)) {
      this.scheduledJobs.delete(jobId)
      console.log(`📅 Job ${jobId} unscheduled`)
    }
  }
}

export default JobScheduler
