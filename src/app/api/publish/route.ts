/**
 * Publish API Route
 * POST /api/publish
 * 
 * Handles article PUBLISHING with strict validation and file-based storage.
 * This is a critical write path - prioritizes correctness and safety.
 * 
 * RULES:
 * - Publishing must be explicit and irreversible
 * - All validation happens server-side
 * - Drafts and published articles are strictly separated
 * - No silent failures
 */

import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import {
    validateArticleInput,
    transformToValidatedData,
    PublishArticleInput,
    ValidatedArticleData,
} from '@/lib/validation';
import { deleteDraft } from '@/lib/publish';

/** Base path for content files */
const CONTENT_BASE_PATH = path.join(process.cwd(), 'src', 'content');

/**
 * Generate YAML frontmatter from article data
 */
function generateFrontmatter(data: ValidatedArticleData): string {
    const lines: string[] = ['---'];

    // Required fields - map headline/subheadline to title/subtitle for content system
    lines.push(`title: ${escapeYamlString(data.headline)}`);
    lines.push(`subtitle: ${escapeYamlString(data.subheadline)}`);
    lines.push(`contentType: ${data.contentType}`);
    lines.push(`status: published`);  // Always published when going through this route
    lines.push(`publishedAt: ${new Date().toISOString()}`);
    lines.push(`updatedAt: null`);
    lines.push(`placement: ${data.placement}`);

    // Tags array
    if (data.tags.length > 0) {
        lines.push('tags:');
        for (const tag of data.tags) {
            lines.push(`  - ${escapeYamlString(tag)}`);
        }
    } else {
        lines.push('tags: []');
    }

    // Sources array
    if (data.sources.length > 0) {
        lines.push('sources:');
        for (const source of data.sources) {
            lines.push(`  - ${escapeYamlString(source)}`);
        }
    } else {
        lines.push('sources: []');
    }

    lines.push('---');

    return lines.join('\n');
}

/**
 * Escape special characters in YAML string values
 */
function escapeYamlString(value: string): string {
    // If the string contains special characters, wrap in quotes
    if (/[:#\[\]{}|>!&*?'"\n\r]/.test(value) || value.startsWith(' ') || value.endsWith(' ')) {
        // Escape any existing double quotes and wrap in double quotes
        return `"${value.replace(/\\/g, '\\\\').replace(/"/g, '\\"')}"`;
    }
    return value;
}

/**
 * Generate complete Markdown content
 */
function generateMarkdownContent(data: ValidatedArticleData): string {
    const frontmatter = generateFrontmatter(data);
    return `${frontmatter}\n\n${data.body}\n`;
}

/**
 * Check if a file already exists at the given path
 */
function slugExists(section: string, slug: string): boolean {
    const filePath = path.join(CONTENT_BASE_PATH, section, `${slug}.md`);
    return fs.existsSync(filePath);
}

/**
 * Ensure section directory exists
 */
function ensureSectionDirectory(section: string): void {
    const sectionPath = path.join(CONTENT_BASE_PATH, section);
    if (!fs.existsSync(sectionPath)) {
        fs.mkdirSync(sectionPath, { recursive: true });
    }
}

/**
 * Write article to file system atomically
 * Writes to a temporary file first, then renames to final location
 */
function writeArticleFile(section: string, slug: string, content: string): void {
    const sectionPath = path.join(CONTENT_BASE_PATH, section);
    const finalPath = path.join(sectionPath, `${slug}.md`);
    const tempPath = path.join(sectionPath, `${slug}.md.tmp`);

    try {
        // Write to temporary file first
        fs.writeFileSync(tempPath, content, { encoding: 'utf-8' });

        // Rename temp file to final location (atomic on most file systems)
        fs.renameSync(tempPath, finalPath);
    } catch (error) {
        // Clean up temp file if it exists
        try {
            if (fs.existsSync(tempPath)) {
                fs.unlinkSync(tempPath);
            }
        } catch {
            // Ignore cleanup errors
        }
        throw error;
    }
}

/**
 * Handle POST requests to PUBLISH articles
 * This is the FINAL, IRREVERSIBLE publish action
 */
export async function POST(request: NextRequest): Promise<NextResponse> {
    try {
        // TODO: Add authentication check here
        // if (!isAuthenticated(request)) {
        //     return NextResponse.json(
        //         { success: false, error: 'Unauthorized', errors: [{ field: 'auth', message: 'Authentication required' }] },
        //         { status: 401 }
        //     );
        // }

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

        const input = body as PublishArticleInput;

        // Ensure status is 'published' for this endpoint
        if (input.status !== 'published') {
            return NextResponse.json(
                {
                    success: false,
                    error: 'This endpoint is for publishing only. Use /api/publish/draft to save drafts.',
                    errors: [{ field: 'status', message: 'Status must be "published" to publish an article' }]
                },
                { status: 400 }
            );
        }

        // Validate all inputs with FULL validation
        const validationResult = validateArticleInput(input);

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

        // Transform to validated data
        const articleData = transformToValidatedData(input);

        // Validate slug is not empty after transformation
        if (!articleData.slug) {
            return NextResponse.json(
                {
                    success: false,
                    error: 'Could not generate a valid slug from the headline',
                    errors: [{ field: 'headline', message: 'Headline must contain at least one alphanumeric character' }],
                },
                { status: 400 }
            );
        }

        // Check if slug already exists
        // ALLOW overwrite if input.slug matches generated slug (Minute changes/Update)
        const targetSlug = articleData.slug;
        const inputSlug = typeof input.slug === 'string' && input.slug ? input.slug : null;
        const isSelfUpdate = inputSlug && inputSlug === targetSlug;

        if (!isSelfUpdate && slugExists(articleData.section, targetSlug)) {
            return NextResponse.json(
                {
                    success: false,
                    error: 'An article with this title already exists in this section',
                    errors: [{
                        field: 'headline',
                        message: `An article with this title already exists in the ${articleData.section} section`
                    }],
                },
                { status: 409 }
            );
        }

        // Ensure section directory exists
        try {
            ensureSectionDirectory(articleData.section);
        } catch (error) {
            console.error('Failed to create section directory:', error);
            return NextResponse.json(
                {
                    success: false,
                    error: 'Failed to create section directory',
                    errors: [{ field: 'section', message: 'Could not create section directory' }],
                },
                { status: 500 }
            );
        }

        // Generate markdown content
        const markdownContent = generateMarkdownContent(articleData);

        // Write file atomically
        try {
            writeArticleFile(articleData.section, articleData.slug, markdownContent);
        } catch (error) {
            console.error('Failed to write article file:', error);
            return NextResponse.json(
                {
                    success: false,
                    error: 'Failed to save article',
                    errors: [{ field: 'body', message: 'Could not write article to file system' }],
                },
                { status: 500 }
            );
        }

        // If there was a draft ID, remove the draft
        const draftId = (body as Record<string, unknown>).draftId;
        if (typeof draftId === 'string' && draftId) {
            deleteDraft(draftId);
        }

        // Success response
        return NextResponse.json(
            {
                success: true,
                message: 'Article published successfully',
                data: {
                    slug: articleData.slug,
                    section: articleData.section,
                    url: `/${articleData.section}/${articleData.slug}`,
                    publishedAt: new Date().toISOString(),
                },
            },
            { status: 201 }
        );

    } catch (error) {
        console.error('Unexpected error in publish API:', error);
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
 * Reject GET requests explicitly
 */
export async function GET(): Promise<NextResponse> {
    return NextResponse.json(
        {
            success: false,
            error: 'Method not allowed',
            errors: [{ field: 'method', message: 'Only POST requests are allowed' }],
        },
        { status: 405 }
    );
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
