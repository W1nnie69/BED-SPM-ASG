const { Resend } = require('resend');
const resend = new Resend(process.env.RESEND_API_KEY);

async function sendResetEmail(toEmail, resetLink) {
  await resend.emails.send({
    from: 'onboarding@resend.dev', // Resend's test address, works without a custom domain
    to: toEmail,
    subject: 'Reset your password',
    html: `
      <p>We got a request to reset your password.</p>
      <p><a href="${resetLink}">Click here to reset your password</a></p>
      <p>This link expires in 30 minutes. If you didn't request this, ignore this email.</p>
    `
  });
}

module.exports = { sendResetEmail };