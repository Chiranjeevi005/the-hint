/**
 * Publish API Route
 * POST /api/publish
 * 
 * Handles article publishing with strict validation and file-based storage.
 * This is a critical write path - prioritizes correctness and safety.
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

/** Base path for content files */
const CONTENT_BASE_PATH = path.join(process.cwd(), 'src', 'content');

/**
 * Generate YAML frontmatter from article data
 */
function generateFrontmatter(data: ValidatedArticleData): string {
    const lines: string[] = ['---'];

    // Required fields
    lines.push(`title: ${escapeYamlString(data.title)}`);
    lines.push(`subtitle: ${escapeYamlString(data.subtitle)}`);
    lines.push(`contentType: ${data.contentType}`);
    lines.push(`status: ${data.status}`);

    if (data.status === 'published') {
        lines.push(`publishedAt: ${new Date().toISOString()}`);
    } else {
        lines.push(`publishedAt: null`);
    }

    lines.push(`updatedAt: null`);
    lines.push(`featured: ${data.featured}`);

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
        return `"${value.replace(/"/g, '\\"')}"`;
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
 * Handle POST requests to publish articles
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

        const input = body as PublishArticleInput;

        // Validate all inputs
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
                    error: 'Could not generate a valid slug from the title',
                    errors: [{ field: 'title', message: 'Title must contain at least one alphanumeric character' }],
                },
                { status: 400 }
            );
        }

        // Check if slug already exists
        if (slugExists(articleData.section, articleData.slug)) {
            return NextResponse.json(
                {
                    success: false,
                    error: 'An article with this slug already exists',
                    errors: [{
                        field: 'title',
                        message: `An article with the slug "${articleData.slug}" already exists in the ${articleData.section} section`
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

        // Success response
        return NextResponse.json(
            {
                success: true,
                message: 'Article published successfully',
                data: {
                    slug: articleData.slug,
                    section: articleData.section,
                    url: `/${articleData.section}/${articleData.slug}`,
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
