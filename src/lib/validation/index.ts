/**
 * Validation Utilities Index
 * Re-exports all validation utilities
 */

export {
    VALID_CONTENT_TYPES,
    VALID_SECTIONS,
    sanitizeString,
    sanitizeStringArray,
    generateSlug,
    isNonEmptyString,
    isValidContentType,
    isValidSection,
    isValidFeatured,
    validateArticleInput,
    transformToValidatedData,
} from './article';

export type {
    FieldValidationError,
    ValidationResult,
    PublishArticleInput,
    ValidatedArticleData,
} from './article';
