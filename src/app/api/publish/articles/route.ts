/**
 * Articles API Route
 * GET /api/publish/articles
 * 
 * Returns a combined list of drafts and published articles for the editorial database.
 */

import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { getDraftHistory, loadDraft } from '@/lib/publish';

/** Base path for content files */
const CONTENT_BASE_PATH = path.join(process.cwd(), 'src', 'content');

/** Valid sections */
const VALID_SECTIONS = ['politics', 'crime', 'court', 'opinion', 'world-affairs'];

interface ArticleEntry {
    id: string;
    title: string;
    section: string;
    status: 'draft' | 'published';
    placement: 'lead' | 'top' | 'standard';
    lastEdited: string;
    publishedAt?: string;
    slug?: string;
    data: {
        headline: string;
        subheadline: string;
        section: string;
        contentType: string;
        body: string;
        tags: string;
        placement: 'lead' | 'top' | 'standard';
        sources: string;
        draftId: string | null;
        status: 'draft' | 'published';
        slug?: string;
        publishedAt?: string;
        lastEdited?: string;
    };
}

/**
 * Parse YAML frontmatter from markdown content
 */
function parseFrontmatter(content: string): Record<string, unknown> {
    const match = content.match(/^---\n([\s\S]*?)\n---/);
    if (!match) return {};

    const yaml = match[1];
    const result: Record<string, unknown> = {};

    // Simple YAML parser for our use case
    const lines = yaml.split('\n');
    let currentKey = '';
    let currentArray: string[] = [];
    let inArray = false;

    for (const line of lines) {
        if (line.startsWith('  - ') && inArray) {
            // Array item
            currentArray.push(line.slice(4).replace(/^["']|["']$/g, ''));
        } else if (line.includes(':')) {
            // Save previous array if any
            if (inArray && currentKey) {
                result[currentKey] = currentArray;
                currentArray = [];
                inArray = false;
            }

            const colonIndex = line.indexOf(':');
            const key = line.slice(0, colonIndex).trim();
            const value = line.slice(colonIndex + 1).trim();

            if (value === '' || value === '[]') {
                // Could be start of array or empty
                if (value === '[]') {
                    result[key] = [];
                } else {
                    currentKey = key;
                    inArray = true;
                    currentArray = [];
                }
            } else {
                // Simple value - remove quotes if present
                result[key] = value.replace(/^["']|["']$/g, '');
            }
        }
    }

    // Save last array if any
    if (inArray && currentKey) {
        result[currentKey] = currentArray;
    }

    return result;
}

/**
 * Get body content from markdown (after frontmatter)
 */
function getBody(content: string): string {
    const match = content.match(/^---\n[\s\S]*?\n---\n\n?([\s\S]*)/);
    return match ? match[1].trim() : content;
}

/**
 * Read all published articles
 */
function getPublishedArticles(): ArticleEntry[] {
    const articles: ArticleEntry[] = [];

    for (const section of VALID_SECTIONS) {
        const sectionPath = path.join(CONTENT_BASE_PATH, section);

        if (!fs.existsSync(sectionPath)) continue;

        const files = fs.readdirSync(sectionPath).filter(f => f.endsWith('.md'));

        for (const file of files) {
            try {
                const filePath = path.join(sectionPath, file);
                const content = fs.readFileSync(filePath, 'utf-8');
                const frontmatter = parseFrontmatter(content);
                const body = getBody(content);
                const slug = file.replace('.md', '');
                const stats = fs.statSync(filePath);

                const title = (frontmatter.title as string) || slug;
                const subtitle = (frontmatter.subtitle as string) || '';
                const contentType = (frontmatter.contentType as string) || 'news';
                const placement = (frontmatter.placement as 'lead' | 'top' | 'standard') || 'standard';
                const publishedAt = (frontmatter.publishedAt as string) || stats.birthtime.toISOString();
                const tags = Array.isArray(frontmatter.tags) ? frontmatter.tags : [];
                const sources = Array.isArray(frontmatter.sources) ? frontmatter.sources : [];

                articles.push({
                    id: `published-${section}-${slug}`,
                    title,
                    section: section as ArticleEntry['section'],
                    status: 'published',
                    placement,
                    lastEdited: stats.mtime.toISOString(),
                    publishedAt,
                    slug,
                    data: {
                        headline: title,
                        subheadline: subtitle,
                        section: section as ArticleEntry['data']['section'],
                        contentType: contentType as ArticleEntry['data']['contentType'],
                        body,
                        tags: tags.join(', '),
                        placement,
                        sources: sources.join(', '),
                        draftId: null,
                        status: 'published',
                        slug,
                        publishedAt,
                        lastEdited: stats.mtime.toISOString(),
                    },
                });
            } catch (error) {
                console.error(`Error reading published article: ${file}`, error);
            }
        }
    }

    return articles;
}

/**
 * Get all draft articles
 */
function getDraftArticles(): ArticleEntry[] {
    const history = getDraftHistory();
    const articles: ArticleEntry[] = [];

    for (const entry of history) {
        const draft = loadDraft(entry.draftId);
        if (!draft) continue;

        articles.push({
            id: entry.draftId,
            title: entry.headline || 'Untitled',
            section: entry.section as ArticleEntry['section'],
            status: 'draft',
            placement: (draft as { placement?: 'lead' | 'top' | 'standard' }).placement || 'standard',
            lastEdited: entry.savedAt,
            data: {
                headline: draft.headline,
                subheadline: draft.subheadline,
                section: draft.section as ArticleEntry['data']['section'],
                contentType: draft.contentType as ArticleEntry['data']['contentType'],
                body: draft.body,
                tags: Array.isArray(draft.tags) ? draft.tags.join(', ') : '',
                placement: (draft as { placement?: 'lead' | 'top' | 'standard' }).placement || 'standard',
                sources: Array.isArray(draft.sources) ? draft.sources.join(', ') : '',
                draftId: draft.draftId,
                status: 'draft',
                lastEdited: entry.savedAt,
            },
        });
    }

    return articles;
}

/**
 * GET - List all articles (drafts + published)
 */
export async function GET(request: NextRequest): Promise<NextResponse> {
    try {
        const { searchParams } = new URL(request.url);
        const filter = searchParams.get('filter'); // 'drafts', 'published', or 'all'

        let articles: ArticleEntry[] = [];

        if (filter === 'drafts') {
            articles = getDraftArticles();
        } else if (filter === 'published') {
            articles = getPublishedArticles();
        } else {
            // All articles
            articles = [...getDraftArticles(), ...getPublishedArticles()];
        }

        // Sort by lastEdited (newest first)
        articles.sort((a, b) => {
            const dateA = new Date(a.lastEdited).getTime();
            const dateB = new Date(b.lastEdited).getTime();
            return dateB - dateA;
        });

        return NextResponse.json({
            success: true,
            data: {
                articles,
                count: articles.length,
            },
        });
    } catch (error) {
        console.error('Error listing articles:', error);
        return NextResponse.json(
            {
                success: false,
                error: 'Failed to list articles',
            },
            { status: 500 }
        );
    }
}
