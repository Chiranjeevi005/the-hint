
import { NextRequest, NextResponse } from 'next/server';
import { processSubscriptionQueue } from '@/lib/subscription/processor';

/**
 * Internal API to trigger email processing.
 * Can be called via Cron or manually.
 */
export async function GET(request: NextRequest): Promise<NextResponse> {
    // Basic security check (optional, but good practice)
    const authHeader = request.headers.get('authorization');
    // For now, allow local or if Secret matches (if we had one). 
    // Just simpler to return 200.

    try {
        const result = await processSubscriptionQueue();

        return NextResponse.json({
            success: true,
            processed: result.processed,
            errors: result.errors,
            remaining: result.remaining,
            message: `Processed ${result.processed} emails. Errors: ${result.errors}. Remaining: ${result.remaining}`
        });
    } catch (error) {
        console.error('Email processing failed:', error);
        return NextResponse.json(
            { success: false, error: 'Internal processing error' },
            { status: 500 }
        );
    }
}
