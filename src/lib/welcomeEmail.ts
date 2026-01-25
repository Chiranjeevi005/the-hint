import nodemailer from 'nodemailer';
import { getActiveSubscribers } from './subscription';
import { getAllArticles } from './content/reader';

const EMAIL_LOG_FILE = 'sent-emails.log';

// Create reusable transporter using Gmail SMTP
function createTransporter() {
    return nodemailer.createTransport({
        host: process.env.SMTP_HOST || 'smtp.gmail.com',
        port: parseInt(process.env.SMTP_PORT || '587'),
        secure: false, // true for 465, false for other ports
        auth: {
            user: process.env.SMTP_USER,
            pass: process.env.SMTP_PASS,
        },
    });
}

interface ArticleEmailData {
    headline: string;
    summary: string;
    section: string;
    publishedAt: string;
    url: string;
}

export async function sendArticleEmail(article: ArticleEmailData): Promise<void> {
    const subscribers = getActiveSubscribers();

    if (subscribers.length === 0) {
        console.log('[EMAIL-SYSTEM] No active subscribers to send email to.');
        return;
    }

    const subject = `THE HINT: ${article.headline}`;
    const htmlContent = `
        <div style="font-family: Georgia, serif; max-width: 600px; margin: 0 auto; color: #111; background-color: #ffffff;">
            <div style="text-align: center; padding: 20px 0; border-bottom: 2px solid #111;">
                <h1 style="font-size: 28px; font-weight: 900; letter-spacing: -0.5px; margin: 0;">THE HINT</h1>
            </div>
            <div style="padding: 30px 20px;">
                <p style="text-transform: uppercase; font-size: 11px; color: #666; letter-spacing: 1px; margin: 0 0 10px 0;">
                    ${article.section} • ${new Date(article.publishedAt).toLocaleDateString()}
                </p>
                <h2 style="font-size: 28px; margin: 0 0 15px 0; line-height: 1.2; font-weight: bold;">${article.headline}</h2>
                <p style="font-size: 17px; line-height: 1.6; color: #333; margin: 0 0 25px 0;">
                    ${article.summary}
                </p>
                <a href="${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}${article.url}" 
                   style="display: inline-block; background: #111; color: #fff; text-decoration: none; padding: 14px 28px; font-family: Arial, sans-serif; font-weight: bold; text-transform: uppercase; font-size: 12px; letter-spacing: 1px;">
                    Read Full Article
                </a>
            </div>
            <div style="border-top: 1px solid #ddd; padding: 20px; font-family: Arial, sans-serif; font-size: 11px; color: #888; text-align: center;">
                You are receiving this because you subscribed to The Hint.<br>
                <a href="#" style="color: #666; text-decoration: underline;">Unsubscribe</a>
            </div>
        </div>
    `;

    console.log(`[EMAIL-SYSTEM] Preparing to dispatch "${article.headline}" to ${subscribers.length} subscribers.`);

    const transporter = createTransporter();
    const fromAddress = process.env.SMTP_FROM || process.env.SMTP_USER;

    // Send to each subscriber
    for (const recipientEmail of subscribers) {
        try {
            await transporter.sendMail({
                from: fromAddress,
                to: recipientEmail,
                subject: subject,
                html: htmlContent,
            });
            console.log(`[EMAIL-SYSTEM] ✓ Sent article email to ${recipientEmail}`);
        } catch (error) {
            console.error(`[EMAIL-SYSTEM] ✗ Failed to send to ${recipientEmail}:`, error);
        }
    }

    // Log to file
    const fs = await import('fs');
    const logEntry = JSON.stringify({
        timestamp: new Date().toISOString(),
        action: 'ARTICLE_EMAIL_SENT',
        recipientCount: subscribers.length,
        article: article.headline,
    }) + '\n';
    fs.appendFileSync(EMAIL_LOG_FILE, logEntry);

    console.log(`[EMAIL-SYSTEM] Successfully dispatched article to ${subscribers.length} recipients.`);
}

export async function sendWelcomeEmail(email: string): Promise<void> {
    const allArticles = getAllArticles();
    const latestStory = allArticles.find(a => a.contentType !== 'opinion') || allArticles[0];

    const subject = "You're subscribed — here's what to expect";

    const latestStoryHtml = latestStory ? `
        <div style="margin-top: 30px; border: 1px solid #E5E5E5; padding: 20px; background-color: #F7F6F2; text-align: left;">
            <div style="font-family: Arial, sans-serif; font-size: 10px; font-weight: bold; text-transform: uppercase; letter-spacing: 1px; color: #666; margin-bottom: 8px;">
                LATEST STORY
            </div>
            <h3 style="font-family: Georgia, serif; font-size: 20px; font-weight: bold; color: #111; margin: 0 0 8px 0; line-height: 1.2;">
                ${latestStory.title}
            </h3>
            <p style="font-family: Arial, sans-serif; font-size: 14px; color: #333; line-height: 1.5; margin: 0 0 12px 0;">
                ${latestStory.subtitle || 'Read the full coverage on our website.'}
            </p>
            <div style="font-family: Arial, sans-serif; font-size: 11px; color: #888; margin-bottom: 20px;">
                 ${latestStory.section.toUpperCase()} • ${new Date(latestStory.publishedAt).toLocaleDateString()}
            </div>
            <a href="${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/${latestStory.section}/${latestStory.id}" 
               style="display: inline-block; background: #111; color: #fff; text-decoration: none; padding: 12px 24px; font-family: Arial, sans-serif; font-weight: bold; font-size: 12px; text-transform: uppercase; letter-spacing: 0.5px;">
                Read the full article →
            </a>
        </div>
    ` : '';

    const htmlContent = `
        <div style="font-family: Georgia, serif; max-width: 600px; margin: 0 auto; color: #111; background-color: #ffffff; padding: 0;">
            <!-- Header -->
            <div style="text-align: center; padding: 30px 20px; border-bottom: 1px solid #E5E5E5;">
                <h1 style="font-size: 32px; font-weight: 900; letter-spacing: -0.5px; margin: 0;">THE HINT</h1>
            </div>

            <div style="padding: 30px 25px;">
                <!-- Opening Line -->
                <p style="font-family: Georgia, serif; font-size: 18px; line-height: 1.6; color: #111; margin: 0 0 10px 0;">
                    Thank you for subscribing.
                </p>
                <p style="font-family: Georgia, serif; font-size: 18px; line-height: 1.6; color: #111; margin: 0 0 30px 0;">
                    You'll now receive important reporting, investigations, and analysis directly from our newsroom.
                </p>

                <!-- Editorial Mission -->
                <div style="background-color: #F9F9F9; padding: 20px; border-left: 4px solid #111; margin-bottom: 30px;">
                    <p style="font-family: Georgia, serif; font-style: italic; font-size: 16px; line-height: 1.6; color: #333; margin: 0;">
                        "We believe journalism should be calm, factual, and independent. Our reporting focuses on what matters — not what trends — with clear separation between news and opinion."
                    </p>
                </div>

                <!-- What to Expect -->
                <div style="margin-bottom: 30px; font-family: Arial, sans-serif;">
                    <p style="font-size: 12px; font-weight: bold; text-transform: uppercase; color: #888; letter-spacing: 1px; margin-bottom: 15px;">
                        WHAT TO EXPECT
                    </p>
                    <table style="width: 100%; border-collapse: collapse;">
                        <tr><td style="padding: 10px 0; border-bottom: 1px solid #eee; color: #111; font-size: 15px;">Breaking news when it matters</td></tr>
                        <tr><td style="padding: 10px 0; border-bottom: 1px solid #eee; color: #111; font-size: 15px;">Major stories and investigations</td></tr>
                        <tr><td style="padding: 10px 0; border-bottom: 1px solid #eee; color: #111; font-size: 15px;">Opinion clearly labeled and separated</td></tr>
                        <tr><td style="padding: 15px 0 0 0; color: #666; font-size: 13px;">We do not send promotional emails.</td></tr>
                    </table>
                </div>

                <!-- Latest Article Preview -->
                ${latestStoryHtml}

                <!-- Gentle Engagement -->
                <div style="text-align: center; margin-top: 40px; padding-top: 25px; border-top: 1px solid #E5E5E5;">
                    <p style="font-family: Arial, sans-serif; font-size: 14px; color: #444; margin-bottom: 10px;">
                        You can visit the homepage anytime for the latest coverage.
                    </p>
                    <a href="${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}" style="font-family: Arial, sans-serif; font-size: 14px; font-weight: bold; color: #111; text-decoration: none;">
                        Visit the homepage →
                    </a>
                </div>
            </div>

            <!-- Footer -->
            <div style="padding: 20px; text-align: center; border-top: 1px solid #eee; background-color: #fafafa;">
                <p style="font-family: Arial, sans-serif; font-size: 11px; color: #999; line-height: 1.5; margin: 0;">
                    You received this email because you subscribed on our website.<br>
                    <a href="#" style="color: #666; text-decoration: underline;">Unsubscribe</a>
                </p>
            </div>
        </div>
    `;

    console.log(`[EMAIL-SYSTEM] Preparing to send Welcome Email to: ${email}`);

    const transporter = createTransporter();
    const fromAddress = process.env.SMTP_FROM || process.env.SMTP_USER;

    try {
        await transporter.sendMail({
            from: fromAddress,
            to: email,
            subject: subject,
            html: htmlContent,
        });
        console.log(`[EMAIL-SYSTEM] ✓ Welcome email sent successfully to ${email}`);
    } catch (error) {
        console.error(`[EMAIL-SYSTEM] ✗ Failed to send welcome email to ${email}:`, error);
        throw error;
    }

    // Log to file
    const fs = await import('fs');
    const logEntry = JSON.stringify({
        timestamp: new Date().toISOString(),
        action: 'WELCOME_EMAIL_SENT',
        recipient: email,
        subject: subject,
        status: 'SUCCESS'
    }) + '\n';
    fs.appendFileSync(EMAIL_LOG_FILE, logEntry);
}
