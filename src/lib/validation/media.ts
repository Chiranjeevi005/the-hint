/**
 * Media Validation Utilities
 * Server-side validation for media blocks in articles
 * 
 * DESIGN SPEC: .agent/specifications/MEDIA_SYSTEM_DESIGN.md
 * 
 * CRITICAL: All validation happens server-side.
 * Client validation is ONLY for UX assistance.
 * 
 * Rules Enforced:
 * - Max 3 images (hard block)
 * - Max 1 video (soft warning)
 * - Media blocks must have text context (before AND after)
 * - Consecutive media blocks not allowed
 * - Alt text required for all images
 * - Explicit dimensions required for images
 */

import {
    ContentBlock,
    ImageBlock,
    VideoBlock,
    MEDIA_LIMITS,
    ALLOWED_IMAGE_FORMATS,
    MAX_IMAGE_SIZE_BYTES,
    ALLOWED_VIDEO_PROVIDERS,
    isTextBlock,
    isMediaBlock,
    isImageBlock,
    isVideoBlock,
    AllowedImageFormat,
    VideoProvider,
} from '../content/media-types';

// =============================================================================
// VALIDATION RESULT TYPES
// =============================================================================

/** Error types for media validation */
export type MediaValidationErrorType =
    | 'image_limit_exceeded'
    | 'video_limit_exceeded'
    | 'missing_alt_text'
    | 'empty_alt_text'
    | 'invalid_image_url'
    | 'invalid_video_url'
    | 'missing_dimensions'
    | 'invalid_dimensions'
    | 'no_text_context_before'
    | 'no_text_context_after'
    | 'consecutive_media_blocks'
    | 'article_starts_with_media'
    | 'article_ends_with_media'
    | 'invalid_image_format'
    | 'image_too_large'
    | 'invalid_video_provider'
    | 'missing_poster_url'
    | 'empty_blocks'
    | 'media_only_article';

/** Warning types for media validation */
export type MediaValidationWarningType =
    | 'video_soft_limit'
    | 'missing_caption'
    | 'missing_credit';

/** A single validation error */
export interface MediaValidationError {
    /** Error type identifier */
    type: MediaValidationErrorType;
    /** Human-readable error message */
    message: string;
    /** Block ID where error occurred (if applicable) */
    blockId?: string;
    /** Block index in array (for debugging) */
    blockIndex?: number;
}

/** A single validation warning (non-blocking) */
export interface MediaValidationWarning {
    /** Warning type identifier */
    type: MediaValidationWarningType;
    /** Human-readable warning message */
    message: string;
    /** Block ID where warning applies (if applicable) */
    blockId?: string;
    /** Block index in array */
    blockIndex?: number;
}

/** Complete validation result */
export interface MediaValidationResult {
    /** Whether all hard validations passed */
    isValid: boolean;
    /** Blocking errors that prevent publishing */
    errors: MediaValidationError[];
    /** Non-blocking warnings */
    warnings: MediaValidationWarning[];
}

// =============================================================================
// MAIN VALIDATION FUNCTION
// =============================================================================

/**
 * Validate all media blocks in an article.
 * This is the primary validation function called before publishing.
 * 
 * @param blocks - Array of content blocks to validate
 * @returns Validation result with errors and warnings
 */
export function validateMediaBlocks(blocks: ContentBlock[]): MediaValidationResult {
    const errors: MediaValidationError[] = [];
    const warnings: MediaValidationWarning[] = [];

    // Empty blocks check
    if (!blocks || blocks.length === 0) {
        errors.push({
            type: 'empty_blocks',
            message: 'Article must contain at least one content block',
        });
        return { isValid: false, errors, warnings };
    }

    // Count media blocks
    const imageBlocks = blocks.filter(isImageBlock);
    const videoBlocks = blocks.filter(isVideoBlock);
    const textBlocks = blocks.filter(isTextBlock);

    // Check for media-only article
    if (textBlocks.length === 0) {
        errors.push({
            type: 'media_only_article',
            message: 'Article cannot contain only media. Text content is required.',
        });
    }

    // HARD LIMIT: Max 3 images
    if (imageBlocks.length > MEDIA_LIMITS.MAX_IMAGES) {
        errors.push({
            type: 'image_limit_exceeded',
            message: `Maximum ${MEDIA_LIMITS.MAX_IMAGES} images allowed per article. Found: ${imageBlocks.length}`,
        });
    }

    // SOFT LIMIT: Max 1 video (warning, not error)
    if (videoBlocks.length > MEDIA_LIMITS.MAX_VIDEOS) {
        warnings.push({
            type: 'video_soft_limit',
            message: `Recommended maximum is ${MEDIA_LIMITS.MAX_VIDEOS} video per article. Found: ${videoBlocks.length}. This may impact page performance.`,
        });
    }

    // Validate first block is text
    if (isMediaBlock(blocks[0])) {
        errors.push({
            type: 'article_starts_with_media',
            message: 'Article must begin with text content, not media',
            blockId: blocks[0].id,
            blockIndex: 0,
        });
    }

    // Validate last block is text
    const lastBlock = blocks[blocks.length - 1];
    if (isMediaBlock(lastBlock)) {
        errors.push({
            type: 'article_ends_with_media',
            message: 'Article must end with text content, not media',
            blockId: lastBlock.id,
            blockIndex: blocks.length - 1,
        });
    }

    // Validate each block
    for (let i = 0; i < blocks.length; i++) {
        const block = blocks[i];
        const prevBlock = blocks[i - 1];
        const nextBlock = blocks[i + 1];

        if (isImageBlock(block)) {
            validateImageBlock(block, i, errors, warnings);
        }

        if (isVideoBlock(block)) {
            validateVideoBlock(block, i, errors, warnings);
        }

        // Check for consecutive media blocks
        if (isMediaBlock(block) && prevBlock && isMediaBlock(prevBlock)) {
            errors.push({
                type: 'consecutive_media_blocks',
                message: 'Media blocks must be separated by text content',
                blockId: block.id,
                blockIndex: i,
            });
        }

        // Check for text context (not first or last - those are caught above)
        if (isMediaBlock(block) && i > 0 && i < blocks.length - 1) {
            // Check text before (already caught by consecutive check, but be explicit)
            if (!prevBlock || !isTextBlock(prevBlock)) {
                // Only add if not already caught by consecutive media error
                const hasConsecutiveError = errors.some(
                    e => e.type === 'consecutive_media_blocks' && e.blockIndex === i
                );
                if (!hasConsecutiveError) {
                    errors.push({
                        type: 'no_text_context_before',
                        message: 'Media block must have text content before it',
                        blockId: block.id,
                        blockIndex: i,
                    });
                }
            }

            // Check text after
            if (!nextBlock || !isTextBlock(nextBlock)) {
                // Will be caught when we process the next block if it's media
                // But catch the case where next is undefined or invalid
                if (!nextBlock) {
                    errors.push({
                        type: 'no_text_context_after',
                        message: 'Media block must have text content after it',
                        blockId: block.id,
                        blockIndex: i,
                    });
                }
            }
        }
    }

    return {
        isValid: errors.length === 0,
        errors,
        warnings,
    };
}

// =============================================================================
// IMAGE BLOCK VALIDATION
// =============================================================================

/**
 * Validate a single image block
 */
function validateImageBlock(
    block: ImageBlock,
    index: number,
    errors: MediaValidationError[],
    warnings: MediaValidationWarning[]
): void {
    // Alt text is REQUIRED
    if (block.alt === undefined || block.alt === null) {
        errors.push({
            type: 'missing_alt_text',
            message: 'Image requires alt text for accessibility',
            blockId: block.id,
            blockIndex: index,
        });
    } else if (block.alt.trim() === '') {
        errors.push({
            type: 'empty_alt_text',
            message: 'Image alt text cannot be empty',
            blockId: block.id,
            blockIndex: index,
        });
    }

    // Dimensions are REQUIRED (prevents layout shift)
    if (!block.width || !block.height) {
        errors.push({
            type: 'missing_dimensions',
            message: 'Image requires explicit width and height dimensions',
            blockId: block.id,
            blockIndex: index,
        });
    } else if (block.width <= 0 || block.height <= 0) {
        errors.push({
            type: 'invalid_dimensions',
            message: 'Image dimensions must be positive numbers',
            blockId: block.id,
            blockIndex: index,
        });
    }

    // URL is required
    if (!block.src || block.src.trim() === '') {
        errors.push({
            type: 'invalid_image_url',
            message: 'Image source URL is required',
            blockId: block.id,
            blockIndex: index,
        });
    }

    // Caption warning (encouraged but not required)
    if (!block.caption || block.caption.trim() === '') {
        warnings.push({
            type: 'missing_caption',
            message: 'Consider adding a caption to provide editorial context',
            blockId: block.id,
            blockIndex: index,
        });
    }

    // Credit warning
    if (!block.credit || block.credit.trim() === '') {
        warnings.push({
            type: 'missing_credit',
            message: 'Consider adding a photo credit',
            blockId: block.id,
            blockIndex: index,
        });
    }
}

// =============================================================================
// VIDEO BLOCK VALIDATION
// =============================================================================

/**
 * Validate a single video block
 */
function validateVideoBlock(
    block: VideoBlock,
    index: number,
    errors: MediaValidationError[],
    warnings: MediaValidationWarning[]
): void {
    // Provider must be valid
    if (!block.provider || !ALLOWED_VIDEO_PROVIDERS.includes(block.provider)) {
        errors.push({
            type: 'invalid_video_provider',
            message: `Video provider must be one of: ${ALLOWED_VIDEO_PROVIDERS.join(', ')}`,
            blockId: block.id,
            blockIndex: index,
        });
    }

    // Video ID required
    if (!block.videoId || block.videoId.trim() === '') {
        errors.push({
            type: 'invalid_video_url',
            message: 'Video ID is required',
            blockId: block.id,
            blockIndex: index,
        });
    }

    // Embed URL required
    if (!block.embedUrl || block.embedUrl.trim() === '') {
        errors.push({
            type: 'invalid_video_url',
            message: 'Video embed URL is required',
            blockId: block.id,
            blockIndex: index,
        });
    }

    // Poster URL required (for facade pattern)
    if (!block.posterUrl || block.posterUrl.trim() === '') {
        errors.push({
            type: 'missing_poster_url',
            message: 'Video requires a poster/thumbnail image',
            blockId: block.id,
            blockIndex: index,
        });
    }

    // Caption warning
    if (!block.caption || block.caption.trim() === '') {
        warnings.push({
            type: 'missing_caption',
            message: 'Consider adding a caption to describe the video content',
            blockId: block.id,
            blockIndex: index,
        });
    }
}

// =============================================================================
// FILE UPLOAD VALIDATION
// =============================================================================

/**
 * Validate an image file before upload
 */
export function validateImageFile(
    file: { size: number; type: string; name: string }
): MediaValidationResult {
    const errors: MediaValidationError[] = [];
    const warnings: MediaValidationWarning[] = [];

    // Check file size
    if (file.size > MAX_IMAGE_SIZE_BYTES) {
        const sizeMB = (file.size / (1024 * 1024)).toFixed(2);
        const maxMB = (MAX_IMAGE_SIZE_BYTES / (1024 * 1024)).toFixed(0);
        errors.push({
            type: 'image_too_large',
            message: `Image file is ${sizeMB}MB. Maximum allowed is ${maxMB}MB.`,
        });
    }

    // Check file type
    if (!ALLOWED_IMAGE_FORMATS.includes(file.type as AllowedImageFormat)) {
        errors.push({
            type: 'invalid_image_format',
            message: `Image format "${file.type}" is not supported. Allowed: JPEG, PNG, WebP, AVIF`,
        });
    }

    return {
        isValid: errors.length === 0,
        errors,
        warnings,
    };
}

// =============================================================================
// VIDEO URL VALIDATION
// =============================================================================

/** YouTube URL patterns */
const YOUTUBE_PATTERNS = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([a-zA-Z0-9_-]{11})/,
    /youtube\.com\/shorts\/([a-zA-Z0-9_-]{11})/,
];

/** Vimeo URL patterns */
const VIMEO_PATTERNS = [
    /vimeo\.com\/(\d+)/,
    /player\.vimeo\.com\/video\/(\d+)/,
];

/**
 * Parse a video URL and extract provider and ID
 */
export function parseVideoUrl(url: string): {
    valid: boolean;
    provider?: VideoProvider;
    videoId?: string;
    error?: string;
} {
    if (!url || url.trim() === '') {
        return { valid: false, error: 'Video URL is required' };
    }

    const trimmedUrl = url.trim();

    // Check YouTube patterns
    for (const pattern of YOUTUBE_PATTERNS) {
        const match = trimmedUrl.match(pattern);
        if (match && match[1]) {
            return {
                valid: true,
                provider: 'youtube',
                videoId: match[1],
            };
        }
    }

    // Check Vimeo patterns
    for (const pattern of VIMEO_PATTERNS) {
        const match = trimmedUrl.match(pattern);
        if (match && match[1]) {
            return {
                valid: true,
                provider: 'vimeo',
                videoId: match[1],
            };
        }
    }

    // Check if it's a direct video URL (CDN)
    if (/\.(mp4|webm|m3u8)(\?|$)/i.test(trimmedUrl)) {
        return {
            valid: true,
            provider: 'cdn',
            videoId: trimmedUrl, // For CDN, videoId is the full URL
        };
    }

    return {
        valid: false,
        error: 'Unsupported video URL. Use YouTube, Vimeo, or direct video links.',
    };
}

/**
 * Generate embed URL from provider and video ID
 */
export function generateEmbedUrl(provider: VideoProvider, videoId: string): string {
    switch (provider) {
        case 'youtube':
            return `https://www.youtube.com/embed/${videoId}`;
        case 'vimeo':
            return `https://player.vimeo.com/video/${videoId}`;
        case 'cdn':
            return videoId; // CDN uses the direct URL
        default:
            return '';
    }
}

/**
 * Generate poster URL for video (YouTube/Vimeo thumbnails)
 */
export function generatePosterUrl(provider: VideoProvider, videoId: string): string {
    switch (provider) {
        case 'youtube':
            // Use maxresdefault with fallback to hqdefault
            return `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`;
        case 'vimeo':
            // Vimeo requires API call - return placeholder, will be fetched via oEmbed
            return '';
        case 'cdn':
            // CDN videos need manual poster upload
            return '';
        default:
            return '';
    }
}

// =============================================================================
// BLOCK ORDER VALIDATION (for drag-drop)
// =============================================================================

/**
 * Check if a proposed block order is valid
 * Used for drag-and-drop validation
 */
export function isValidBlockOrder(blocks: ContentBlock[]): MediaValidationResult {
    // Use the main validation function but filter to order-related errors only
    const result = validateMediaBlocks(blocks);

    const orderErrors = result.errors.filter(e =>
        e.type === 'article_starts_with_media' ||
        e.type === 'article_ends_with_media' ||
        e.type === 'consecutive_media_blocks' ||
        e.type === 'no_text_context_before' ||
        e.type === 'no_text_context_after'
    );

    return {
        isValid: orderErrors.length === 0,
        errors: orderErrors,
        warnings: [], // Don't surface warnings during drag
    };
}

/**
 * Check if inserting a media block at a specific position is valid
 */
export function canInsertMediaAt(
    blocks: ContentBlock[],
    position: number,
    mediaType: 'image' | 'video'
): { valid: boolean; reason?: string } {
    // Can't insert at start
    if (position === 0) {
        return { valid: false, reason: 'Media cannot be the first block' };
    }

    // Can't insert at end (would become last block)
    if (position >= blocks.length) {
        return { valid: false, reason: 'Media cannot be the last block' };
    }

    // Check if previous block is media
    const prevBlock = blocks[position - 1];
    if (prevBlock && isMediaBlock(prevBlock)) {
        return { valid: false, reason: 'Media blocks must be separated by text' };
    }

    // Check if next block is media
    const nextBlock = blocks[position];
    if (nextBlock && isMediaBlock(nextBlock)) {
        return { valid: false, reason: 'Media blocks must be separated by text' };
    }

    // Check limits
    if (mediaType === 'image') {
        const imageCount = blocks.filter(isImageBlock).length;
        if (imageCount >= MEDIA_LIMITS.MAX_IMAGES) {
            return { valid: false, reason: `Maximum ${MEDIA_LIMITS.MAX_IMAGES} images allowed` };
        }
    }

    return { valid: true };
}
