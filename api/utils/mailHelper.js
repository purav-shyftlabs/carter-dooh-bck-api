/**
 * Global Mail Helper
 * Handles email sending functionality
 */

const nodemailer = require('nodemailer');


// Create transporter with Gmail configuration
const transporter = nodemailer.createTransport({
  service: 'Gmail',
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS
  }
});

// Verify transporter configuration (non-blocking)
transporter.verify((error, success) => {
  if (error) {
    console.warn('⚠️  SMTP configuration issue:', error.message);
    console.warn('📧 Email functionality may not work properly. Check your SMTP settings.');
  } else {
    console.log('✅ SMTP server is ready to send emails');
  }
});

/**
 * Send welcome email to newly created user
 * @param {Object} user - User object
 * @param {Object} account - Account object
 */
const sendWelcomeEmail = async (user, account) => {
  // Check if email is properly configured
  if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
    console.log(`📧 Email not configured - would send welcome email to ${user.email} for ${account.name}`);
    console.log(`📧 To enable email sending, add SMTP_USER and SMTP_PASS to your .env file`);
    return { messageId: 'mock-email-id', accepted: [user.email] };
  }

  const mailOptions = {
    from: `"${account.name}" <${process.env.FROM_EMAIL || process.env.SMTP_USER || 'noreply@example.com'}>`,
    to: user.email,
    subject: `Welcome to ${account.name}!`,
    html: generateWelcomeEmailHTML(user, account),
    text: generateWelcomeEmailText(user, account)
  };

  try {
    const result = await transporter.sendMail(mailOptions);
    console.log('Welcome email sent:', result.messageId);
    return result;
  } catch (error) {
    console.error('Error sending welcome email:', error);
    // Don't throw error to prevent job failures - just log it
    console.log(`📧 Email failed but continuing - would send welcome email to ${user.email} for ${account.name}`);
    return { messageId: 'failed-email-id', accepted: [user.email] };
  }
};

/**
 * Send notification email
 * @param {Object} user - User object
 * @param {String} subject - Email subject
 * @param {String} template - Template name
 * @param {Object} data - Template data
 */
const sendNotificationEmail = async (user, subject, template, data = {}) => {
  const mailOptions = {
    from: `"System" <${process.env.FROM_EMAIL || emailConfig.auth.user}>`,
    to: user.email,
    subject: subject,
    html: generateTemplateHTML(template, { user, ...data }),
    text: generateTemplateText(template, { user, ...data })
  };

  try {
    const result = await transporter.sendMail(mailOptions);
    console.log('Notification email sent:', result.messageId);
    return result;
  } catch (error) {
    console.error('Error sending notification email:', error);
    throw error;
  }
};

/**
 * Generate welcome email HTML
 * @param {Object} user - User object
 * @param {Object} account - Account object
 */
const generateWelcomeEmailHTML = (user, account) => {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>Welcome to ${account.name}</title>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background-color: #f4f4f4; padding: 20px; text-align: center; }
        .content { padding: 20px; }
        .footer { background-color: #f4f4f4; padding: 20px; text-align: center; font-size: 12px; }
        .button { display: inline-block; padding: 10px 20px; background-color: #007bff; color: white; text-decoration: none; border-radius: 5px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>Welcome to ${account.name}!</h1>
        </div>
        <div class="content">
          <h2>Hello ${user.firstName} ${user.lastName},</h2>
          <p>Welcome to ${account.name}! We're excited to have you on board.</p>
          <p>Your account has been successfully created with the following details:</p>
          <ul>
            <li><strong>Name:</strong> ${user.name}</li>
            <li><strong>Email:</strong> ${user.email}</li>
            <li><strong>Account:</strong> ${account.name}</li>
            <li><strong>User Type:</strong> ${user.userType || 'Standard'}</li>
          </ul>
          <p>You can now log in to your account and start using our platform.</p>
          <p>If you have any questions, please don't hesitate to contact our support team.</p>
          <p>Best regards,<br>The ${account.name} Team</p>
        </div>
        <div class="footer">
          <p>This is an automated message. Please do not reply to this email.</p>
        </div>
      </div>
    </body>
    </html>
  `;
};

/**
 * Generate welcome email text
 * @param {Object} user - User object
 * @param {Object} account - Account object
 */
const generateWelcomeEmailText = (user, account) => {
  return `
Welcome to ${account.name}!

Hello ${user.firstName} ${user.lastName},

Welcome to ${account.name}! We're excited to have you on board.

Your account has been successfully created with the following details:
- Name: ${user.name}
- Email: ${user.email}
- Account: ${account.name}
- User Type: ${user.userType || 'Standard'}

You can now log in to your account and start using our platform.

If you have any questions, please don't hesitate to contact our support team.

Best regards,
The ${account.name} Team

---
This is an automated message. Please do not reply to this email.
  `;
};

/**
 * Generate template HTML (placeholder for future templates)
 * @param {String} template - Template name
 * @param {Object} data - Template data
 */
const generateTemplateHTML = (template, data) => {
  // Placeholder for template system
  return `<h1>Notification</h1><p>Template: ${template}</p>`;
};

/**
 * Generate template text (placeholder for future templates)
 * @param {String} template - Template name
 * @param {Object} data - Template data
 */
const generateTemplateText = (template, data) => {
  // Placeholder for template system
  return `Notification\nTemplate: ${template}`;
};

/**
 * Test email configuration
 */
const testEmailConfig = async () => {
  try {
    await transporter.verify();
    console.log('Email configuration is valid');
    return true;
  } catch (error) {
    console.error('Email configuration error:', error);
    return false;
  }
};

module.exports = {
  sendWelcomeEmail,
  sendNotificationEmail,
  testEmailConfig,
  transporter
};
