import nodemailer from "nodemailer";

export async function sendPasswordResetEmail(to: string, resetUrl: string) {
  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST!,
    port: Number(process.env.SMTP_PORT || 587),
    secure: false,
    auth: {
      user: process.env.SMTP_USER!,
      pass: process.env.SMTP_PASS!,
    },
  });

  const from = process.env.EMAIL_FROM || "Support <no-reply@example.com>";

  const html = `
    <div style="font-family:Arial,Helvetica,sans-serif;line-height:1.6">
      <h2>Reset your password</h2>
      <p>Click the button below to set a new password. This link expires in 1 hour.</p>
      <p>
        <a href="${resetUrl}" style="display:inline-block;background:#111;color:#fff;padding:10px 16px;border-radius:6px;text-decoration:none">
          Reset Password
        </a>
      </p>
      <p>If the button doesn't work, copy and paste this link:</p>
      <p style="word-break:break-all">${resetUrl}</p>
    </div>
  `;

  await transporter.sendMail({ from, to, subject: "Reset your Shoppay password", html });
}