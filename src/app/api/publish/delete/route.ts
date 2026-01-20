/**
 * Delete Article API Route
 * DELETE /api/publish/delete
 * 
 * Handles deletion of both drafts and published articles.
 */

import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { deleteDraft, draftExists } from '@/lib/publish';

/** Base path for content files */
const CONTENT_BASE_PATH = path.join(process.cwd(), 'src', 'content');

/** Valid sections */
const VALID_SECTIONS = ['politics', 'crime', 'court', 'opinion', 'world-affairs'];

/**
 * DELETE - Remove an article (draft or published)
 */
export async function DELETE(request: NextRequest): Promise<NextResponse> {
    try {
        const body = await request.json();
        const { id, type, section, slug } = body;

        if (!id) {
            return NextResponse.json(
                {
                    success: false,
                    error: 'Article ID is required',
                },
                { status: 400 }
            );
        }

        // Handle draft deletion
        if (type === 'draft' || id.startsWith('draft-')) {
            const draftId = id.startsWith('draft-') ? id : id;

            if (!draftExists(draftId)) {
                return NextResponse.json(
                    {
                        success: false,
                        error: 'Draft not found',
                    },
                    { status: 404 }
                );
            }

            const deleted = deleteDraft(draftId);

            if (deleted) {
                return NextResponse.json({
                    success: true,
                    message: 'Draft deleted successfully',
                });
            } else {
                return NextResponse.json(
                    {
                        success: false,
                        error: 'Failed to delete draft',
                    },
                    { status: 500 }
                );
            }
        }

        // Handle published article deletion
        if (type === 'published' || id.startsWith('published-')) {
            if (!section || !slug) {
                return NextResponse.json(
                    {
                        success: false,
                        error: 'Section and slug are required for published articles',
                    },
                    { status: 400 }
                );
            }

            // Validate section
            if (!VALID_SECTIONS.includes(section)) {
                return NextResponse.json(
                    {
                        success: false,
                        error: 'Invalid section',
                    },
                    { status: 400 }
                );
            }

            // Sanitize slug to prevent path traversal
            const safeSlug = slug.replace(/[^a-z0-9-]/gi, '-');
            const filePath = path.join(CONTENT_BASE_PATH, section, `${safeSlug}.md`);

            if (!fs.existsSync(filePath)) {
                return NextResponse.json(
                    {
                        success: false,
                        error: 'Published article not found',
                    },
                    { status: 404 }
                );
            }

            try {
                fs.unlinkSync(filePath);
                return NextResponse.json({
                    success: true,
                    message: 'Published article deleted successfully',
                });
            } catch (error) {
                console.error('Failed to delete published article:', error);
                return NextResponse.json(
                    {
                        success: false,
                        error: 'Failed to delete published article',
                    },
                    { status: 500 }
                );
            }
        }

        return NextResponse.json(
            {
                success: false,
                error: 'Invalid article type',
            },
            { status: 400 }
        );
    } catch (error) {
        console.error('Error deleting article:', error);
        return NextResponse.json(
            {
                success: false,
                error: 'An unexpected error occurred',
            },
            { status: 500 }
        );
    }
}
