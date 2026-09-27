const { Resend } = require('resend');

const getResendClient = () => {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey || apiKey === 're_your_resend_api_key') {
    return null;
  }
  return new Resend(apiKey);
};

/**
 * Generates branded HTML template for Password Reset Email
 */
const getPasswordResetHtml = ({ name, resetUrl, userType = 'customer' }) => {
  const displayName = name ? name.trim() : (userType === 'admin' ? 'Admin' : 'Valued Customer');
  const appTitle = userType === 'admin' ? 'Kunal Sarees Admin Portal' : 'Kunal Sarees Wholesale';

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Reset Your Password - ${appTitle}</title>
  <style>
    body {
      margin: 0;
      padding: 0;
      background-color: #f8f6f3;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
      color: #1a1a1a;
      -webkit-font-smoothing: antialiased;
    }
    .wrapper {
      width: 100%;
      table-layout: fixed;
      background-color: #f8f6f3;
      padding: 40px 10px;
    }
    .container {
      max-width: 560px;
      margin: 0 auto;
      background-color: #ffffff;
      border-radius: 8px;
      border: 1px solid #e7e2da;
      overflow: hidden;
      box-shadow: 0 4px 16px rgba(0, 0, 0, 0.04);
    }
    .header {
      background: linear-gradient(135deg, #4a0404 0%, #2b0202 100%);
      padding: 32px 24px;
      text-align: center;
    }
    .brand-badge {
      display: inline-block;
      width: 44px;
      height: 44px;
      line-height: 44px;
      background: #c59b27;
      color: #ffffff;
      font-weight: bold;
      font-size: 18px;
      border-radius: 6px;
      margin-bottom: 12px;
      letter-spacing: 1px;
    }
    .brand-title {
      color: #ffffff;
      margin: 0;
      font-size: 22px;
      font-weight: 600;
      letter-spacing: 0.5px;
    }
    .brand-subtitle {
      color: #e2c074;
      margin: 6px 0 0;
      font-size: 12px;
      text-transform: uppercase;
      letter-spacing: 1.5px;
    }
    .content {
      padding: 36px 32px;
    }
    .greeting {
      font-size: 18px;
      font-weight: 600;
      color: #1a1a1a;
      margin: 0 0 16px;
    }
    .message {
      font-size: 15px;
      line-height: 1.6;
      color: #4a4a4a;
      margin: 0 0 24px;
    }
    .button-container {
      text-align: center;
      margin: 32px 0;
    }
    .button {
      display: inline-block;
      background: #7a1c1c;
      color: #ffffff !important;
      text-decoration: none;
      font-size: 15px;
      font-weight: 600;
      padding: 14px 32px;
      border-radius: 6px;
      box-shadow: 0 2px 8px rgba(122, 28, 28, 0.25);
    }
    .expiry-alert {
      background-color: #fff9e6;
      border-left: 4px solid #c59b27;
      padding: 12px 16px;
      font-size: 13px;
      color: #735500;
      border-radius: 0 4px 4px 0;
      margin: 24px 0;
    }
    .fallback-url {
      font-size: 12px;
      color: #777777;
      word-break: break-all;
      line-height: 1.5;
      margin: 24px 0 0;
      padding-top: 20px;
      border-top: 1px solid #f0ece5;
    }
    .fallback-url a {
      color: #7a1c1c;
      text-decoration: underline;
    }
    .footer {
      background-color: #faf8f5;
      border-top: 1px solid #e7e2da;
      padding: 24px;
      text-align: center;
      font-size: 12px;
      color: #888888;
      line-height: 1.6;
    }
    .footer p {
      margin: 4px 0;
    }
  </style>
</head>
<body>
  <div class="wrapper">
    <table role="presentation" class="container" align="center" cellpadding="0" cellspacing="0">
      <tr>
        <td class="header">
          <div class="brand-badge">KS</div>
          <h1 class="brand-title">Kunal Sarees</h1>
          <p class="brand-subtitle">Wholesale Premium Sarees</p>
        </td>
      </tr>
      <tr>
        <td class="content">
          <p class="greeting">Namaste ${displayName},</p>
          <p class="message">
            We received a request to reset the password for your account on <strong>${appTitle}</strong>. Click the button below to set a new password:
          </p>

          <div class="button-container">
            <a href="${resetUrl}" class="button" target="_blank">Reset My Password</a>
          </div>

          <div class="expiry-alert">
            ⏱ <strong>Important:</strong> This password reset link will expire in <strong>30 minutes</strong> for your security.
          </div>

          <p class="message" style="font-size: 13px; color: #666666; margin-bottom: 0;">
            If you did not request a password reset, please ignore this email or reach out to our support team if you suspect unauthorized activity. Your current password will remain safe and unchanged.
          </p>

          <div class="fallback-url">
            If the button doesn't work, copy and paste this link into your browser:<br>
            <a href="${resetUrl}" target="_blank">${resetUrl}</a>
          </div>
        </td>
      </tr>
      <tr>
        <td class="footer">
          <p><strong>Kunal Sarees Wholesale</strong> • Surat, Gujarat, India</p>
          <p>This is an automated system email. Please do not reply directly to this message.</p>
        </td>
      </tr>
    </table>
  </div>
</body>
</html>`;
};

const nodemailer = require('nodemailer');

/**
 * Normalizes sender address for Resend.
 * Public webmail domains (gmail.com, yahoo.com, etc.) cannot be used as sender without domain verification.
 */
const getValidFromEmail = () => {
  const configured = (process.env.RESEND_FROM_EMAIL || '').trim();
  if (
    !configured ||
    /@(gmail\.com|yahoo\.com|outlook\.com|hotmail\.com)/i.test(configured)
  ) {
    return 'Kunal Sarees <mail@kunalsarees.in>';
  }
  return configured;
};

/**
 * Gets Nodemailer transporter if SMTP / Gmail credentials are provided
 */
const getSmtpTransporter = () => {
  const user = (process.env.SMTP_USER || process.env.EMAIL_USER || '').trim();
  const rawPass = process.env.SMTP_PASS || process.env.EMAIL_PASS || '';
  const pass = rawPass.replace(/\s+/g, '').trim();

  if (user && pass) {
    return nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user,
        pass,
      },
    });
  }
  return null;
};

/**
 * Sends password reset email using Resend API or Gmail SMTP (with console fallback in development)
 *
 * @param {Object} options
 * @param {string} options.to - Recipient email address
 * @param {string} options.name - Recipient name
 * @param {string} options.resetUrl - Full password reset URL with token
 * @param {string} [options.userType='customer'] - 'customer' or 'admin'
 */
const sendPasswordResetEmail = async ({ to, name, resetUrl, userType = 'customer' }) => {
  const fromEmail = getValidFromEmail();
  const subject = userType === 'admin'
    ? '🔐 Password Reset Request - Kunal Sarees Admin'
    : '🔐 Password Reset Request - Kunal Sarees Wholesale';

  const html = getPasswordResetHtml({ name, resetUrl, userType });
  const text = `Namaste ${name || 'User'},\n\nWe received a request to reset your password on Kunal Sarees.\n\nPlease use the following link to reset your password (valid for 30 minutes):\n${resetUrl}\n\nIf you did not request this, you can safely ignore this email.\n\nKunal Sarees Wholesale`;

  let lastError = null;

  // 1. Try Resend API FIRST (primary transactional provider with verified domain kunalsarees.in)
  const resend = getResendClient();
  if (resend) {
    try {
      console.log(`📤 [Email Service] Sending password reset email via Resend to ${to} from ${fromEmail}...`);
      const { data, error } = await resend.emails.send({
        from: fromEmail,
        to,
        subject,
        html,
        text,
      });

      if (error) {
        console.warn(`⚠️ [Resend Error]: ${error.message} (code: ${error.name || error.statusCode})`);
        lastError = new Error(error.message || 'Resend API failed to send email');
      } else {
        console.log(`✅ [Resend Email Sent] Password reset email sent to ${to} (Message ID: ${data?.id})`);
        return { success: true, provider: 'resend', data };
      }
    } catch (err) {
      console.warn(`⚠️ [Resend Exception]: ${err.message}. Falling back to SMTP...`);
      lastError = err;
    }
  }

  // 2. Fallback to Gmail SMTP if Resend is unavailable or encountered an error
  const smtp = getSmtpTransporter();
  if (smtp) {
    try {
      const sender = process.env.SMTP_USER || process.env.EMAIL_USER;
      console.log(`📤 [Email Service] Attempting fallback via Gmail SMTP to ${to}...`);
      const info = await smtp.sendMail({
        from: `Kunal Sarees <${sender}>`,
        to,
        subject,
        html,
        text,
      });
      console.log(`✅ [SMTP Email Sent] Email sent to ${to} (Message ID: ${info.messageId})`);
      return { success: true, provider: 'smtp', data: info };
    } catch (smtpErr) {
      console.error(`❌ [SMTP Error]: ${smtpErr.message}`);
      lastError = smtpErr;
    }
  }

  // If both providers failed or were not configured
  if (lastError) {
    console.error(`❌ [Email Service Error]: Failed to send password reset email to ${to}: ${lastError.message}`);
    if (process.env.NODE_ENV === 'development') {
      console.log(`\n================================================================`);
      console.log(`📧 [DEV FALLBACK - RESET LINK AVAILABLE IN CONSOLE]`);
      console.log(`   Recipient: ${to}`);
      console.log(`   Reset URL: ${resetUrl}`);
      console.log(`   Error:     ${lastError.message}`);
      console.log(`================================================================\n`);
    }
    throw lastError;
  }

  // Neither Resend nor SMTP is configured
  console.log(`\n================================================================`);
  console.log(`📧 [EMAIL SERVICE - DEV LOG] Neither Resend nor SMTP configured.`);
  console.log(`   To:        ${to}`);
  console.log(`   Subject:   ${subject}`);
  console.log(`   Reset URL: ${resetUrl}`);
  console.log(`================================================================\n`);
  return { success: true, mocked: true };
};

module.exports = {
  sendPasswordResetEmail,
  getPasswordResetHtml,
};
