/**
 * Global Scheduler using Bull
 * Handles background job processing
 */

const Queue = require('bull');
const mailHelper = require('./mailHelper');


// Create Redis connection (you can configure this in your environment)
const redisConfig = {
  host: process.env.REDIS_HOST || 'localhost',
  port: process.env.REDIS_PORT || 6379,
  password: process.env.REDIS_PASSWORD || undefined,
  db: process.env.REDIS_DB || 0
};

// Create queues
const emailQueue = new Queue('email processing', {
  redis: redisConfig,
  defaultJobOptions: {
    removeOnComplete: 10,
    removeOnFail: 5,
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 2000,
    }
  }
});

// Process email jobs
emailQueue.process('sendWelcomeEmail', async (job) => {
  const { user, account } = job.data;
  
  try {
    await mailHelper.sendWelcomeEmail(user, account);
    console.log(`Welcome email sent successfully to ${user.email}`);
  } catch (error) {
    console.error(`Failed to send welcome email to ${user.email}:`, error);
    throw error;
  }
});

// Process password reset email jobs
emailQueue.process('sendPasswordResetEmail', async (job) => {
  const { user, account, resetToken } = job.data;
  
  try {
    await mailHelper.sendPasswordResetEmail(user, account, resetToken);
    console.log(`Password reset email sent successfully to ${user.email}`);
  } catch (error) {
    console.error(`Failed to send password reset email to ${user.email}:`, error);
    throw error;
  }
});

// Process other email types
emailQueue.process('sendNotificationEmail', async (job) => {
  const { user, subject, template, data } = job.data;
  
  try {
    await mailHelper.sendNotificationEmail(user, subject, template, data);
    console.log(`Notification email sent successfully to ${user.email}`);
  } catch (error) {
    console.error(`Failed to send notification email to ${user.email}:`, error);
    throw error;
  }
});

// Queue event handlers
emailQueue.on('completed', (job, result) => {
  console.log(`Job ${job.id} completed successfully`);
});

emailQueue.on('failed', (job, err) => {
  console.error(`Job ${job.id} failed:`, err.message);
});

emailQueue.on('stalled', (job) => {
  console.warn(`Job ${job.id} stalled`);
});

// Global scheduler methods
const scheduler = {
  /**
   * Add welcome email job to queue
   * @param {Object} user - User object
   * @param {Object} account - Account object
   * @param {Object} options - Job options
   */
  sendWelcomeEmail: (user, account, options = {}) => {
    return emailQueue.add('sendWelcomeEmail', { user, account }, {
      delay: options.delay || 0,
      priority: options.priority || 0,
      ...options
    });
  },

  /**
   * Add password reset email job to queue
   * @param {Object} user - User object
   * @param {Object} account - Account object
   * @param {String} resetToken - JWT reset token
   * @param {Object} options - Job options
   */
  sendPasswordResetEmail: (user, account, resetToken, options = {}) => {
    return emailQueue.add('sendPasswordResetEmail', { user, account, resetToken }, {
      delay: options.delay || 0,
      priority: options.priority || 0,
      ...options
    });
  },

  /**
   * Add notification email job to queue
   * @param {Object} user - User object
   * @param {String} subject - Email subject
   * @param {String} template - Email template name
   * @param {Object} data - Template data
   * @param {Object} options - Job options
   */
  sendNotificationEmail: (user, subject, template, data, options = {}) => {
    return emailQueue.add('sendNotificationEmail', { user, subject, template, data }, {
      delay: options.delay || 0,
      priority: options.priority || 0,
      ...options
    });
  },

  /**
   * Get queue statistics
   */
  getStats: async () => {
    const waiting = await emailQueue.getWaiting();
    const active = await emailQueue.getActive();
    const completed = await emailQueue.getCompleted();
    const failed = await emailQueue.getFailed();

    return {
      waiting: waiting.length,
      active: active.length,
      completed: completed.length,
      failed: failed.length
    };
  },

  /**
   * Clean completed and failed jobs
   */
  clean: async () => {
    await emailQueue.clean(5000, 'completed');
    await emailQueue.clean(5000, 'failed');
  },

  /**
   * Pause queue
   */
  pause: () => {
    return emailQueue.pause();
  },

  /**
   * Resume queue
   */
  resume: () => {
    return emailQueue.resume();
  }
};

module.exports = scheduler;
