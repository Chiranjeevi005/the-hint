/**
 * Duplicate Article API Route
 * POST /api/publish/duplicate
 * 
 * Creates a new draft from an existing article (draft or published).
 * Title prefixed with "Copy of..."
 * New draft ID generated.
 */

import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { loadDraft, saveDraft } from '@/lib/publish';
import { ValidatedDraftData } from '@/lib/validation';

/** Base path for content files */
const CONTENT_BASE_PATH = path.join(process.cwd(), 'src', 'content');

/**
 * Generate a unique draft ID
 */
function generateDraftId(): string {
    const timestamp = Date.now().toString(36);
    const random = Math.random().toString(36).substring(2, 8);
    return `draft-${timestamp}-${random}`;
}

/**
 * Parse YAML frontmatter from markdown content
 */
function parseFrontmatter(content: string): Record<string, unknown> {
    const match = content.match(/^---\n([\s\S]*?)\n---/);
    if (!match) return {};

    const yaml = match[1];
    const result: Record<string, unknown> = {};

    const lines = yaml.split('\n');
    let currentKey = '';
    let currentArray: string[] = [];
    let inArray = false;

    for (const line of lines) {
        if (line.startsWith('  - ') && inArray) {
            currentArray.push(line.slice(4).replace(/^["']|["']$/g, ''));
        } else if (line.includes(':')) {
            if (inArray && currentKey) {
                result[currentKey] = currentArray;
                currentArray = [];
                inArray = false;
            }

            const colonIndex = line.indexOf(':');
            const key = line.slice(0, colonIndex).trim();
            const value = line.slice(colonIndex + 1).trim();

            if (value === '' || value === '[]') {
                if (value === '[]') {
                    result[key] = [];
                } else {
                    currentKey = key;
                    inArray = true;
                    currentArray = [];
                }
            } else {
                result[key] = value.replace(/^["']|["']$/g, '');
            }
        }
    }

    if (inArray && currentKey) {
        result[currentKey] = currentArray;
    }

    return result;
}

/**
 * Get body content from markdown
 */
function getBody(content: string): string {
    const match = content.match(/^---\n[\s\S]*?\n---\n\n?([\s\S]*)/);
    return match ? match[1].trim() : content;
}

/**
 * POST - Duplicate an article
 */
export async function POST(request: NextRequest): Promise<NextResponse> {
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

        let newDraftData: ValidatedDraftData;
        const newDraftId = generateDraftId();
        const now = new Date().toISOString();

        // Handle draft duplication
        if (type === 'draft' || id.startsWith('draft-')) {
            const draftId = id.startsWith('draft-') ? id : id;
            const existingDraft = loadDraft(draftId);

            if (!existingDraft) {
                return NextResponse.json(
                    {
                        success: false,
                        error: 'Draft not found',
                    },
                    { status: 404 }
                );
            }

            newDraftData = {
                ...existingDraft,
                draftId: newDraftId,
                headline: `Copy of ${existingDraft.headline}`,
                savedAt: now,
            };
        }
        // Handle published article duplication
        else if (type === 'published' || id.startsWith('published-')) {
            if (!section || !slug) {
                return NextResponse.json(
                    {
                        success: false,
                        error: 'Section and slug are required for published articles',
                    },
                    { status: 400 }
                );
            }

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

            const content = fs.readFileSync(filePath, 'utf-8');
            const frontmatter = parseFrontmatter(content);
            const articleBody = getBody(content);

            const title = (frontmatter.title as string) || slug;
            const subtitle = (frontmatter.subtitle as string) || '';
            const rawContentType = (frontmatter.contentType as string) || 'news';
            // Validate contentType is 'news' or 'opinion', default to 'news'
            const validContentType: 'news' | 'opinion' = (rawContentType === 'opinion') ? 'opinion' : 'news';
            const placement = (frontmatter.placement as 'lead' | 'top' | 'standard') || 'standard';
            const tags = Array.isArray(frontmatter.tags) ? frontmatter.tags : [];
            const sources = Array.isArray(frontmatter.sources) ? frontmatter.sources : [];
            // Validate section is valid
            const validSections = ['politics', 'crime', 'court', 'opinion', 'world-affairs'] as const;
            const validSection = validSections.includes(section as typeof validSections[number])
                ? section as typeof validSections[number]
                : 'politics';

            newDraftData = {
                draftId: newDraftId,
                headline: `Copy of ${title}`,
                subheadline: subtitle,
                section: validSection,
                contentType: validContentType,
                body: articleBody,
                tags,
                sources,
                placement,
                savedAt: now,
            };
        } else {
            return NextResponse.json(
                {
                    success: false,
                    error: 'Invalid article type',
                },
                { status: 400 }
            );
        }

        // Save the new draft
        const result = saveDraft(newDraftData);

        if (result.success) {
            return NextResponse.json({
                success: true,
                message: 'Article duplicated successfully',
                data: {
                    draftId: newDraftId,
                    headline: newDraftData.headline,
                },
            });
        } else {
            return NextResponse.json(
                {
                    success: false,
                    error: result.error || 'Failed to save duplicated draft',
                },
                { status: 500 }
            );
        }
    } catch (error) {
        console.error('Error duplicating article:', error);
        return NextResponse.json(
            {
                success: false,
                error: 'An unexpected error occurred',
            },
            { status: 500 }
        );
    }
}
