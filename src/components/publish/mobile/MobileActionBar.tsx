/**
 * Mobile Action Bar
 * Fixed bottom action bar for mobile devices
 * 
 * Contains:
 * - Article Settings button (opens MobileSettingsPanel)
 * - Save Draft button
 * - Preview button
 * - Publish button
 * 
 * Always visible at bottom of screen on mobile
 * Disabled states are clearly shown
 */

'use client';

import styles from './MobileActionBar.module.css';

interface MobileActionBarProps {
    /** Handler for opening settings panel */
    onOpenSettings: () => void;
    /** Handler for save draft */
    onSaveDraft: () => void;
    /** Handler for preview */
    onPreview: () => void;
    /** Handler for publish */
    onPublish: () => void;
    /** Whether save is in progress */
    isSaving: boolean;
    /** Whether preview is loading */
    isPreviewLoading: boolean;
    /** Whether publish is in progress */
    isPublishing: boolean;
    /** Whether publish button should be disabled */
    canPublish: boolean;
    /** Whether in editor mode */
    isEditorMode: boolean;
}

export function MobileActionBar({
    onOpenSettings,
    onSaveDraft,
    onPreview,
    onPublish,
    isSaving,
    isPreviewLoading,
    isPublishing,
    canPublish,
    isEditorMode,
}: MobileActionBarProps) {
    if (!isEditorMode) return null;

    return (
        <div className={styles.actionBar}>
            {/* Settings Button */}
            <button
                type="button"
                className={styles.settingsButton}
                onClick={onOpenSettings}
                aria-label="Article Settings"
            >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="12" cy="12" r="3" />
                    <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
                </svg>
                <span className={styles.buttonLabel}>Settings</span>
            </button>

            {/* Actions Container */}
            <div className={styles.actionsGroup}>
                {/* Save Draft */}
                <button
                    type="button"
                    className={styles.actionButton}
                    onClick={onSaveDraft}
                    disabled={isSaving}
                >
                    {isSaving ? 'Saving…' : 'Save'}
                </button>

                {/* Preview */}
                <button
                    type="button"
                    className={styles.actionButton}
                    onClick={onPreview}
                    disabled={isPreviewLoading}
                >
                    {isPreviewLoading ? 'Preparing…' : 'Preview'}
                </button>

                {/* Publish */}
                <button
                    type="button"
                    className={`${styles.actionButton} ${styles.publishButton}`}
                    onClick={onPublish}
                    disabled={isPublishing || !canPublish}
                >
                    {isPublishing ? 'Publishing…' : 'Publish'}
                </button>
            </div>
        </div>
    );
}
