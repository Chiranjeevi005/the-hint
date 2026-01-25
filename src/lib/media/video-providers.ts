/**
 * Video Provider Integration
 * Handles YouTube, Vimeo, and CDN video URL parsing and oEmbed fetching
 * 
 * DESIGN SPEC: .agent/specifications/MEDIA_SYSTEM_DESIGN.md
 * 
 * Supported Providers:
 * - YouTube (youtube.com, youtu.be)
 * - Vimeo (vimeo.com)
 * - CDN (direct video URLs: .mp4, .webm, .m3u8)
 * 
 * Rate Limiting Note:
 * These endpoints assume authenticated editor usage behind session middleware.
 * Rate limiting is deferred to infrastructure layer.
 */

import { VideoProvider, ALLOWED_VIDEO_PROVIDERS } from '../content/media-types';

// =============================================================================
// TYPES
// =============================================================================

/** Result of parsing a video URL */
export interface VideoParseResult {
    /** Whether the URL is valid */
    valid: boolean;
    /** Detected provider */
    provider?: VideoProvider;
    /** Extracted video ID */
    videoId?: string;
    /** Generated embed URL */
    embedUrl?: string;
    /** Error message if invalid */
    error?: string;
}

/** oEmbed data fetched from provider */
export interface VideoOEmbedData {
    /** Video title */
    title: string;
    /** Thumbnail/poster URL */
    thumbnailUrl: string;
    /** Thumbnail width */
    thumbnailWidth?: number;
    /** Thumbnail height */
    thumbnailHeight?: number;
    /** Video duration in seconds */
    duration?: number;
    /** Author/channel name */
    authorName?: string;
    /** Provider name */
    providerName: string;
}

/** Complete video info result */
export interface VideoInfoResult {
    /** Whether operation succeeded */
    success: boolean;
    /** Parsed video data */
    data?: {
        provider: VideoProvider;
        videoId: string;
        embedUrl: string;
        posterUrl: string;
        title: string;
        duration?: number;
        authorName?: string;
    };
    /** Error message if failed */
    error?: string;
}

// =============================================================================
// URL PATTERNS
// =============================================================================

/** YouTube URL patterns */
const YOUTUBE_PATTERNS: RegExp[] = [
    // Standard watch URL
    /(?:https?:\/\/)?(?:www\.)?youtube\.com\/watch\?v=([a-zA-Z0-9_-]{11})/,
    // Short URL
    /(?:https?:\/\/)?youtu\.be\/([a-zA-Z0-9_-]{11})/,
    // Embed URL
    /(?:https?:\/\/)?(?:www\.)?youtube\.com\/embed\/([a-zA-Z0-9_-]{11})/,
    // Shorts
    /(?:https?:\/\/)?(?:www\.)?youtube\.com\/shorts\/([a-zA-Z0-9_-]{11})/,
    // With additional params
    /(?:https?:\/\/)?(?:www\.)?youtube\.com\/watch\?.*v=([a-zA-Z0-9_-]{11})/,
];

/** Vimeo URL patterns */
const VIMEO_PATTERNS: RegExp[] = [
    // Standard URL
    /(?:https?:\/\/)?(?:www\.)?vimeo\.com\/(\d+)/,
    // Player embed URL
    /(?:https?:\/\/)?player\.vimeo\.com\/video\/(\d+)/,
    // With hash
    /(?:https?:\/\/)?(?:www\.)?vimeo\.com\/(\d+)\/[a-zA-Z0-9]+/,
];

/** CDN/direct video patterns */
const CDN_PATTERNS: RegExp[] = [
    // Direct video file URLs
    /^https?:\/\/.+\.(mp4|webm|m3u8)(\?.*)?$/i,
];

// =============================================================================
// URL PARSING
// =============================================================================

/**
 * Parse any video URL and extract provider and ID
 */
export function parseVideoUrl(url: string): VideoParseResult {
    if (!url || typeof url !== 'string') {
        return { valid: false, error: 'Video URL is required' };
    }

    const trimmedUrl = url.trim();

    if (trimmedUrl === '') {
        return { valid: false, error: 'Video URL cannot be empty' };
    }

    // Try YouTube patterns
    for (const pattern of YOUTUBE_PATTERNS) {
        const match = trimmedUrl.match(pattern);
        if (match && match[1]) {
            return {
                valid: true,
                provider: 'youtube',
                videoId: match[1],
                embedUrl: `https://www.youtube.com/embed/${match[1]}`,
            };
        }
    }

    // Try Vimeo patterns
    for (const pattern of VIMEO_PATTERNS) {
        const match = trimmedUrl.match(pattern);
        if (match && match[1]) {
            return {
                valid: true,
                provider: 'vimeo',
                videoId: match[1],
                embedUrl: `https://player.vimeo.com/video/${match[1]}`,
            };
        }
    }

    // Try CDN patterns
    for (const pattern of CDN_PATTERNS) {
        if (pattern.test(trimmedUrl)) {
            return {
                valid: true,
                provider: 'cdn',
                videoId: trimmedUrl, // For CDN, the full URL is the ID
                embedUrl: trimmedUrl,
            };
        }
    }

    return {
        valid: false,
        error: 'Unsupported video URL. Please use YouTube, Vimeo, or a direct video link (.mp4, .webm)',
    };
}

// =============================================================================
// POSTER/THUMBNAIL GENERATION
// =============================================================================

/**
 * Get poster URL for a video
 * For YouTube, we can generate directly
 * For Vimeo, requires oEmbed fetch
 * For CDN, requires manual upload
 */
export function getPosterUrl(provider: VideoProvider, videoId: string): string {
    switch (provider) {
        case 'youtube':
            // Try maxresdefault, may fall back to hqdefault on client
            return `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`;
        case 'vimeo':
            // Vimeo doesn't have a direct URL pattern, needs oEmbed
            return '';
        case 'cdn':
            // CDN videos need manual poster upload
            return '';
        default:
            return '';
    }
}

/**
 * Get all YouTube thumbnail quality options
 */
export function getYouTubeThumbnailUrls(videoId: string): Record<string, string> {
    return {
        maxresdefault: `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`,
        sddefault: `https://img.youtube.com/vi/${videoId}/sddefault.jpg`,
        hqdefault: `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`,
        mqdefault: `https://img.youtube.com/vi/${videoId}/mqdefault.jpg`,
        default: `https://img.youtube.com/vi/${videoId}/default.jpg`,
    };
}

// =============================================================================
// oEmbed FETCHING
// =============================================================================

/**
 * Fetch video metadata via oEmbed API
 */
export async function fetchVideoOEmbed(
    provider: VideoProvider,
    videoId: string
): Promise<VideoOEmbedData | null> {
    try {
        const oEmbedUrl = getOEmbedUrl(provider, videoId);
        if (!oEmbedUrl) {
            return null;
        }

        const response = await fetch(oEmbedUrl, {
            headers: {
                'Accept': 'application/json',
            },
        });

        if (!response.ok) {
            console.error(`oEmbed fetch failed: ${response.status}`);
            return null;
        }

        const data = await response.json();
        return parseOEmbedResponse(provider, data);
    } catch (error) {
        console.error('oEmbed fetch error:', error);
        return null;
    }
}

/**
 * Get oEmbed API URL for a provider
 */
function getOEmbedUrl(provider: VideoProvider, videoId: string): string | null {
    switch (provider) {
        case 'youtube':
            return `https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=${videoId}&format=json`;
        case 'vimeo':
            return `https://vimeo.com/api/oembed.json?url=https://vimeo.com/${videoId}`;
        case 'cdn':
            return null; // No oEmbed for direct URLs
        default:
            return null;
    }
}

/**
 * Parse oEmbed response into normalized format
 */
function parseOEmbedResponse(
    provider: VideoProvider,
    data: Record<string, unknown>
): VideoOEmbedData {
    switch (provider) {
        case 'youtube':
            return {
                title: String(data.title || 'Untitled Video'),
                thumbnailUrl: String(data.thumbnail_url || ''),
                thumbnailWidth: Number(data.thumbnail_width) || undefined,
                thumbnailHeight: Number(data.thumbnail_height) || undefined,
                authorName: String(data.author_name || ''),
                providerName: 'YouTube',
            };

        case 'vimeo':
            return {
                title: String(data.title || 'Untitled Video'),
                thumbnailUrl: String(data.thumbnail_url || ''),
                thumbnailWidth: Number(data.thumbnail_width) || undefined,
                thumbnailHeight: Number(data.thumbnail_height) || undefined,
                duration: Number(data.duration) || undefined,
                authorName: String(data.author_name || ''),
                providerName: 'Vimeo',
            };

        default:
            return {
                title: 'Video',
                thumbnailUrl: '',
                providerName: 'Unknown',
            };
    }
}

// =============================================================================
// COMPLETE VIDEO INFO
// =============================================================================

/**
 * Get complete video information from a URL
 * Parses URL, fetches oEmbed data, and returns complete VideoBlock data
 */
export async function getVideoInfo(url: string): Promise<VideoInfoResult> {
    // Parse URL
    const parsed = parseVideoUrl(url);

    if (!parsed.valid || !parsed.provider || !parsed.videoId) {
        return {
            success: false,
            error: parsed.error || 'Invalid video URL',
        };
    }

    const { provider, videoId, embedUrl } = parsed;

    // Get poster URL (immediate for YouTube)
    let posterUrl = getPosterUrl(provider, videoId);

    // Fetch oEmbed for additional metadata
    let title = 'Video';
    let duration: number | undefined;
    let authorName: string | undefined;

    const oEmbed = await fetchVideoOEmbed(provider, videoId);
    if (oEmbed) {
        title = oEmbed.title;
        duration = oEmbed.duration;
        authorName = oEmbed.authorName;

        // Use oEmbed thumbnail if we don't have one (Vimeo)
        if (!posterUrl && oEmbed.thumbnailUrl) {
            posterUrl = oEmbed.thumbnailUrl;
        }
    }

    return {
        success: true,
        data: {
            provider,
            videoId,
            embedUrl: embedUrl || '',
            posterUrl,
            title,
            duration,
            authorName,
        },
    };
}

// =============================================================================
// VALIDATION HELPERS
// =============================================================================

/**
 * Check if a video URL is supported
 */
export function isValidVideoUrl(url: string): boolean {
    const result = parseVideoUrl(url);
    return result.valid;
}

/**
 * Check if a provider is supported
 */
export function isSupportedProvider(provider: string): provider is VideoProvider {
    return ALLOWED_VIDEO_PROVIDERS.includes(provider as VideoProvider);
}

/**
 * Get display name for a provider
 */
export function getProviderDisplayName(provider: VideoProvider): string {
    switch (provider) {
        case 'youtube':
            return 'YouTube';
        case 'vimeo':
            return 'Vimeo';
        case 'cdn':
            return 'Direct Video';
        default:
            return 'Video';
    }
}
