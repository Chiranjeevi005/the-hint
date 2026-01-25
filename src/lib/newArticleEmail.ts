import nodemailer from 'nodemailer';
import { getActiveSubscribers } from './subscription';

const EMAIL_LOG_FILE = 'sent-emails.log';

// Create reusable transporter using Gmail SMTP
function createTransporter() {
    return nodemailer.createTransport({
        host: process.env.SMTP_HOST || 'smtp.gmail.com',
        port: parseInt(process.env.SMTP_PORT || '587'),
        secure: false,
        auth: {
            user: process.env.SMTP_USER,
            pass: process.env.SMTP_PASS,
        },
    });
}

interface NewArticleEmailData {
    headline: string;
    summary: string;
    section: string;
    contentType: string; // 'news', 'opinion', 'investigation', etc.
    publishedAt: string;
    articleUrl: string;
    isUpdate?: boolean;
}

/**
 * Send New Article Notification Email
 * 
 * Editorial Alert Email sent to all subscribers when a new article is published.
 * Follows strict editorial design guidelines - calm, factual, no clickbait.
 */
export async function sendNewArticleNotification(article: NewArticleEmailData): Promise<void> {
    const subscribers = getActiveSubscribers();

    if (subscribers.length === 0) {
        console.log('[EMAIL-SYSTEM] No active subscribers for new article notification.');
        return;
    }

    // Subject line patterns (rotate naturally)
    const subjectPatterns = [
        `New reporting: ${article.headline}`,
        `Just published: ${article.headline}`,
        `New story from our newsroom`
    ];
    // Select based on article characteristics
    const subjectIndex = article.headline.length % 3; // Simple rotation based on headline length
    const subject = subjectPatterns[subjectIndex];

    // Context line based on content type
    let contextLine = 'NEWLY PUBLISHED';
    if (article.isUpdate) {
        contextLine = 'UPDATED REPORTING';
    } else if (article.contentType === 'opinion') {
        contextLine = 'OPINION';
    } else if (article.contentType === 'investigation') {
        contextLine = 'INVESTIGATION';
    }

    // Format published date
    const publishedDate = new Date(article.publishedAt).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });

    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3002';
    const fullArticleUrl = `${baseUrl}${article.articleUrl}`;

    const htmlContent = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${article.headline}</title>
</head>
<body style="margin: 0; padding: 0; background-color: #f5f5f5; font-family: Georgia, 'Times New Roman', serif;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color: #f5f5f5;">
        <tr>
            <td align="center" style="padding: 40px 20px;">
                <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width: 600px; background-color: #ffffff;">
                    
                    <!-- 1️⃣ Header (Minimal & Familiar) -->
                    <tr>
                        <td style="text-align: center; padding: 30px 40px 20px 40px; border-bottom: 1px solid #E5E5E5;">
                            <h1 style="font-family: Georgia, serif; font-size: 32px; font-weight: 900; letter-spacing: -0.5px; margin: 0; color: #111;">THE HINT</h1>
                        </td>
                    </tr>

                    <!-- Main Content -->
                    <tr>
                        <td style="padding: 30px 40px;">
                            
                            <!-- 2️⃣ Context Line -->
                            <p style="font-family: Arial, Helvetica, sans-serif; font-size: 11px; font-weight: 600; text-transform: uppercase; letter-spacing: 2px; color: #888888; margin: 0 0 20px 0;">
                                ${contextLine}
                            </p>

                            <!-- 3️⃣ Headline (Primary Focus) -->
                            <h2 style="font-family: Georgia, serif; font-size: 28px; font-weight: bold; line-height: 1.25; color: #111111; margin: 0 0 20px 0;">
                                ${article.headline}
                            </h2>

                            <!-- 4️⃣ Brief Summary (Editorial Abstract) -->
                            <p style="font-family: Georgia, serif; font-size: 17px; line-height: 1.6; color: #333333; margin: 0 0 20px 0;">
                                ${article.summary}
                            </p>

                            <!-- 5️⃣ Metadata Line (Trust Signal) -->
                            <p style="font-family: Arial, Helvetica, sans-serif; font-size: 12px; color: #888888; margin: 0 0 30px 0;">
                                ${article.section.toUpperCase()} &bull; ${publishedDate}
                            </p>

                            <!-- 6️⃣ Primary CTA (Single Action) -->
                            <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                                <tr>
                                    <td align="center">
                                        <a href="${fullArticleUrl}" 
                                           style="display: inline-block; background-color: #111111; color: #ffffff; text-decoration: none; padding: 16px 40px; font-family: Arial, Helvetica, sans-serif; font-size: 13px; font-weight: bold; text-transform: uppercase; letter-spacing: 1px;">
                                            Read the full article &rarr;
                                        </a>
                                    </td>
                                </tr>
                            </table>

                            <!-- 7️⃣ Secondary Editorial Prompt -->
                            <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-top: 25px;">
                                <tr>
                                    <td align="center">
                                        <a href="${baseUrl}" 
                                           style="font-family: Arial, Helvetica, sans-serif; font-size: 13px; color: #666666; text-decoration: none;">
                                            View latest coverage &rarr;
                                        </a>
                                    </td>
                                </tr>
                            </table>

                        </td>
                    </tr>

                    <!-- 8️⃣ Footer (Control & Trust) -->
                    <tr>
                        <td style="padding: 25px 40px; border-top: 1px solid #E5E5E5; background-color: #FAFAFA;">
                            <p style="font-family: Arial, Helvetica, sans-serif; font-size: 11px; line-height: 1.6; color: #999999; margin: 0; text-align: center;">
                                You're receiving this email because you subscribed to news updates.
                                <br>
                                <a href="#" style="color: #666666; text-decoration: underline;">Unsubscribe</a>
                            </p>
                        </td>
                    </tr>

                </table>
            </td>
        </tr>
    </table>
</body>
</html>
    `;

    console.log(`[EMAIL-SYSTEM] Sending new article notification: "${article.headline}" to ${subscribers.length} subscribers.`);

    const transporter = createTransporter();
    const fromAddress = process.env.SMTP_FROM || 'Editorial Desk <' + process.env.SMTP_USER + '>';

    let successCount = 0;
    let failCount = 0;

    // Send to each subscriber
    for (const recipientEmail of subscribers) {
        try {
            await transporter.sendMail({
                from: fromAddress,
                to: recipientEmail,
                subject: subject,
                html: htmlContent,
            });
            successCount++;
            console.log(`[EMAIL-SYSTEM] ✓ Article notification sent to ${recipientEmail}`);
        } catch (error) {
            failCount++;
            console.error(`[EMAIL-SYSTEM] ✗ Failed to send to ${recipientEmail}:`, error);
        }
    }

    // Log to file
    const fs = await import('fs');
    const logEntry = JSON.stringify({
        timestamp: new Date().toISOString(),
        action: 'NEW_ARTICLE_NOTIFICATION_SENT',
        article: article.headline,
        section: article.section,
        recipientCount: subscribers.length,
        successCount,
        failCount
    }) + '\n';
    fs.appendFileSync(EMAIL_LOG_FILE, logEntry);

    console.log(`[EMAIL-SYSTEM] Article notification complete: ${successCount} sent, ${failCount} failed.`);
}
