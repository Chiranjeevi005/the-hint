
import { NextRequest, NextResponse } from 'next/server';
import { verifyMagicToken } from '@/lib/auth/token';
import { createSession } from '@/lib/auth/session';
import fs from 'fs/promises';
import path from 'path';

// Simple file-based used token store for single-user app
const USED_TOKENS_FILE = path.join(process.cwd(), 'src', 'lib', 'auth', 'used-tokens.json');

async function isTokenUsed(jti: string): Promise<boolean> {
    try {
        const data = await fs.readFile(USED_TOKENS_FILE, 'utf-8');
        const usedTokens = JSON.parse(data);
        return !!usedTokens[jti];
    } catch (error) {
        if ((error as any).code === 'ENOENT') {
            return false;
        }
        return false;
    }
}

async function markTokenAsUsed(jti: string) {
    try {
        let usedTokens: Record<string, number> = {};
        try {
            const data = await fs.readFile(USED_TOKENS_FILE, 'utf-8');
            usedTokens = JSON.parse(data);
        } catch (error) {
            if ((error as any).code !== 'ENOENT') throw error;
        }

        // Add new token with timestamp
        usedTokens[jti] = Date.now();

        // Cleanup old tokens (> 24h) to keep file small
        const oneDayAgo = Date.now() - 24 * 60 * 60 * 1000;
        const cleanedTokens = Object.fromEntries(
            Object.entries(usedTokens).filter(([_, timestamp]) => timestamp > oneDayAgo)
        );

        // Ensure dir exists
        await fs.mkdir(path.dirname(USED_TOKENS_FILE), { recursive: true });
        await fs.writeFile(USED_TOKENS_FILE, JSON.stringify(cleanedTokens, null, 2));
    } catch (error) {
        console.error('Failed to mark token as used:', error);
        // Non-blocking in production? If we can't write, we risk reuse. 
        // Ideally we throw, but file system failure is rare.
    }
}

export async function GET(request: NextRequest) {
    const searchParams = request.nextUrl.searchParams;
    const token = searchParams.get('token');

    if (!token) {
        return NextResponse.redirect(new URL('/newsroom?error=Missing+token', request.url));
    }

    const payload = await verifyMagicToken(token);

    if (!payload || !payload.email) {
        return NextResponse.redirect(new URL('/newsroom?error=Invalid+or+expired+link', request.url));
    }

    const authorizedEmail = process.env.AUTHORIZED_EDITOR_EMAIL;
    if (payload.email !== authorizedEmail) {
        return NextResponse.redirect(new URL('/newsroom?error=Unauthorized+email', request.url));
    }

    // Check for reuse
    if (payload.jti && await isTokenUsed(payload.jti)) {
        return NextResponse.redirect(new URL('/newsroom?error=Link+already+used', request.url));
    }

    if (payload.jti) {
        await markTokenAsUsed(payload.jti);
    }

    // Create session
    await createSession(payload.email);

    // Redirect to publish
    return NextResponse.redirect(new URL('/publish', request.url));
}
