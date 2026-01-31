/**
 * Media Counter Component
 * Displays current media usage relative to limits
 * 
 * DESIGN SPEC: .agent/specifications/MEDIA_SYSTEM_DESIGN.md
 */

'use client';

import { MEDIA_LIMITS } from '@/lib/content/media-types';
import type { MediaSummary } from '@/lib/content/media-types';
import styles from './MediaCounter.module.css';

interface MediaCounterProps {
    /** Current media summary */
    summary: MediaSummary;
}

export function MediaCounter({ summary }: MediaCounterProps) {
    const { imageCount, videoCount } = summary;
    const { MAX_IMAGES, MAX_VIDEOS } = MEDIA_LIMITS;

    const imageAtLimit = imageCount >= MAX_IMAGES;
    const videoAtLimit = videoCount >= MAX_VIDEOS;

    return (
        <div className={styles.counter}>
            <div className={styles.counterGroup}>
                <span
                    className={`${styles.counterItem} ${imageAtLimit ? styles.atLimit : ''}`}
                    title={imageAtLimit ? 'Image limit reached' : `${MAX_IMAGES - imageCount} images remaining`}
                >
                    <span className={styles.icon}>🖼</span>
                    <span className={styles.count}>
                        {imageCount}/{MAX_IMAGES}
                    </span>
                    {imageAtLimit && <span className={styles.limitBadge}>limit</span>}
                </span>
            </div>

            <span className={styles.separator}>•</span>

            <div className={styles.counterGroup}>
                <span
                    className={`${styles.counterItem} ${videoAtLimit ? styles.atSoftLimit : ''}`}
                    title={videoAtLimit ? 'Consider limiting to 1 video for performance' : `${MAX_VIDEOS - videoCount} video slot available`}
                >
                    <span className={styles.icon}>🎬</span>
                    <span className={styles.count}>
                        {videoCount}/{MAX_VIDEOS}
                    </span>
                    {videoAtLimit && videoCount > 0 && (
                        <span className={styles.warnBadge}>perf</span>
                    )}
                </span>
            </div>
        </div>
    );
}
