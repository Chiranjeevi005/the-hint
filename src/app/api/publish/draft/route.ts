/**
 * Draft API Route
 * POST /api/publish/draft
 * GET /api/publish/draft (load a draft)
 * GET /api/publish/draft/history (get all drafts)
 * 
 * Handles saving and loading article drafts.
 * Drafts are stored separately from published content.
 */

import { NextRequest, NextResponse } from 'next/server';
import {
    validateDraftInput,
    transformToDraftData,
    DraftArticleInput,
} from '@/lib/validation';
import { saveDraft, loadDraft, getDraftHistory } from '@/lib/publish';

/**
 * POST - Save a draft
 * Validates minimally (headline + body required)
 * Overwrites existing draft with same ID
 */
export async function POST(request: NextRequest): Promise<NextResponse> {
    try {
        // Parse request body
        let body: unknown;
        try {
            body = await request.json();
        } catch {
            return NextResponse.json(
                {
                    success: false,
                    error: 'Invalid JSON in request body',
                    errors: [{ field: 'body', message: 'Request body must be valid JSON' }]
                },
                { status: 400 }
            );
        }

        // Ensure body is an object
        if (!body || typeof body !== 'object' || Array.isArray(body)) {
            return NextResponse.json(
                {
                    success: false,
                    error: 'Request body must be an object',
                    errors: [{ field: 'body', message: 'Request body must be a JSON object' }]
                },
                { status: 400 }
            );
        }

        const input = body as DraftArticleInput;

        // Validate with DRAFT validation (more lenient)
        const validationResult = validateDraftInput(input);

        if (!validationResult.isValid) {
            return NextResponse.json(
                {
                    success: false,
                    error: 'Validation failed',
                    errors: validationResult.errors,
                },
                { status: 400 }
            );
        }

        // Get existing draftId if provided (for overwrite)
        const existingDraftId = typeof input.draftId === 'string' ? input.draftId : undefined;

        // Transform to validated draft data
        const draftData = transformToDraftData(input, existingDraftId);

        // Save the draft
        const result = saveDraft(draftData);

        if (!result.success) {
            return NextResponse.json(
                {
                    success: false,
                    error: result.error || 'Failed to save draft',
                    errors: [{ field: 'unknown', message: 'Could not save draft to storage' }],
                },
                { status: 500 }
            );
        }

        // Success response
        return NextResponse.json(
            {
                success: true,
                message: 'Draft saved successfully',
                data: {
                    draftId: result.draftId,
                    savedAt: draftData.savedAt,
                },
            },
            { status: 200 }
        );

    } catch (error) {
        console.error('Unexpected error in draft save API:', error);
        return NextResponse.json(
            {
                success: false,
                error: 'An unexpected error occurred',
                errors: [{ field: 'unknown', message: 'Internal server error' }],
            },
            { status: 500 }
        );
    }
}

/**
 * GET - Load a draft by ID or get draft history
 * Query params:
 *   ?id=<draftId> - Load specific draft
 *   ?history=true - Get all drafts
 */
export async function GET(request: NextRequest): Promise<NextResponse> {
    try {
        const { searchParams } = new URL(request.url);
        const draftId = searchParams.get('id');
        const historyMode = searchParams.get('history');

        // History mode - return all drafts
        if (historyMode === 'true') {
            const history = getDraftHistory();
            return NextResponse.json(
                {
                    success: true,
                    data: {
                        drafts: history,
                    },
                },
                { status: 200 }
            );
        }

        // Load specific draft by ID
        if (!draftId) {
            return NextResponse.json(
                {
                    success: false,
                    error: 'Draft ID is required',
                    errors: [{ field: 'id', message: 'Provide ?id=<draftId> or ?history=true' }],
                },
                { status: 400 }
            );
        }

        const draft = loadDraft(draftId);

        if (!draft) {
            return NextResponse.json(
                {
                    success: false,
                    error: 'Draft not found',
                    errors: [{ field: 'id', message: `No draft found with ID: ${draftId}` }],
                },
                { status: 404 }
            );
        }

        return NextResponse.json(
            {
                success: true,
                data: {
                    draft,
                },
            },
            { status: 200 }
        );

    } catch (error) {
        console.error('Unexpected error in draft load API:', error);
        return NextResponse.json(
            {
                success: false,
                error: 'An unexpected error occurred',
                errors: [{ field: 'unknown', message: 'Internal server error' }],
            },
            { status: 500 }
        );
    }
}

/**
 * Reject other HTTP methods
 */
export async function PUT(): Promise<NextResponse> {
    return NextResponse.json(
        { success: false, error: 'Method not allowed' },
        { status: 405 }
    );
}

export async function DELETE(): Promise<NextResponse> {
    return NextResponse.json(
        { success: false, error: 'Method not allowed' },
        { status: 405 }
    );
}

export async function PATCH(): Promise<NextResponse> {
    return NextResponse.json(
        { success: false, error: 'Method not allowed' },
        { status: 405 }
    );
}
