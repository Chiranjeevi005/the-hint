/**
 * Video Block Editor Modal
 * Modal for adding and configuring video blocks
 * 
 * DESIGN SPEC: .agent/specifications/MEDIA_SYSTEM_DESIGN.md
 * 
 * Supported providers:
 * - YouTube (youtube.com, youtu.be)
 * - Vimeo (vimeo.com)
 * - CDN (direct video URLs)
 */

'use client';

import { useState, useCallback } from 'react';
import type { VideoBlock, VideoProvider } from '@/lib/content/media-types';
import { MEDIA_LIMITS } from '@/lib/content/media-types';
import styles from './VideoBlockEditor.module.css';

interface VideoBlockEditorProps {
    /** Block being edited (null for new block) */
    block: VideoBlock | null;
    /** Current video count in article */
    currentVideoCount: number;
    /** Callback when save is clicked */
    onSave: (data: {
        provider: VideoProvider;
        videoId: string;
        embedUrl: string;
        posterUrl: string;
        caption?: string;
        title?: string;
        duration?: number;
    }) => void;
    /** Callback when cancel is clicked */
    onCancel: () => void;
}

export function VideoBlockEditor({
    block,
    currentVideoCount,
    onSave,
    onCancel
}: VideoBlockEditorProps) {
    // Form state
    const [url, setUrl] = useState('');
    const [caption, setCaption] = useState(block?.caption || '');

    // Fetched data
    const [videoData, setVideoData] = useState<{
        provider: VideoProvider;
        videoId: string;
        embedUrl: string;
        posterUrl: string;
        title: string;
        duration?: number;
    } | null>(block ? {
        provider: block.provider,
        videoId: block.videoId,
        embedUrl: block.embedUrl,
        posterUrl: block.posterUrl,
        title: block.title || '',
        duration: block.duration,
    } : null);

    // Fetch state
    const [isFetching, setIsFetching] = useState(false);
    const [fetchError, setFetchError] = useState<string | null>(null);

    // Warning state
    const showSoftLimitWarning = currentVideoCount >= MEDIA_LIMITS.MAX_VIDEOS && !block;

    /**
     * Fetch video info from URL
     */
    const handleFetchVideo = useCallback(async () => {
        if (!url.trim()) {
            setFetchError('Please enter a video URL');
            return;
        }

        setFetchError(null);
        setIsFetching(true);

        try {
            const response = await fetch('/api/media/video-info', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ url: url.trim() }),
            });

            const result = await response.json();

            if (result.success && result.data) {
                setVideoData({
                    provider: result.data.provider,
                    videoId: result.data.videoId,
                    embedUrl: result.data.embedUrl,
                    posterUrl: result.data.posterUrl,
                    title: result.data.title,
                    duration: result.data.duration,
                });
            } else {
                setFetchError(result.error || 'Failed to fetch video info');
            }
        } catch (error) {
            setFetchError('Network error while fetching video info');
        } finally {
            setIsFetching(false);
        }
    }, [url]);

    /**
     * Handle save
     */
    const handleSave = useCallback(() => {
        if (!videoData) {
            setFetchError('Please add a video first');
            return;
        }

        onSave({
            provider: videoData.provider,
            videoId: videoData.videoId,
            embedUrl: videoData.embedUrl,
            posterUrl: videoData.posterUrl,
            caption: caption.trim() || undefined,
            title: videoData.title || undefined,
            duration: videoData.duration,
        });
    }, [videoData, caption, onSave]);

    /**
     * Clear video data to start over
     */
    const handleClear = useCallback(() => {
        setVideoData(null);
        setUrl('');
        setFetchError(null);
    }, []);

    /**
     * Format duration for display
     */
    const formatDuration = (seconds: number): string => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    /**
     * Get provider display name
     */
    const getProviderName = (provider: VideoProvider): string => {
        switch (provider) {
            case 'youtube': return 'YouTube';
            case 'vimeo': return 'Vimeo';
            case 'cdn': return 'Direct Video';
            default: return 'Video';
        }
    };

    const isEditing = !!block;
    const canSave = !!videoData && !isFetching;

    return (
        <div className={styles.overlay} onClick={onCancel}>
            <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
                <div className={styles.header}>
                    <h3 className={styles.title}>
                        {isEditing ? 'Edit Video' : 'Insert Video'}
                    </h3>
                    <button
                        type="button"
                        className={styles.closeButton}
                        onClick={onCancel}
                        aria-label="Close"
                    >
                        ×
                    </button>
                </div>

                <div className={styles.content}>
                    {/* Soft limit warning */}
                    {showSoftLimitWarning && (
                        <div className={styles.warning}>
                            <span className={styles.warningIcon}>⚠️</span>
                            <span>
                                Article already has {currentVideoCount} video.
                                Adding more may impact page performance.
                            </span>
                        </div>
                    )}

                    {/* Video Preview / URL Input */}
                    {videoData ? (
                        <div className={styles.preview}>
                            <div className={styles.thumbnail}>
                                {videoData.posterUrl ? (
                                    <img
                                        src={videoData.posterUrl}
                                        alt={videoData.title || 'Video thumbnail'}
                                        className={styles.thumbnailImage}
                                        onError={(e) => {
                                            // Fallback if maxres doesn't exist
                                            const img = e.target as HTMLImageElement;
                                            if (videoData.provider === 'youtube' && img.src.includes('maxresdefault')) {
                                                img.src = img.src.replace('maxresdefault', 'hqdefault');
                                            }
                                        }}
                                    />
                                ) : (
                                    <div className={styles.thumbnailPlaceholder}>
                                        <span>🎬</span>
                                    </div>
                                )}
                                <div className={styles.playButton}>▶</div>
                            </div>

                            <div className={styles.videoInfo}>
                                <span className={styles.provider}>
                                    {getProviderName(videoData.provider)}
                                </span>
                                <h4 className={styles.videoTitle}>
                                    {videoData.title || 'Untitled Video'}
                                </h4>
                                {videoData.duration && (
                                    <span className={styles.duration}>
                                        {formatDuration(videoData.duration)}
                                    </span>
                                )}
                            </div>

                            {!isEditing && (
                                <button
                                    type="button"
                                    className={styles.clearButton}
                                    onClick={handleClear}
                                >
                                    Change
                                </button>
                            )}
                        </div>
                    ) : (
                        <div className={styles.urlInput}>
                            <label className={styles.label}>Video URL</label>
                            <div className={styles.inputGroup}>
                                <input
                                    type="text"
                                    value={url}
                                    onChange={(e) => setUrl(e.target.value)}
                                    placeholder="Paste YouTube or Vimeo URL..."
                                    className={styles.input}
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter') handleFetchVideo();
                                    }}
                                />
                                <button
                                    type="button"
                                    className={styles.fetchButton}
                                    onClick={handleFetchVideo}
                                    disabled={isFetching || !url.trim()}
                                >
                                    {isFetching ? 'Loading...' : 'Fetch'}
                                </button>
                            </div>
                            <span className={styles.hint}>
                                Supports YouTube and Vimeo links
                            </span>
                        </div>
                    )}

                    {fetchError && (
                        <div className={styles.error}>
                            {fetchError}
                        </div>
                    )}

                    {/* Caption Field */}
                    <div className={styles.field}>
                        <label className={styles.label}>
                            Caption <span className={styles.optional}>(optional)</span>
                        </label>
                        <input
                            type="text"
                            value={caption}
                            onChange={(e) => setCaption(e.target.value)}
                            placeholder="Caption displayed below the video"
                            className={styles.input}
                        />
                    </div>
                </div>

                <div className={styles.footer}>
                    <button
                        type="button"
                        className={styles.cancelButton}
                        onClick={onCancel}
                    >
                        Cancel
                    </button>
                    <button
                        type="button"
                        className={styles.saveButton}
                        onClick={handleSave}
                        disabled={!canSave}
                    >
                        {isEditing ? 'Save Changes' : 'Insert Video'}
                    </button>
                </div>
            </div>
        </div>
    );
}
