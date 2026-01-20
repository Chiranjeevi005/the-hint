
import nodemailer from 'nodemailer';

export async function sendMagicLinkEmail(email: string, token: string) {
    const smtpHost = process.env.SMTP_HOST;
    const smtpPort = process.env.SMTP_PORT;
    const smtpUser = process.env.SMTP_USER;
    const smtpPass = process.env.SMTP_PASS;
    const fromEmail = process.env.FROM_EMAIL;
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3002';

    if (!smtpHost || !smtpPort || !smtpUser || !smtpPass || !fromEmail) {
        console.error('Missing SMTP configuration');
        // In dev, maybe log the link?
        console.log(`[DEV] Magic Link: ${appUrl}/api/auth/verify?token=${token}`);

        if (process.env.NODE_ENV === 'production') {
            throw new Error('SMTP configuration missing in production');
        }
        return;
    }

    const transporter = nodemailer.createTransport({
        host: smtpHost,
        port: Number(smtpPort),
        secure: Number(smtpPort) === 465,
        auth: {
            user: smtpUser,
            pass: smtpPass,
        },
    });

    const link = `${appUrl}/api/auth/verify?token=${token}`;

    try {
        await transporter.sendMail({
            from: fromEmail,
            to: email,
            subject: 'Sign in to The Hint Editor',
            text: `Click this link to sign in: ${link}`,
            html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
          <h2>Sign in to The Hint</h2>
          <p>Click the button below to sign in to the editorial console.</p>
          <a href="${link}" style="display: inline-block; padding: 12px 24px; background-color: #000; color: #fff; text-decoration: none; border-radius: 4px; margin: 16px 0;">Sign In</a>
          <p style="color: #666; font-size: 14px;">This link expires in ${process.env.MAGIC_LINK_EXPIRY_MINUTES || 15} minutes.</p>
          <p style="color: #666; font-size: 12px; margin-top: 24px;">If you didn't request this, you can safely ignore this email.</p>
        </div>
      `,
        });
    } catch (error) {
        console.error('Failed to send email:', error);
        // Fallback log for debugging if email fails (crucial for setup verification)
        console.log(`[FALLBACK ALERT] Email failed. Magic Link: ${link}`);
        throw new Error('Failed to send magic link email');
    }
}
