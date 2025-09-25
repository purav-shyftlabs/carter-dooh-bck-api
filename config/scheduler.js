/**
 * Scheduler Configuration
 * Initialize Bull scheduler when Sails lifts
 */

const scheduler = require('../api/utils/scheduler');

module.exports.scheduler = {

  /**
   * Initialize scheduler when Sails lifts
   */
  initialize: function(cb) {
    console.log('Initializing Bull scheduler...');
    
    // Test email configuration
    const mailHelper = require('../api/utils/mailHelper');
    mailHelper.testEmailConfig().then(isValid => {
      if (isValid) {
        console.log(' Email configuration is valid');
      } else {
        console.warn('⚠️  Email configuration has issues - check your SMTP settings');
      }
    });

    // Clean old jobs on startup
    scheduler.clean().then(() => {
      console.log(' Scheduler initialized successfully');
      cb();
    }).catch(error => {
      console.error('❌ Scheduler initialization failed:', error);
      cb(error);
    });
  }
};
