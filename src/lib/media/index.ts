/**
 * Media Module Index
 * Re-exports all media utilities
 */

// Upload utilities
export {
    processImageUpload,
    generateImageHash,
    ensureMediaDirectories,
    getImageDimensions,
    loadMediaRegistry,
    saveMediaRegistry,
    registerMediaAsset,
    updateAssetUsage,
    getOrphanedAssets,
    type ImageUploadResult,
} from './upload';

// Video provider utilities
export {
    parseVideoUrl,
    getPosterUrl,
    getYouTubeThumbnailUrls,
    fetchVideoOEmbed,
    getVideoInfo,
    isValidVideoUrl,
    isSupportedProvider,
    getProviderDisplayName,
    type VideoParseResult,
    type VideoOEmbedData,
    type VideoInfoResult,
} from './video-providers';
