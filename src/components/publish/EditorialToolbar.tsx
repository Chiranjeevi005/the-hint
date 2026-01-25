'use client';

/**
 * Editorial Toolbar
 * Persistent navigation and action bar for the publishing console
 * 
 * Left group: Navigation tabs (New Article, All Articles, Drafts, Published)
 * Right group: Actions (Save Draft, Preview, Publish, Logout)
 */

import { WorkspaceMode } from './types';
import styles from './EditorialToolbar.module.css';

interface EditorialToolbarProps {
    /** Current workspace mode */
    mode: WorkspaceMode;
    /** Handler for mode changes */
    onModeChange: (mode: WorkspaceMode) => void;
    /** Handler for new article */
    onNewArticle: () => void;
    /** Handler for save draft */
    onSaveDraft: () => void;
    /** Handler for preview */
    onPreview: () => void;
    /** Handler for publish */
    onPublish: () => void;
    /** Handler for logout */
    onLogout: () => void;
    /** Whether save is in progress */
    isSaving: boolean;
    /** Whether preview is loading */
    isPreviewLoading: boolean;
    /** Whether publish is in progress */
    isPublishing: boolean;
    /** Whether publish button should be disabled */
    canPublish: boolean;
    /** Current draft ID if editing */
    draftId: string | null;
}

export function EditorialToolbar({
    mode,
    onModeChange,
    onNewArticle,
    onSaveDraft,
    onPreview,
    onPublish,
    onLogout,
    isSaving,
    isPreviewLoading,
    isPublishing,
    canPublish,
    draftId,
}: EditorialToolbarProps) {
    const isEditorMode = mode === 'editor';

    return (
        <div className={styles.toolbar}>
            {/* Left group: Navigation */}
            <div className={styles.navGroup}>
                <button
                    type="button"
                    className={`${styles.navTab} ${mode === 'editor' ? styles.active : ''}`}
                    onClick={onNewArticle}
                >
                    New Article
                </button>
                <button
                    type="button"
                    className={`${styles.navTab} ${mode === 'all' ? styles.active : ''}`}
                    onClick={() => onModeChange('all')}
                >
                    All Articles
                </button>
                <button
                    type="button"
                    className={`${styles.navTab} ${mode === 'drafts' ? styles.active : ''}`}
                    onClick={() => onModeChange('drafts')}
                >
                    Drafts
                </button>
                <button
                    type="button"
                    className={`${styles.navTab} ${mode === 'published' ? styles.active : ''}`}
                    onClick={() => onModeChange('published')}
                >
                    Published
                </button>
            </div>

            {/* Draft indicator */}
            {draftId && isEditorMode && (
                <span className={styles.draftIndicator}>
                    Draft: {draftId.slice(0, 12)}...
                </span>
            )}

            {/* Right group: Actions */}
            <div className={styles.actionGroup}>
                {isEditorMode && (
                    <>
                        <button
                            type="button"
                            className={styles.actionButton}
                            onClick={onSaveDraft}
                            disabled={isSaving}
                        >
                            {isSaving ? 'Saving...' : 'Save Draft'}
                        </button>
                        <button
                            type="button"
                            className={styles.actionButton}
                            onClick={onPreview}
                            disabled={isPreviewLoading}
                        >
                            {isPreviewLoading ? 'Loading...' : 'Preview'}
                        </button>
                        <button
                            type="button"
                            className={`${styles.actionButton} ${styles.publishAction}`}
                            onClick={onPublish}
                            disabled={isPublishing}
                        >
                            {isPublishing ? 'Publishing...' : 'Publish'}
                        </button>
                    </>
                )}
                <button
                    type="button"
                    className={`${styles.actionButton} ${styles.logoutAction}`}
                    onClick={onLogout}
                >
                    Logout
                </button>
            </div>
        </div>
    );
}
