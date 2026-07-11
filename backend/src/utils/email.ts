import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.mailtrap.io',
  port: parseInt(process.env.SMTP_PORT || '2525'),
  auth: {
    user: process.env.SMTP_USER || '',
    pass: process.env.SMTP_PASS || '',
  },
});

export async function sendEmail({ to, subject, html }: { to: string; subject: string; html: string }) {
  try {
    const info = await transporter.sendMail({
      from: process.env.SMTP_FROM || '"Smart Stadium Platform" <noreply@smartstadium.com>',
      to,
      subject,
      html,
    });
    console.log(`[Email Dispatcher] Sent email id: ${info.messageId} to ${to}`);
    return info;
  } catch (err) {
    console.error('[Email Dispatcher] Failed to dispatch email:', err);
    // Don't throw in production, just log to prevent server crashes
  }
}

export async function sendVerificationEmail(to: string, name: string, otp: string) {
  const html = `
    <div style="font-family: sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 12px; background-color: #ffffff;">
      <h2 style="color: #4f46e5; margin-bottom: 20px;">Verify Your Email Address</h2>
      <p>Hello <strong>${name}</strong>,</p>
      <p>Thank you for registering on the Smart Stadium & Tournament Operations Platform. Use the verification code below to confirm your account status:</p>
      <div style="font-size: 24px; font-weight: bold; text-align: center; padding: 15px; margin: 20px 0; background-color: #f3f4f6; border-radius: 8px; border: 1px dashed #4f46e5; color: #4f46e5; letter-spacing: 4px;">
        ${otp}
      </div>
      <p style="color: #64748b; font-size: 12px; margin-top: 30px;">This OTP is valid for 10 minutes. If you did not request this verification, please ignore this email.</p>
    </div>
  `;
  return sendEmail({ to, subject: 'Confirm Your Smart Stadium Registration', html });
}

export async function sendPasswordResetEmail(to: string, name: string, token: string) {
  const resetUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/forgot-password?token=${token}`;
  const html = `
    <div style="font-family: sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 12px; background-color: #ffffff;">
      <h2 style="color: #4f46e5; margin-bottom: 20px;">Password Reset Request</h2>
      <p>Hello <strong>${name}</strong>,</p>
      <p>We received a request to reset your password. Click the button below to configure new credentials:</p>
      <div style="text-align: center; margin: 30px 0;">
        <a href="${resetUrl}" style="background-color: #4f46e5; color: #ffffff; padding: 12px 24px; text-decoration: none; font-weight: bold; border-radius: 8px; display: inline-block;">Reset Password</a>
      </div>
      <p>Or copy and paste this link in your browser URL field:</p>
      <p style="word-break: break-all; color: #64748b; font-size: 11px;">${resetUrl}</p>
      <p style="color: #64748b; font-size: 12px; margin-top: 30px;">If you did not request a password change, no further action is required.</p>
    </div>
  `;
  return sendEmail({ to, subject: 'Reset Your Smart Stadium Password', html });
}

export async function sendTicketReceiptEmail(to: string, name: string, bookingId: string, zone: string, seat: string, price: number) {
  const html = `
    <div style="font-family: sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 12px; background-color: #ffffff;">
      <h2 style="color: #10b981; margin-bottom: 20px;">Your Booking Confirmation</h2>
      <p>Hello <strong>${name}</strong>,</p>
      <p>Your ticket purchase has been approved successfully. Details of your seat reservation are listed below:</p>
      
      <table style="width: 100%; border-collapse: collapse; margin: 20px 0; font-size: 13px;">
        <tr style="border-bottom: 1px solid #e2e8f0; text-align: left;">
          <th style="padding: 10px 0; color: #64748b;">Booking Reference</th>
          <td style="padding: 10px 0; font-weight: bold; text-align: right;">${bookingId.slice(0, 8)}</td>
        </tr>
        <tr style="border-bottom: 1px solid #e2e8f0; text-align: left;">
          <th style="padding: 10px 0; color: #64748b;">Stadium Seating Zone</th>
          <td style="padding: 10px 0; font-weight: bold; text-align: right;">${zone}</td>
        </tr>
        <tr style="border-bottom: 1px solid #e2e8f0; text-align: left;">
          <th style="padding: 10px 0; color: #64748b;">Seat Designation</th>
          <td style="padding: 10px 0; font-weight: bold; text-align: right;">${seat}</td>
        </tr>
        <tr style="border-bottom: 1px solid #e2e8f0; text-align: left;">
          <th style="padding: 10px 0; color: #64748b;">Amount Paid</th>
          <td style="padding: 10px 0; font-weight: bold; text-align: right; color: #10b981;">$${price}</td>
        </tr>
      </table>

      <p style="text-align: center; margin-top: 30px;">
        Your digital QR ticket code can be accessed directly from your User Dashboard in the <strong>Ticket Office</strong> tab. Present the QR code card at the stadium entry gates for verification check-in.
      </p>

      <p style="color: #64748b; font-size: 12px; margin-top: 30px; text-align: center;">Enjoy the match! Stadium gates open 2 hours prior to kickoff.</p>
    </div>
  `;
  return sendEmail({ to, subject: 'Smart Stadium Match Ticket Invoice', html });
}
