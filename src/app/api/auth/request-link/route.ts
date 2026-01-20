
import { NextRequest, NextResponse } from 'next/server';
import { createMagicToken } from '@/lib/auth/token';
import { sendMagicLinkEmail } from '@/lib/auth/email';

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { email } = body;

        const authorizedEmail = process.env.AUTHORIZED_EDITOR_EMAIL;

        if (!email || typeof email !== 'string') {
            return NextResponse.json({ error: 'Email is required' }, { status: 400 });
        }

        // Strict check against authorized email
        // We return a generic success message even if it fails to avoid enumeration if desired, 
        // but for a solo admin login, it's safer to just reject clearly or (as per requirements) "Invalid email -> generic error"
        // The requirement says: "Invalid email -> generic error (no hints)"
        // So if it doesn't match, we behave as if we sent it? Or just say "If this is the authorized email, a link has been sent."

        // However, for the authorized user debugging, let's just log on server and return generic on client.

        if (email !== authorizedEmail) {
            // Simulate delay to prevent timing attacks
            await new Promise(resolve => setTimeout(resolve, 1000));
            return NextResponse.json({ message: 'If the email is authorized, a magic link has been sent.' });
        }

        const token = await createMagicToken(email);
        await sendMagicLinkEmail(email, token);

        return NextResponse.json({ message: 'If the email is authorized, a magic link has been sent.' });
    } catch (error) {
        console.error('Login request error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
