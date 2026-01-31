
import nodemailer from 'nodemailer';
import { SubscriptionEvent } from './types';

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

// Get time-based greeting
function getGreeting(): string {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    return 'Good evening';
}

// Get compelling intro based on content type
function getIntroText(contentType: string, section: string): string {
    if (contentType === 'opinion') {
        return 'You might find this perspective interesting.';
    }

    const sectionIntros: Record<string, string> = {
        'politics': "Here's something you should know about.",
        'world': 'This story caught our attention today.',
        'crime': 'We wanted to bring this to you.',
        'court': "Here's what's happening in the courts.",
        'business': 'This might be relevant to you.',
    };

    return sectionIntros[section] || "You have to see this.";
}



function generateHtml(event: SubscriptionEvent, recipientEmail: string): string {
    const { headline, summary, section, contentType, createdAt, articleSlug } = event;

    const greeting = getGreeting();
    const introText = getIntroText(contentType, section);

    // Format date elegantly
    const publishedDate = new Date(createdAt).toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });

    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3002';
    const fullArticleUrl = `${baseUrl}/${section}/${articleSlug}`;

    // Opinion badge
    const opinionBadge = contentType === 'opinion'
        ? `<span style="display: inline-block; background-color: #7C3AED; color: white; font-family: Arial, sans-serif; font-size: 10px; font-weight: bold; text-transform: uppercase; letter-spacing: 1px; padding: 4px 10px; margin-bottom: 15px;">Opinion</span><br>`
        : '';

    return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${headline}</title>
</head>
<body style="margin: 0; padding: 0; background-color: #F8F7F4; font-family: Georgia, 'Times New Roman', serif;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color: #F8F7F4;">
        <tr>
            <td align="center" style="padding: 40px 20px;">
                <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width: 580px;">
                    
                    <!-- Masthead -->
                    <tr>
                        <td style="text-align: center; padding-bottom: 30px;">
                            <h1 style="font-family: Georgia, serif; font-size: 36px; font-weight: 900; letter-spacing: -1px; margin: 0; color: #1a1a1a;">THE HINT</h1>
                            <p style="font-family: Arial, sans-serif; font-size: 11px; color: #888; margin: 8px 0 0 0; text-transform: uppercase; letter-spacing: 2px;">${publishedDate}</p>
                        </td>
                    </tr>

                    <!-- Main Card -->
                    <tr>
                        <td>
                            <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 2px; box-shadow: 0 1px 3px rgba(0,0,0,0.08);">
                                
                                <!-- Greeting & Intro -->
                                <tr>
                                    <td style="padding: 35px 40px 0 40px;">
                                        <p style="font-family: Georgia, serif; font-size: 18px; color: #333; margin: 0 0 5px 0;">
                                            ${greeting},
                                        </p>
                                        <p style="font-family: Arial, sans-serif; font-size: 14px; color: #666; margin: 0 0 25px 0;">
                                            ${introText}
                                        </p>
                                    </td>
                                </tr>

                                <!-- Article Content -->
                                <tr>
                                    <td style="padding: 0 40px;">
                                        <!-- Decorative line -->
                                        <div style="width: 50px; height: 3px; background-color: #1a1a1a; margin-bottom: 20px;"></div>
                                        
                                        ${opinionBadge}
                                        
                                        <!-- Headline -->
                                        <h2 style="font-family: Georgia, serif; font-size: 26px; font-weight: bold; line-height: 1.3; color: #1a1a1a; margin: 0 0 18px 0;">
                                            ${headline}
                                        </h2>
                                        
                                        <!-- Summary -->
                                        <p style="font-family: Georgia, serif; font-size: 17px; line-height: 1.7; color: #444; margin: 0 0 8px 0;">
                                            ${summary}
                                        </p>
                                        
                                        <!-- Section tag -->
                                        <p style="font-family: Arial, sans-serif; font-size: 12px; color: #999; margin: 0; text-transform: uppercase; letter-spacing: 1px;">
                                            ${section}
                                        </p>
                                    </td>
                                </tr>

                                <!-- CTA -->
                                <tr>
                                    <td style="padding: 30px 40px 35px 40px;">
                                        <table role="presentation" cellpadding="0" cellspacing="0">
                                            <tr>
                                                <td>
                                                    <a href="${fullArticleUrl}" 
                                                       style="display: inline-block; background-color: #1a1a1a; color: #ffffff; text-decoration: none; padding: 14px 32px; font-family: Arial, sans-serif; font-size: 14px; font-weight: 600; border-radius: 2px;">
                                                        Continue reading →
                                                    </a>
                                                </td>
                                            </tr>
                                        </table>
                                    </td>
                                </tr>

                            </table>
                        </td>
                    </tr>

                    <!-- Footer -->
                    <tr>
                        <td style="padding: 30px 0; text-align: center;">
                            <p style="font-family: Arial, sans-serif; font-size: 13px; color: #666; margin: 0 0 15px 0;">
                                Thank you for being a reader.
                            </p>
                            <a href="${baseUrl}" style="font-family: Arial, sans-serif; font-size: 13px; color: #1a1a1a; text-decoration: none; font-weight: 600;">
                                Visit The Hint →
                            </a>
                            <p style="margin: 20px 0 0 0;">
                                <a href="${baseUrl}/api/unsubscribe?email=${encodeURIComponent(recipientEmail)}" style="font-family: Arial, sans-serif; font-size: 11px; color: #999; text-decoration: underline;">Unsubscribe</a>
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
}

// Generate compelling subject lines
function generateSubject(event: SubscriptionEvent): string {
    const { headline, contentType, section } = event;

    // Shorter, more compelling subjects
    const patterns = [
        headline, // Sometimes just the headline is best
        `Just in: ${headline}`,
        `New from ${section}: ${headline}`,
    ];

    // For opinion pieces, be clear
    if (contentType === 'opinion') {
        return `Opinion: ${headline}`;
    }

    // Rotate based on headline length for variety
    const index = headline.length % 2;
    return patterns[index];
}

/**
 * Send a single email safely.
 * Returns true if successful, false otherwise.
 * MUST NOT throw errors.
 */
export async function sendEmailForEvent(recipient: string, event: SubscriptionEvent): Promise<boolean> {
    try {
        const transporter = createTransporter();
        const fromAddress = process.env.SMTP_FROM || 'The Hint <' + process.env.SMTP_USER + '>';
        const subject = generateSubject(event);

        await transporter.sendMail({
            from: fromAddress,
            to: recipient,
            subject: subject,
            html: generateHtml(event, recipient),
        });

        return true;
    } catch (error) {
        console.error(`[EMAIL] Failed to send to ${recipient}`, error);
        return false;
    }
}
