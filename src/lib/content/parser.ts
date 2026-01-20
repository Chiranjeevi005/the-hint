/**
 * Minimal Markdown + YAML Frontmatter Parser
 * No external dependencies - hand-rolled for reliability
 */

import {
    ParsedArticle,
    ArticleFrontmatter,
    ContentParseError
} from './types';

/** Regex to match YAML frontmatter delimited by --- */
const FRONTMATTER_REGEX = /^---\r?\n([\s\S]*?)\r?\n---\r?\n([\s\S]*)$/;

/**
 * Parse a YAML value into appropriate JS type
 * Handles: strings, booleans, numbers, null, arrays
 */
function parseYamlValue(value: string): unknown {
    const trimmed = value.trim();

    // Null/empty
    if (trimmed === '' || trimmed === 'null' || trimmed === '~') {
        return null;
    }

    // Boolean
    if (trimmed === 'true') return true;
    if (trimmed === 'false') return false;

    // Quoted string - remove quotes
    if ((trimmed.startsWith('"') && trimmed.endsWith('"')) ||
        (trimmed.startsWith("'") && trimmed.endsWith("'"))) {
        return trimmed.slice(1, -1);
    }

    // Number
    if (/^-?\d+(\.\d+)?$/.test(trimmed)) {
        return parseFloat(trimmed);
    }

    // ISO date string - keep as string
    if (/^\d{4}-\d{2}-\d{2}(T\d{2}:\d{2}:\d{2}(\.\d+)?(Z|[+-]\d{2}:\d{2})?)?$/.test(trimmed)) {
        return trimmed;
    }

    // Plain string
    return trimmed;
}

/**
 * Parse inline YAML array: [item1, item2, item3]
 */
function parseInlineArray(value: string): string[] {
    const trimmed = value.trim();
    if (!trimmed.startsWith('[') || !trimmed.endsWith(']')) {
        return [];
    }

    const inner = trimmed.slice(1, -1);
    if (!inner.trim()) return [];

    return inner.split(',').map(item => {
        const s = item.trim();
        // Remove quotes if present
        if ((s.startsWith('"') && s.endsWith('"')) ||
            (s.startsWith("'") && s.endsWith("'"))) {
            return s.slice(1, -1);
        }
        return s;
    });
}

/**
 * Parse simple YAML frontmatter into an object
 * Supports: key-value pairs, inline arrays, multiline arrays
 */
function parseYamlFrontmatter(yaml: string, filePath: string): Record<string, unknown> {
    const result: Record<string, unknown> = {};
    const lines = yaml.split(/\r?\n/);

    let currentKey: string | null = null;
    let currentArray: string[] | null = null;

    for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        const trimmedLine = line.trim();

        // Skip empty lines and comments
        if (!trimmedLine || trimmedLine.startsWith('#')) {
            continue;
        }

        // Check for array item (starts with -)
        if (trimmedLine.startsWith('-') && currentKey && currentArray !== null) {
            const itemValue = trimmedLine.slice(1).trim();
            // Remove quotes if present
            if ((itemValue.startsWith('"') && itemValue.endsWith('"')) ||
                (itemValue.startsWith("'") && itemValue.endsWith("'"))) {
                currentArray.push(itemValue.slice(1, -1));
            } else {
                currentArray.push(itemValue);
            }
            continue;
        }

        // Save previous array if we're moving to a new key
        if (currentKey && currentArray !== null) {
            result[currentKey] = currentArray;
            currentKey = null;
            currentArray = null;
        }

        // Parse key: value pair
        const colonIndex = line.indexOf(':');
        if (colonIndex === -1) {
            throw new ContentParseError(
                `Invalid YAML syntax at line ${i + 1}: "${line}"`,
                filePath
            );
        }

        const key = line.slice(0, colonIndex).trim();
        const valueStr = line.slice(colonIndex + 1).trim();

        if (!key) {
            throw new ContentParseError(
                `Empty key at line ${i + 1}`,
                filePath
            );
        }

        // Check for inline array
        if (valueStr.startsWith('[')) {
            result[key] = parseInlineArray(valueStr);
            continue;
        }

        // Check for multiline array (empty value, next lines start with -)
        if (!valueStr) {
            currentKey = key;
            currentArray = [];
            continue;
        }

        // Regular key-value
        result[key] = parseYamlValue(valueStr);
    }

    // Don't forget the last array if any
    if (currentKey && currentArray !== null) {
        result[currentKey] = currentArray;
    }

    return result;
}

/**
 * Validate and type-check parsed frontmatter
 */
function validateFrontmatter(
    data: Record<string, unknown>,
    filePath: string
): ArticleFrontmatter {
    const errors: string[] = [];

    // Required string fields
    if (typeof data.title !== 'string' || !data.title) {
        errors.push('title is required and must be a non-empty string');
    }
    if (typeof data.subtitle !== 'string' || !data.subtitle) {
        errors.push('subtitle is required and must be a non-empty string');
    }
    if (typeof data.publishedAt !== 'string' || !data.publishedAt) {
        errors.push('publishedAt is required and must be an ISO date string');
    }

    // Validate contentType enum
    const validContentTypes = ['news', 'opinion'];
    if (!validContentTypes.includes(data.contentType as string)) {
        errors.push(`contentType must be one of: ${validContentTypes.join(', ')}`);
    }

    // Validate publishedAt is valid ISO date
    if (typeof data.publishedAt === 'string') {
        const date = new Date(data.publishedAt);
        if (isNaN(date.getTime())) {
            errors.push('publishedAt must be a valid ISO 8601 date');
        }
    }

    // Validate updatedAt if present
    if (data.updatedAt !== undefined && data.updatedAt !== null) {
        if (typeof data.updatedAt !== 'string') {
            errors.push('updatedAt must be a string or null');
        } else {
            const date = new Date(data.updatedAt);
            if (isNaN(date.getTime())) {
                errors.push('updatedAt must be a valid ISO 8601 date');
            }
        }
    }

    // Validate arrays
    if (data.tags !== undefined && !Array.isArray(data.tags)) {
        errors.push('tags must be an array of strings');
    }
    if (data.sources !== undefined && !Array.isArray(data.sources)) {
        errors.push('sources must be an array of strings');
    }

    // Validate placement
    const validPlacements = ['lead', 'top', 'standard'];
    if (data.placement !== undefined && typeof data.placement !== 'string') {
        errors.push('placement must be a string');
    } else if (data.placement !== undefined && !validPlacements.includes(data.placement as string)) {
        errors.push(`placement must be one of: ${validPlacements.join(', ')}`);
    }

    // Validate featured boolean (legacy)
    if (data.featured !== undefined && typeof data.featured !== 'boolean') {
        errors.push('featured must be a boolean');
    }

    // Validate optional image URL
    if (data.image !== undefined && typeof data.image !== 'string') {
        errors.push('image must be a string URL');
    }

    if (errors.length > 0) {
        throw new ContentParseError(
            `Frontmatter validation failed:\n  - ${errors.join('\n  - ')}`,
            filePath
        );
    }

    // Map legacy featured to placement
    let placement: 'lead' | 'top' | 'standard' | undefined = data.placement as 'lead' | 'top' | 'standard' | undefined;
    if (!placement && data.featured === true) {
        placement = 'lead';
    }

    return {
        title: data.title as string,
        subtitle: data.subtitle as string,
        contentType: data.contentType as 'news' | 'opinion',
        publishedAt: data.publishedAt as string,
        updatedAt: (data.updatedAt as string | null) ?? null,
        placement: placement ?? 'standard',
        image: (data.image as string) ?? undefined,
        tags: (data.tags as string[]) ?? [],
        sources: (data.sources as string[]) ?? [],
    };
}

/**
 * Parse a Markdown file with YAML frontmatter
 * @param content - Raw file content
 * @param filePath - Path for error messages
 * @returns Parsed article with frontmatter and body
 */
export function parseMarkdown(content: string, filePath: string): ParsedArticle {
    const match = content.match(FRONTMATTER_REGEX);

    if (!match) {
        throw new ContentParseError(
            'Invalid Markdown format: Missing or malformed frontmatter. Expected format:\n---\nkey: value\n---\nBody content',
            filePath
        );
    }

    const [, yamlContent, bodyContent] = match;

    const rawFrontmatter = parseYamlFrontmatter(yamlContent, filePath);
    const frontmatter = validateFrontmatter(rawFrontmatter, filePath);

    return {
        frontmatter,
        body: bodyContent.trim(),
    };
}
