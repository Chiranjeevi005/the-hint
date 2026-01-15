/**
 * Content Reader Utility
 * Reads and validates Markdown articles from /src/content/{section}/
 */

import fs from 'fs';
import path from 'path';
import { parseMarkdown } from './parser';
import {
    Article,
    Section,
    ContentValidationError,
    ContentParseError,
} from './types';

/** Valid section folder names */
const VALID_SECTIONS: Section[] = [
    'politics',
    'crime',
    'court',
    'opinion',
    'world-affairs',
];

/** Base path for content files */
const CONTENT_BASE_PATH = path.join(process.cwd(), 'src', 'content');

/**
 * Validate that a section string is a valid Section type
 */
function isValidSection(section: string): section is Section {
    return VALID_SECTIONS.includes(section as Section);
}

/**
 * Extract slug from filename (remove .md extension)
 */
function getSlugFromFilename(filename: string): string {
    return filename.replace(/\.md$/, '');
}

/**
 * Get relative path from content root for error messages
 */
function getRelativePath(filePath: string): string {
    return path.relative(CONTENT_BASE_PATH, filePath);
}

/**
 * Read and parse a single article file
 * @param filePath - Absolute path to the Markdown file
 * @param expectedSection - Section folder the file should belong to
 * @returns Validated Article object
 */
function readArticleFile(filePath: string, expectedSection: Section): Article {
    const relativePath = getRelativePath(filePath);

    // Read file content
    let content: string;
    try {
        content = fs.readFileSync(filePath, 'utf-8');
    } catch (error) {
        throw new ContentParseError(
            `Failed to read file: ${(error as Error).message}`,
            relativePath
        );
    }

    // Parse markdown and frontmatter
    const parsed = parseMarkdown(content, relativePath);
    const { frontmatter, body } = parsed;

    // Extract slug from filename
    const filename = path.basename(filePath);
    const slug = getSlugFromFilename(filename);

    // Validate: opinion contentType can only appear in opinion section
    if (frontmatter.contentType === 'opinion' && expectedSection !== 'opinion') {
        throw new ContentValidationError(
            `Opinion articles can only be placed in the /opinion section. ` +
            `Found opinion article in /${expectedSection}`,
            relativePath,
            'contentType'
        );
    }

    // Validate: body cannot be empty
    if (!body || body.trim().length === 0) {
        throw new ContentValidationError(
            'Article body cannot be empty',
            relativePath,
            'body'
        );
    }

    // Construct validated article
    const article: Article = {
        id: slug,
        section: expectedSection,
        title: frontmatter.title,
        subtitle: frontmatter.subtitle,
        contentType: frontmatter.contentType,
        publishedAt: frontmatter.publishedAt,
        updatedAt: frontmatter.updatedAt ?? null,
        featured: frontmatter.featured ?? false,
        tags: frontmatter.tags ?? [],
        sources: frontmatter.sources ?? [],
        body: body,
    };

    return article;
}

/**
 * Read all articles from a specific section
 * @param section - Section folder name
 * @returns Array of validated articles
 */
function readSectionArticles(section: Section): Article[] {
    const sectionPath = path.join(CONTENT_BASE_PATH, section);

    // Check if section directory exists
    if (!fs.existsSync(sectionPath)) {
        return [];
    }

    // Read all .md files in the section
    const files = fs.readdirSync(sectionPath);
    const mdFiles = files.filter(f => f.endsWith('.md'));

    const articles: Article[] = [];

    for (const filename of mdFiles) {
        const filePath = path.join(sectionPath, filename);

        // Skip directories (shouldn't happen but safety check)
        const stat = fs.statSync(filePath);
        if (!stat.isFile()) continue;

        const article = readArticleFile(filePath, section);
        articles.push(article);
    }

    return articles;
}

/**
 * Get all articles from all sections
 * @returns Array of all validated articles, sorted by publishedAt (newest first)
 */
export function getAllArticles(): Article[] {
    const allArticles: Article[] = [];

    for (const section of VALID_SECTIONS) {
        const sectionArticles = readSectionArticles(section);
        allArticles.push(...sectionArticles);
    }

    // Sort by publishedAt descending (newest first)
    allArticles.sort((a, b) => {
        const dateA = new Date(a.publishedAt).getTime();
        const dateB = new Date(b.publishedAt).getTime();
        return dateB - dateA;
    });

    return allArticles;
}

/**
 * Get a single article by section and slug
 * @param section - Section folder name
 * @param slug - Article slug (filename without .md)
 * @returns Article if found, null otherwise
 * @throws ContentValidationError if section is invalid
 */
export function getArticleBySlug(section: string, slug: string): Article | null {
    // Validate section
    if (!isValidSection(section)) {
        throw new ContentValidationError(
            `Invalid section: "${section}". Valid sections are: ${VALID_SECTIONS.join(', ')}`,
            `${section}/${slug}.md`,
            'section'
        );
    }

    const filePath = path.join(CONTENT_BASE_PATH, section, `${slug}.md`);

    // Check if file exists
    if (!fs.existsSync(filePath)) {
        return null;
    }

    return readArticleFile(filePath, section);
}

/**
 * Get all articles from a specific section
 * @param section - Section folder name
 * @returns Array of articles in that section, sorted by publishedAt (newest first)
 * @throws ContentValidationError if section is invalid
 */
export function getArticlesBySection(section: string): Article[] {
    // Validate section
    if (!isValidSection(section)) {
        throw new ContentValidationError(
            `Invalid section: "${section}". Valid sections are: ${VALID_SECTIONS.join(', ')}`,
            section,
            'section'
        );
    }

    const articles = readSectionArticles(section);

    // Sort by publishedAt descending (newest first)
    articles.sort((a, b) => {
        const dateA = new Date(a.publishedAt).getTime();
        const dateB = new Date(b.publishedAt).getTime();
        return dateB - dateA;
    });

    return articles;
}

/**
 * Get all featured articles across all sections
 * @returns Array of featured articles, sorted by publishedAt (newest first)
 */
export function getFeaturedArticles(): Article[] {
    return getAllArticles().filter(article => article.featured);
}

/**
 * Get articles by tag
 * @param tag - Tag to filter by
 * @returns Array of articles with the specified tag
 */
export function getArticlesByTag(tag: string): Article[] {
    return getAllArticles().filter(article =>
        article.tags.some(t => t.toLowerCase() === tag.toLowerCase())
    );
}

/**
 * Get all unique tags across all articles
 * @returns Array of unique tags, sorted alphabetically
 */
export function getAllTags(): string[] {
    const allArticles = getAllArticles();
    const tagSet = new Set<string>();

    for (const article of allArticles) {
        for (const tag of article.tags) {
            tagSet.add(tag.toLowerCase());
        }
    }

    return Array.from(tagSet).sort();
}

/**
 * Get list of all valid sections
 * @returns Array of valid section names
 */
export function getValidSections(): Section[] {
    return [...VALID_SECTIONS];
}
