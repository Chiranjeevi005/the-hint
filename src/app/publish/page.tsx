'use client';

/**
 * Publishing Console Page
 * Internal editorial console for The Hint newspaper.
 * 
 * This is a SINGLE PAGE that serves TWO purposes:
 * 1. Long-form article editor
 * 2. Editorial content database (CRUD)
 * 
 * RULES:
 * - UI contains ZERO business logic
 * - All validation happens server-side
 * - Client validation is only UX assistance
 * - Publishing must be explicit
 * - Drafts and published articles are strictly separated
 */

import { useState, useCallback, useEffect } from 'react';
import {
    EditorialToolbar,
    ArticleEditor,
    ArticleDatabase,
    Toast,
    ArticleFormData,
    ArticleEntry,
    WorkspaceMode,
    FieldErrors,
    ToastMessage,
    PreviewData,
    ApiResponse,
    INITIAL_FORM_DATA,
} from '@/components/publish';
import styles from './page.module.css';

/** Client-side UX validation hints (NOT business logic) */
function getClientHints(formData: ArticleFormData): Record<string, string> {
    const hints: Record<string, string> = {};

    if (formData.headline && formData.headline.length < 10) {
        hints.headline = `${10 - formData.headline.length} more characters needed`;
    }
    if (formData.headline.length > 150) {
        hints.headline = `${formData.headline.length - 150} characters over limit`;
    }
    if (formData.subheadline.length > 200) {
        hints.subheadline = `${formData.subheadline.length - 200} characters over limit`;
    }
    if (formData.contentType === 'opinion' && formData.section !== 'opinion') {
        hints.contentType = 'Opinion articles must be in Opinion section';
    }

    return hints;
}

/** Check if form has minimum required fields for publishing */
function canPublish(formData: ArticleFormData): boolean {
    return !!(
        formData.headline.trim() &&
        formData.subheadline.trim() &&
        formData.body.trim() &&
        formData.section
    );
}

export default function PublishPage() {
    // Workspace mode
    const [mode, setMode] = useState<WorkspaceMode>('editor');

    // Form state
    const [formData, setFormData] = useState<ArticleFormData>(INITIAL_FORM_DATA);
    const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});

    // Articles list for database mode
    const [articles, setArticles] = useState<ArticleEntry[]>([]);
    const [isLoadingArticles, setIsLoadingArticles] = useState(false);

    // UI state
    const [isSaving, setIsSaving] = useState(false);
    const [isPreviewLoading, setIsPreviewLoading] = useState(false);
    const [isPublishing, setIsPublishing] = useState(false);
    const [showPreview, setShowPreview] = useState(false);
    const [previewData, setPreviewData] = useState<PreviewData | null>(null);

    // Toast notifications
    const [toast, setToast] = useState<ToastMessage | null>(null);

    // Client hints
    const clientHints = getClientHints(formData);

    /**
     * Show toast notification
     */
    const showToast = useCallback((type: 'success' | 'error', message: string, link?: { url: string; label: string }) => {
        setToast({
            id: Date.now().toString(),
            type,
            message,
            link,
        });
    }, []);

    /**
     * Build API payload from form data
     */
    const buildPayload = useCallback(() => {
        const tagsArray = formData.tags.split(',').map(t => t.trim()).filter(Boolean);
        const sourcesArray = formData.sources.split(',').map(s => s.trim()).filter(Boolean);

        return {
            headline: formData.headline,
            subheadline: formData.subheadline,
            section: formData.section,
            contentType: formData.contentType,
            body: formData.body,
            tags: tagsArray,
            sources: sourcesArray,
            placement: formData.placement,
            draftId: formData.draftId,
            status: formData.status,
        };
    }, [formData]);

    /**
     * Parse field errors from API response
     */
    const parseFieldErrors = useCallback((errors?: { field: string; message: string }[]): FieldErrors => {
        if (!errors) return {};
        const result: FieldErrors = {};
        for (const error of errors) {
            result[error.field] = error.message;
        }
        return result;
    }, []);

    /**
     * Fetch articles for database mode
     */
    const fetchArticles = useCallback(async (filter?: string) => {
        setIsLoadingArticles(true);
        try {
            const url = filter ? `/api/publish/articles?filter=${filter}` : '/api/publish/articles';
            const response = await fetch(url);
            const result: ApiResponse = await response.json();

            if (result.success && result.data?.articles) {
                setArticles(result.data.articles as ArticleEntry[]);
            } else {
                showToast('error', result.error || 'Failed to load articles');
            }
        } catch {
            showToast('error', 'Network error while loading articles');
        } finally {
            setIsLoadingArticles(false);
        }
    }, [showToast]);

    /**
     * Load articles when switching to database mode
     */
    useEffect(() => {
        if (mode !== 'editor') {
            const filter = mode === 'drafts' ? 'drafts' : mode === 'published' ? 'published' : undefined;
            fetchArticles(filter);
        }
    }, [mode, fetchArticles]);

    /**
     * Handle mode change
     */
    const handleModeChange = useCallback((newMode: WorkspaceMode) => {
        setMode(newMode);
        setShowPreview(false);
    }, []);

    /**
     * Handle new article
     */
    const handleNewArticle = useCallback(() => {
        setFormData(INITIAL_FORM_DATA);
        setFieldErrors({});
        setShowPreview(false);
        setPreviewData(null);
        setMode('editor');
    }, []);

    /**
     * Handle form changes
     */
    const handleFormChange = useCallback((data: ArticleFormData) => {
        setFormData(data);
        // Clear field errors when user makes changes
        const changedFields = Object.keys(data).filter(
            key => data[key as keyof ArticleFormData] !== formData[key as keyof ArticleFormData]
        );
        if (changedFields.length > 0) {
            setFieldErrors(prev => {
                const next = { ...prev };
                for (const field of changedFields) {
                    delete next[field];
                }
                return next;
            });
        }
    }, [formData]);

    /**
     * Save Draft
     */
    const handleSaveDraft = useCallback(async () => {
        setIsSaving(true);
        setFieldErrors({});

        try {
            const payload = buildPayload();
            const response = await fetch('/api/publish/draft', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
            });

            const result: ApiResponse = await response.json();

            if (result.success && result.data?.draftId) {
                setFormData(prev => ({ ...prev, draftId: result.data!.draftId! }));
                showToast('success', 'Draft saved successfully');
            } else if (!result.success && result.errors?.length) {
                setFieldErrors(parseFieldErrors(result.errors));
                showToast('error', result.errors[0].message);
            } else {
                showToast('error', result.error || 'Failed to save draft');
            }
        } catch {
            showToast('error', 'Network error while saving draft');
        } finally {
            setIsSaving(false);
        }
    }, [buildPayload, parseFieldErrors, showToast]);

    /**
     * Preview
     */
    const handlePreview = useCallback(async () => {
        setIsPreviewLoading(true);

        try {
            const payload = buildPayload();
            const response = await fetch('/api/publish/preview', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
            });

            const result: ApiResponse = await response.json();

            if (result.success && result.data?.preview) {
                setPreviewData(result.data.preview);
                setShowPreview(true);
            } else {
                showToast('error', result.error || 'Failed to generate preview');
            }
        } catch {
            showToast('error', 'Network error while generating preview');
        } finally {
            setIsPreviewLoading(false);
        }
    }, [buildPayload, showToast]);

    /**
     * Publish
     */
    const handlePublish = useCallback(async () => {
        // Confirm before publishing
        if (!window.confirm('Are you sure you want to publish this article?\n\nThis action is IRREVERSIBLE.')) {
            return;
        }

        setIsPublishing(true);
        setFieldErrors({});

        try {
            const payload = { ...buildPayload(), status: 'published' };
            const response = await fetch('/api/publish', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
            });

            const result: ApiResponse = await response.json();

            if (result.success) {
                setFormData(INITIAL_FORM_DATA);
                setShowPreview(false);
                showToast(
                    'success',
                    'Article published successfully',
                    result.data?.url ? { url: result.data.url, label: 'View Article' } : undefined
                );
            } else if (result.errors?.length) {
                setFieldErrors(parseFieldErrors(result.errors));
                showToast('error', result.errors[0].message);
            } else {
                showToast('error', result.error || 'Failed to publish article');
            }
        } catch {
            showToast('error', 'Network error while publishing');
        } finally {
            setIsPublishing(false);
        }
    }, [buildPayload, parseFieldErrors, showToast]);

    /**
     * Logout
     */
    const handleLogout = useCallback(async () => {
        try {
            await fetch('/api/auth/logout', { method: 'POST' });
            window.location.href = '/newsroom';
        } catch (error) {
            console.error('Logout failed', error);
        }
    }, []);

    /**
     * Edit article (from database view)
     */
    const handleEdit = useCallback((article: ArticleEntry) => {
        setFormData(article.data);
        setFieldErrors({});
        setShowPreview(false);
        setMode('editor');
    }, []);

    /**
     * Duplicate article
     */
    const handleDuplicate = useCallback(async (article: ArticleEntry) => {
        try {
            const response = await fetch('/api/publish/duplicate', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    id: article.id,
                    type: article.status,
                    section: article.section,
                    slug: article.slug,
                }),
            });

            const result: ApiResponse = await response.json();

            if (result.success) {
                showToast('success', `Created: "${result.data?.headline}"`);
                // Refresh articles list
                const filter = mode === 'drafts' ? 'drafts' : mode === 'published' ? 'published' : undefined;
                fetchArticles(filter);
            } else {
                showToast('error', result.error || 'Failed to duplicate article');
            }
        } catch {
            showToast('error', 'Network error while duplicating');
        }
    }, [mode, fetchArticles, showToast]);

    /**
     * Delete article
     */
    const handleDelete = useCallback(async (article: ArticleEntry) => {
        try {
            const response = await fetch('/api/publish/delete', {
                method: 'DELETE',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    id: article.id,
                    type: article.status,
                    section: article.section,
                    slug: article.slug,
                }),
            });

            const result: ApiResponse = await response.json();

            if (result.success) {
                showToast('success', 'Article deleted');
                // Refresh articles list
                const filter = mode === 'drafts' ? 'drafts' : mode === 'published' ? 'published' : undefined;
                fetchArticles(filter);
            } else {
                showToast('error', result.error || 'Failed to delete article');
            }
        } catch {
            showToast('error', 'Network error while deleting');
        }
    }, [mode, fetchArticles, showToast]);

    /**
     * Close preview
     */
    const handleClosePreview = useCallback(() => {
        setShowPreview(false);
    }, []);

    return (
        <div className={styles.page}>
            {/* Toast Notifications */}
            <Toast toast={toast} onDismiss={() => setToast(null)} />

            {/* Editorial Toolbar */}
            <EditorialToolbar
                mode={mode}
                onModeChange={handleModeChange}
                onNewArticle={handleNewArticle}
                onSaveDraft={handleSaveDraft}
                onPreview={handlePreview}
                onPublish={handlePublish}
                onLogout={handleLogout}
                isSaving={isSaving}
                isPreviewLoading={isPreviewLoading}
                isPublishing={isPublishing}
                canPublish={canPublish(formData)}
                draftId={formData.draftId}
            />

            {/* Main Workspace */}
            <main className={styles.workspace}>
                {mode === 'editor' ? (
                    <ArticleEditor
                        formData={formData}
                        onFormChange={handleFormChange}
                        fieldErrors={fieldErrors}
                        clientHints={clientHints}
                        previewData={previewData}
                        showPreview={showPreview}
                        onClosePreview={handleClosePreview}
                    />
                ) : (
                    <ArticleDatabase
                        articles={articles}
                        mode={mode}
                        isLoading={isLoadingArticles}
                        onEdit={handleEdit}
                        onDuplicate={handleDuplicate}
                        onDelete={handleDelete}
                    />
                )}
            </main>
        </div>
    );
}
