/**
 * Article Validation Utilities
 * Server-side validation for publishing articles
 */

import { ContentType, Section } from '../content/types';

/** Valid content types */
export const VALID_CONTENT_TYPES: ContentType[] = ['news', 'analysis', 'opinion'];

/** Valid sections */
export const VALID_SECTIONS: Section[] = [
    'politics',
    'crime',
    'court',
    'opinion',
    'world-affairs',
];

/** Validation result for a single field */
export interface FieldValidationError {
    field: string;
    message: string;
}

/** Complete validation result */
export interface ValidationResult {
    isValid: boolean;
    errors: FieldValidationError[];
}

/**
 * Sanitize a string input by trimming and removing dangerous characters
 */
export function sanitizeString(input: unknown): string {
    if (typeof input !== 'string') {
        return '';
    }
    // Trim whitespace and normalize line endings
    return input.trim().replace(/\r\n/g, '\n').replace(/\r/g, '\n');
}

/**
 * Sanitize an array of strings
 */
export function sanitizeStringArray(input: unknown): string[] {
    if (!Array.isArray(input)) {
        return [];
    }
    return input
        .filter((item): item is string => typeof item === 'string')
        .map(item => sanitizeString(item))
        .filter(item => item.length > 0);
}

/**
 * Generate a URL-safe slug from a title
 */
export function generateSlug(title: string): string {
    return title
        .toLowerCase()
        .trim()
        // Replace spaces and underscores with hyphens
        .replace(/[\s_]+/g, '-')
        // Remove all non-alphanumeric characters except hyphens
        .replace(/[^a-z0-9-]/g, '')
        // Remove consecutive hyphens
        .replace(/-+/g, '-')
        // Remove leading/trailing hyphens
        .replace(/^-+|-+$/g, '');
}

/**
 * Validate that a string is non-empty
 */
export function isNonEmptyString(value: unknown): value is string {
    return typeof value === 'string' && value.trim().length > 0;
}

/**
 * Validate content type
 */
export function isValidContentType(value: unknown): value is ContentType {
    return typeof value === 'string' && VALID_CONTENT_TYPES.includes(value as ContentType);
}

/**
 * Validate section
 */
export function isValidSection(value: unknown): value is Section {
    return typeof value === 'string' && VALID_SECTIONS.includes(value as Section);
}

/**
 * Validate that featured is a boolean
 */
export function isValidFeatured(value: unknown): boolean {
    return typeof value === 'boolean';
}

/**
 * Article publish data interface (raw input from form)
 */
export interface PublishArticleInput {
    title: unknown;
    subtitle: unknown;
    section: unknown;
    contentType: unknown;
    body: unknown;
    tags: unknown;
    featured: unknown;
    sources: unknown;
}

/**
 * Validated article data ready for publishing
 */
export interface ValidatedArticleData {
    title: string;
    subtitle: string;
    section: Section;
    contentType: ContentType;
    body: string;
    tags: string[];
    featured: boolean;
    sources: string[];
    slug: string;
}

/**
 * Validate all article fields for publishing
 */
export function validateArticleInput(input: PublishArticleInput): ValidationResult {
    const errors: FieldValidationError[] = [];

    // Validate title
    if (!isNonEmptyString(input.title)) {
        errors.push({ field: 'title', message: 'Title is required and must be a non-empty string' });
    } else if (input.title.length > 200) {
        errors.push({ field: 'title', message: 'Title must be 200 characters or less' });
    }

    // Validate subtitle
    if (!isNonEmptyString(input.subtitle)) {
        errors.push({ field: 'subtitle', message: 'Subtitle is required and must be a non-empty string' });
    } else if (input.subtitle.length > 500) {
        errors.push({ field: 'subtitle', message: 'Subtitle must be 500 characters or less' });
    }

    // Validate section
    if (!isValidSection(input.section)) {
        errors.push({
            field: 'section',
            message: `Section must be one of: ${VALID_SECTIONS.join(', ')}`
        });
    }

    // Validate contentType
    if (!isValidContentType(input.contentType)) {
        errors.push({
            field: 'contentType',
            message: `Content type must be one of: ${VALID_CONTENT_TYPES.join(', ')}`
        });
    }

    // Validate opinion rule: opinion contentType can only be in opinion section
    if (input.contentType === 'opinion' && input.section !== 'opinion') {
        errors.push({
            field: 'contentType',
            message: 'Opinion articles can only be published in the Opinion section'
        });
    }

    // Validate body
    if (!isNonEmptyString(input.body)) {
        errors.push({ field: 'body', message: 'Body content is required and cannot be empty' });
    }

    // Validate featured (must be boolean)
    if (typeof input.featured !== 'boolean') {
        errors.push({ field: 'featured', message: 'Featured must be a boolean value' });
    }

    // Tags and sources are optional but must be arrays if provided
    if (input.tags !== undefined && input.tags !== null && !Array.isArray(input.tags)) {
        errors.push({ field: 'tags', message: 'Tags must be an array of strings' });
    }

    if (input.sources !== undefined && input.sources !== null && !Array.isArray(input.sources)) {
        errors.push({ field: 'sources', message: 'Sources must be an array of strings' });
    }

    return {
        isValid: errors.length === 0,
        errors,
    };
}

/**
 * Transform and sanitize validated input into clean article data
 */
export function transformToValidatedData(input: PublishArticleInput): ValidatedArticleData {
    const title = sanitizeString(input.title);
    const subtitle = sanitizeString(input.subtitle);
    const body = sanitizeString(input.body);
    const section = input.section as Section;
    const contentType = input.contentType as ContentType;
    const featured = input.featured === true;
    const tags = sanitizeStringArray(input.tags);
    const sources = sanitizeStringArray(input.sources);
    const slug = generateSlug(title);

    return {
        title,
        subtitle,
        section,
        contentType,
        body,
        tags,
        featured,
        sources,
        slug,
    };
}
