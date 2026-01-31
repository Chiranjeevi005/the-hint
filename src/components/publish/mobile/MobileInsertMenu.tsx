/**
 * Mobile Insert Menu
 * Bottom sheet for inserting blocks on mobile devices
 * 
 * Contains:
 * - Paragraph
 * - Subheading
 * - Quote
 * - Image (with count)
 * - Video (with count)
 * 
 * Opens as a bottom sheet for tap-based block insertion
 */

'use client';

import { useCallback, useEffect } from 'react';
import { ContentBlockType, MEDIA_LIMITS } from '@/lib/content/media-types';
import styles from './MobileInsertMenu.module.css';

interface InsertOption {
    type: ContentBlockType;
    label: string;
    icon: string;
    disabled: boolean;
    reason?: string;
}

interface MobileInsertMenuProps {
    /** Whether the menu is open */
    isOpen: boolean;
    /** Handler to close the menu */
    onClose: () => void;
    /** Handler for option selection */
    onSelect: (type: ContentBlockType) => void;
    /** Current image count */
    imageCount: number;
    /** Current video count */
    videoCount: number;
    /** Whether image insertion is valid at position */
    canInsertImage: boolean;
    /** Why image can't be inserted */
    imageDisabledReason?: string;
    /** Whether video insertion is valid at position */
    canInsertVideo: boolean;
    /** Why video can't be inserted */
    videoDisabledReason?: string;
}

export function MobileInsertMenu({
    isOpen,
    onClose,
    onSelect,
    imageCount,
    videoCount,
    canInsertImage,
    imageDisabledReason,
    canInsertVideo,
    videoDisabledReason,
}: MobileInsertMenuProps) {

    // Lock body scroll when menu is open
    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = '';
        }
        return () => {
            document.body.style.overflow = '';
        };
    }, [isOpen]);

    const options: InsertOption[] = [
        { type: 'paragraph', label: 'Paragraph', icon: '¶', disabled: false },
        { type: 'subheading', label: 'Subheading', icon: 'H', disabled: false },
        { type: 'quote', label: 'Quote', icon: '❝', disabled: false },
        {
            type: 'image',
            label: `Image (${imageCount}/${MEDIA_LIMITS.MAX_IMAGES})`,
            icon: '🖼',
            disabled: !canInsertImage || imageCount >= MEDIA_LIMITS.MAX_IMAGES,
            reason: imageDisabledReason,
        },
        {
            type: 'video',
            label: `Video (${videoCount}/${MEDIA_LIMITS.MAX_VIDEOS})`,
            icon: '🎬',
            disabled: !canInsertVideo,
            reason: videoDisabledReason,
        },
    ];

    const handleSelect = useCallback((option: InsertOption) => {
        if (!option.disabled) {
            onSelect(option.type);
            onClose();
        }
    }, [onSelect, onClose]);

    if (!isOpen) return null;

    return (
        <div className={styles.overlay} onClick={onClose}>
            <div className={styles.menu} onClick={(e) => e.stopPropagation()}>
                <div className={styles.header}>
                    <div className={styles.dragHandle} />
                    <h3 className={styles.title}>Insert Block</h3>
                </div>
                <div className={styles.options}>
                    {options.map((option) => (
                        <button
                            key={option.type}
                            type="button"
                            className={`${styles.option} ${option.disabled ? styles.disabled : ''}`}
                            onClick={() => handleSelect(option)}
                            disabled={option.disabled}
                        >
                            <span className={styles.optionIcon}>{option.icon}</span>
                            <div className={styles.optionContent}>
                                <span className={styles.optionLabel}>{option.label}</span>
                                {option.reason && (
                                    <span className={styles.optionReason}>{option.reason}</span>
                                )}
                            </div>
                        </button>
                    ))}
                </div>
                <button
                    type="button"
                    className={styles.cancelButton}
                    onClick={onClose}
                >
                    Cancel
                </button>
            </div>
        </div>
    );
}
