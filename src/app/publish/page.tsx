'use client';

/**
 * Publishing Console Page
 * Internal tool for publishing articles to The Hint newspaper.
 * 
 * RULES:
 * - UI contains ZERO business logic
 * - All validation happens server-side
 * - Client validation is only UX assistance
 * - Publishing must be explicit and irreversible
 * - Drafts and published articles are strictly separated
 */

import { useState, FormEvent, ChangeEvent, useCallback, useEffect } from 'react';
import styles from './publish.module.css';

/** Valid sections - display only, validation is server-side */
const SECTIONS = [
    { value: 'politics', label: 'Politics' },
    { value: 'crime', label: 'Crime' },
    { value: 'court', label: 'Court' },
    { value: 'opinion', label: 'Opinion' },
    { value: 'world-affairs', label: 'World Affairs' },
] as const;

/** Valid content types - news or opinion only */
const CONTENT_TYPES = [
    { value: 'news', label: 'News' },
    { value: 'opinion', label: 'Opinion' },
] as const;

/** API response structure */
interface ApiResponse {
    success: boolean;
    message?: string;
    error?: string;
    errors?: { field: string; message: string }[];
    data?: {
        slug?: string;
        section?: string;
        url?: string;
        draftId?: string;
        savedAt?: string;
        publishedAt?: string;
        preview?: PreviewData;
        drafts?: DraftHistoryEntry[];
    };
}

/** Preview data from API */
interface PreviewData {
    headline: string;
    subheadline: string;
    section: string;
    contentType: string;
    body: string;
    tags: string[];
    sources: string[];
    featured: boolean;
    previewDate: string;
}

/** Draft history entry */
interface DraftHistoryEntry {
    draftId: string;
    headline: string;
    savedAt: string;
    section: string;
    contentType: string;
}

/** Form data structure */
interface FormData {
    headline: string;
    subheadline: string;
    section: string;
    contentType: string;
    body: string;
    tags: string;
    featured: boolean;
    sources: string;
    draftId: string | null;
}

/** Field-level errors from server */
type FieldErrors = Record<string, string>;

const INITIAL_FORM_DATA: FormData = {
    headline: '',
    subheadline: '',
    section: 'politics',
    contentType: 'news',
    body: '',
    tags: '',
    featured: false,
    sources: '',
    draftId: null,
};

/** Client-side UX validation (NOT business logic - just helper hints) */
function getClientHints(formData: FormData): Record<string, string> {
    const hints: Record<string, string> = {};

    // Headline hints
    if (formData.headline && formData.headline.length < 10) {
        hints.headline = `${10 - formData.headline.length} more characters needed`;
    }
    if (formData.headline.length > 150) {
        hints.headline = `${formData.headline.length - 150} characters over limit`;
    }

    // Subheadline hints
    if (formData.subheadline.length > 200) {
        hints.subheadline = `${formData.subheadline.length - 200} characters over limit`;
    }

    // Opinion must be in opinion section (UX hint only)
    if (formData.contentType === 'opinion' && formData.section !== 'opinion') {
        hints.contentType = 'Opinion articles must be in Opinion section';
    }

    return hints;
}

export default function PublishPage() {
    // Form state
    const [formData, setFormData] = useState<FormData>(INITIAL_FORM_DATA);

    // UI state
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isSavingDraft, setIsSavingDraft] = useState(false);
    const [isLoadingPreview, setIsLoadingPreview] = useState(false);
    const [isLoadingHistory, setIsLoadingHistory] = useState(false);

    // Result states
    const [submitResult, setSubmitResult] = useState<ApiResponse | null>(null);
    const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});

    // View states
    const [showHistory, setShowHistory] = useState(false);
    const [showPreview, setShowPreview] = useState(false);
    const [previewData, setPreviewData] = useState<PreviewData | null>(null);
    const [draftHistory, setDraftHistory] = useState<DraftHistoryEntry[]>([]);

    // Client-side hints
    const clientHints = getClientHints(formData);

    /**
     * Auto-dismiss toast after 5 seconds
     */
    useEffect(() => {
        if (submitResult) {
            const timer = setTimeout(() => {
                setSubmitResult(null);
            }, 5000);
            return () => clearTimeout(timer);
        }
    }, [submitResult]);

    /**
     * Handle input changes
     */
    const handleInputChange = useCallback((
        e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
    ) => {
        const { name, value, type } = e.target;

        if (type === 'checkbox') {
            const checked = (e.target as HTMLInputElement).checked;
            setFormData(prev => ({ ...prev, [name]: checked }));
        } else {
            setFormData(prev => ({ ...prev, [name]: value }));
        }

        // Clear field error when user types
        if (fieldErrors[name]) {
            setFieldErrors(prev => {
                const next = { ...prev };
                delete next[name];
                return next;
            });
        }
    }, [fieldErrors]);

    /**
     * Build payload for API calls
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
            featured: formData.featured,
            draftId: formData.draftId,
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
     * SAVE DRAFT
     * - Validates required fields for draft (headline + body)
     * - Writes to drafts store
     * - Overwrites existing draft with same ID
     */
    const handleSaveDraft = useCallback(async () => {
        setIsSavingDraft(true);
        setSubmitResult(null);
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
                // Update form with new draft ID
                setFormData(prev => ({ ...prev, draftId: result.data!.draftId! }));
                setSubmitResult({ success: true, message: 'Draft saved successfully' });
            } else if (!result.success && result.errors && result.errors.length > 0) {
                // Show first specific error in toast, all errors in fields
                setFieldErrors(parseFieldErrors(result.errors));
                setSubmitResult({
                    success: false,
                    error: result.errors[0].message  // Show first specific error
                });
            } else {
                setSubmitResult(result);
            }
        } catch {
            setSubmitResult({ success: false, error: 'Network error occurred while saving draft.' });
        } finally {
            setIsSavingDraft(false);
        }
    }, [buildPayload, parseFieldErrors]);

    /**
     * PREVIEW
     * - Uses SAME rendering pipeline as live article page
     * - Generates ephemeral preview (no persistence)
     * - Opens in preview panel
     */
    const handlePreview = useCallback(async () => {
        setIsLoadingPreview(true);
        setShowPreview(false);
        setPreviewData(null);

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
                setShowHistory(false);
            } else {
                setSubmitResult({ success: false, error: result.error || 'Failed to generate preview' });
            }
        } catch {
            setSubmitResult({ success: false, error: 'Network error occurred while generating preview.' });
        } finally {
            setIsLoadingPreview(false);
        }
    }, [buildPayload]);

    /**
     * VIEW HISTORY
     * - Shows chronological list of saved drafts
     * - Read-only
     * - Allows restoring a previous version into editor
     */
    const handleHistory = useCallback(async () => {
        setIsLoadingHistory(true);
        setShowHistory(false);

        try {
            const response = await fetch('/api/publish/draft?history=true', {
                method: 'GET',
            });

            const result: ApiResponse = await response.json();

            if (result.success && result.data?.drafts) {
                setDraftHistory(result.data.drafts);
                setShowHistory(true);
                setShowPreview(false);
            } else {
                setSubmitResult({ success: false, error: result.error || 'Failed to load history' });
            }
        } catch {
            setSubmitResult({ success: false, error: 'Network error occurred while loading history.' });
        } finally {
            setIsLoadingHistory(false);
        }
    }, []);

    /**
     * RESTORE DRAFT from history
     */
    const handleRestoreDraft = useCallback(async (draftId: string) => {
        try {
            const response = await fetch(`/api/publish/draft?id=${encodeURIComponent(draftId)}`, {
                method: 'GET',
            });

            const result: ApiResponse = await response.json();

            if (result.success && result.data) {
                const draft = result.data as unknown as {
                    draft: {
                        draftId: string;
                        headline: string;
                        subheadline: string;
                        section: string;
                        contentType: string;
                        body: string;
                        tags: string[];
                        sources: string[];
                        featured: boolean;
                    };
                };

                const draftData = draft.draft;

                setFormData({
                    headline: draftData.headline || '',
                    subheadline: draftData.subheadline || '',
                    section: draftData.section || 'politics',
                    contentType: draftData.contentType || 'news',
                    body: draftData.body || '',
                    tags: (draftData.tags || []).join(', '),
                    sources: (draftData.sources || []).join(', '),
                    featured: draftData.featured || false,
                    draftId: draftData.draftId,
                });

                setShowHistory(false);
                setSubmitResult({ success: true, message: 'Draft restored' });
            } else {
                setSubmitResult({ success: false, error: result.error || 'Failed to load draft' });
            }
        } catch {
            setSubmitResult({ success: false, error: 'Network error occurred while loading draft.' });
        }
    }, []);

    /**
     * PUBLISH NOW
     * - Requires full validation of ALL rules
     * - Requires explicit user action
     * - Writes final content file
     * - Removes draft version
     */
    const handlePublish = useCallback(async (e: FormEvent<HTMLFormElement>) => {
        e.preventDefault();

        // Confirm before publishing (explicit action)
        if (!window.confirm('Are you sure you want to publish this article?\n\nThis action is IRREVERSIBLE.')) {
            return;
        }

        setIsSubmitting(true);
        setSubmitResult(null);
        setFieldErrors({});

        try {
            const payload = {
                ...buildPayload(),
                status: 'published' as const,
            };

            const response = await fetch('/api/publish', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
            });

            const result: ApiResponse = await response.json();

            if (result.success) {
                // Clear form after successful publish
                setFormData(INITIAL_FORM_DATA);
                setShowPreview(false);
                setShowHistory(false);
                setSubmitResult({ success: true, message: 'Article published successfully', data: result.data });
            } else if (result.errors && result.errors.length > 0) {
                setFieldErrors(parseFieldErrors(result.errors));
                setSubmitResult({
                    success: false,
                    error: result.errors[0].message  // Show first specific error
                });
            } else {
                setSubmitResult(result);
            }
        } catch {
            setSubmitResult({ success: false, error: 'Network error occurred while publishing.' });
        } finally {
            setIsSubmitting(false);
        }
    }, [buildPayload, parseFieldErrors]);

    /**
     * Close preview/history panels
     */
    const closePanel = useCallback(() => {
        setShowPreview(false);
        setShowHistory(false);
    }, []);

    /**
     * Format date for display
     */
    const formatDate = (dateString: string): string => {
        const date = new Date(dateString);
        return date.toLocaleString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
            hour: 'numeric',
            minute: '2-digit',
        });
    };

    async function handleLogout() {
        try {
            await fetch('/api/auth/logout', { method: 'POST' });
            window.location.href = '/newsroom';
        } catch (error) {
            console.error('Logout failed', error);
        }
    }

    return (
        <form className={styles.page} onSubmit={handlePublish}>
            {/* TOP BAR */}
            <div className={styles.topBar}>
                {formData.draftId && (
                    <span className={styles.draftIndicator}>
                        Draft: {formData.draftId.slice(0, 12)}...
                    </span>
                )}
                <div className={styles.topBarActions}>
                    <button
                        type="button"
                        className={styles.topBarAction}
                        onClick={handleSaveDraft}
                        disabled={isSavingDraft}
                    >
                        {isSavingDraft ? 'Saving...' : 'Save Draft'}
                    </button>
                    <button
                        type="button"
                        className={styles.topBarAction}
                        onClick={handlePreview}
                        disabled={isLoadingPreview}
                    >
                        {isLoadingPreview ? 'Loading...' : 'Preview'}
                    </button>
                    <button
                        type="button"
                        className={styles.topBarAction}
                        onClick={handleHistory}
                        disabled={isLoadingHistory}
                    >
                        {isLoadingHistory ? 'Loading...' : 'History'}
                    </button>
                    <button
                        type="button"
                        onClick={handleLogout}
                        className={styles.topBarAction}
                        style={{ marginLeft: '12px', color: '#666' }}
                    >
                        Logout
                    </button>
                </div>
            </div>

            {/* TOAST NOTIFICATION - positioned at top of page */}
            {submitResult && (
                <div className={`${styles.toast} ${submitResult.success ? styles.toastSuccess : styles.toastError}`}>
                    <span className={styles.toastMessage}>
                        {submitResult.success
                            ? (submitResult.message || 'Success')
                            : (submitResult.error || 'An error occurred')
                        }
                    </span>
                    {submitResult.data?.url && (
                        <a href={submitResult.data.url} target="_blank" rel="noreferrer" className={styles.toastLink}>
                            View Article →
                        </a>
                    )}
                    <button
                        type="button"
                        className={styles.toastClose}
                        onClick={() => setSubmitResult(null)}
                    >
                        ×
                    </button>
                </div>
            )}

            {/* MAIN LAYOUT */}
            <div className={styles.mainLayout}>
                {/* LEFT COLUMN: WRITING CANVAS */}
                <div className={styles.writingCanvas}>
                    {/* 1. Headline */}
                    <div className={styles.fieldWrapper}>
                        <input
                            type="text"
                            name="headline"
                            className={`${styles.headlineInput} ${fieldErrors.headline ? styles.inputError : ''}`}
                            placeholder="Headline: Enter Article Title"
                            value={formData.headline}
                            onChange={handleInputChange}
                            autoComplete="off"
                        />
                        {fieldErrors.headline && (
                            <span className={styles.fieldError}>{fieldErrors.headline}</span>
                        )}
                        {!fieldErrors.headline && clientHints.headline && (
                            <span className={styles.fieldHint}>{clientHints.headline}</span>
                        )}
                    </div>

                    {/* 2. Subheadline */}
                    <div className={styles.fieldWrapper}>
                        <input
                            type="text"
                            name="subheadline"
                            className={`${styles.subheadlineInput} ${fieldErrors.subheadline ? styles.inputError : ''}`}
                            placeholder="Subheadline: Enter Summary"
                            value={formData.subheadline}
                            onChange={handleInputChange}
                            autoComplete="off"
                        />
                        {fieldErrors.subheadline && (
                            <span className={styles.fieldError}>{fieldErrors.subheadline}</span>
                        )}
                        {!fieldErrors.subheadline && clientHints.subheadline && (
                            <span className={styles.fieldHint}>{clientHints.subheadline}</span>
                        )}
                    </div>

                    {/* 3. Body Editor */}
                    <div className={styles.fieldWrapper}>
                        <textarea
                            name="body"
                            className={`${styles.bodyEditor} ${fieldErrors.body ? styles.inputError : ''}`}
                            placeholder="Start writing article text here..."
                            value={formData.body}
                            onChange={handleInputChange}
                        />
                        {fieldErrors.body && (
                            <span className={styles.fieldError}>{fieldErrors.body}</span>
                        )}
                    </div>
                </div>

                {/* RIGHT COLUMN: PUBLISHING CONTROLS */}
                <div className={styles.controlsPanel}>
                    {/* Preview Panel */}
                    {showPreview && previewData && (
                        <div className={styles.previewPanel}>
                            <div className={styles.panelHeader}>
                                <span className={styles.panelTitle}>Preview</span>
                                <button type="button" className={styles.closeButton} onClick={closePanel}>×</button>
                            </div>
                            <div className={styles.previewContent}>
                                <div className={styles.previewSection}>{previewData.section.toUpperCase()}</div>
                                <h1 className={styles.previewHeadline}>{previewData.headline}</h1>
                                {previewData.subheadline && (
                                    <p className={styles.previewSubheadline}>{previewData.subheadline}</p>
                                )}
                                <div className={styles.previewMeta}>
                                    <span className={styles.previewType}>{previewData.contentType}</span>
                                    {previewData.featured && <span className={styles.previewFeatured}>Featured</span>}
                                </div>
                                <div className={styles.previewBody}>
                                    {previewData.body.split('\n').map((paragraph, i) => (
                                        <p key={i}>{paragraph}</p>
                                    ))}
                                </div>
                                {previewData.tags.length > 0 && (
                                    <div className={styles.previewTags}>
                                        {previewData.tags.map(tag => (
                                            <span key={tag} className={styles.previewTag}>{tag}</span>
                                        ))}
                                    </div>
                                )}
                                {previewData.sources.length > 0 && (
                                    <div className={styles.previewSources}>
                                        <strong>Sources:</strong>
                                        <ul>
                                            {previewData.sources.map((source, i) => (
                                                <li key={i}>{source}</li>
                                            ))}
                                        </ul>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {/* History Panel */}
                    {showHistory && (
                        <div className={styles.historyPanel}>
                            <div className={styles.panelHeader}>
                                <span className={styles.panelTitle}>Draft History</span>
                                <button type="button" className={styles.closeButton} onClick={closePanel}>×</button>
                            </div>
                            <div className={styles.historyContent}>
                                {draftHistory.length === 0 ? (
                                    <p className={styles.emptyHistory}>No saved drafts</p>
                                ) : (
                                    <ul className={styles.historyList}>
                                        {draftHistory.map(draft => (
                                            <li key={draft.draftId} className={styles.historyItem}>
                                                <div className={styles.historyItemContent}>
                                                    <span className={styles.historyHeadline}>
                                                        {draft.headline || 'Untitled'}
                                                    </span>
                                                    <span className={styles.historyMeta}>
                                                        {draft.section} · {formatDate(draft.savedAt)}
                                                    </span>
                                                </div>
                                                <button
                                                    type="button"
                                                    className={styles.restoreButton}
                                                    onClick={() => handleRestoreDraft(draft.draftId)}
                                                >
                                                    Restore
                                                </button>
                                            </li>
                                        ))}
                                    </ul>
                                )}
                            </div>
                        </div>
                    )}

                    {/* Controls - hidden when panels are open */}
                    {!showPreview && !showHistory && (
                        <>
                            {/* 1. Section Selector */}
                            <div className={styles.controlGroup}>
                                <label className={styles.label}>Section</label>
                                <select
                                    name="section"
                                    value={formData.section}
                                    onChange={handleInputChange}
                                    className={`${styles.select} ${fieldErrors.section ? styles.inputError : ''}`}
                                >
                                    {SECTIONS.map(s => (
                                        <option key={s.value} value={s.value}>{s.label}</option>
                                    ))}
                                </select>
                                {fieldErrors.section && (
                                    <span className={styles.fieldError}>{fieldErrors.section}</span>
                                )}
                            </div>

                            {/* 2. Content Type */}
                            <div className={styles.controlGroup}>
                                <label className={styles.label}>Content Type</label>
                                <select
                                    name="contentType"
                                    value={formData.contentType}
                                    onChange={handleInputChange}
                                    className={`${styles.select} ${fieldErrors.contentType ? styles.inputError : ''}`}
                                >
                                    {CONTENT_TYPES.map(t => (
                                        <option key={t.value} value={t.value}>{t.label}</option>
                                    ))}
                                </select>
                                {fieldErrors.contentType && (
                                    <span className={styles.fieldError}>{fieldErrors.contentType}</span>
                                )}
                                {!fieldErrors.contentType && clientHints.contentType && (
                                    <span className={styles.fieldWarning}>⚠ {clientHints.contentType}</span>
                                )}
                            </div>

                            {/* 3. Tags */}
                            <div className={styles.controlGroup}>
                                <label className={styles.label}>Tags <span className={styles.optional}>(optional, max 10)</span></label>
                                <input
                                    type="text"
                                    name="tags"
                                    className={`${styles.input} ${fieldErrors.tags ? styles.inputError : ''}`}
                                    placeholder="Add tags, separated by commas..."
                                    value={formData.tags}
                                    onChange={handleInputChange}
                                />
                                {fieldErrors.tags && (
                                    <span className={styles.fieldError}>{fieldErrors.tags}</span>
                                )}
                            </div>

                            {/* 4. Sources */}
                            <div className={styles.controlGroup}>
                                <label className={styles.label}>Sources <span className={styles.optional}>(optional)</span></label>
                                <input
                                    type="text"
                                    name="sources"
                                    className={`${styles.input} ${fieldErrors.sources ? styles.inputError : ''}`}
                                    placeholder="Add sources, separated by commas..."
                                    value={formData.sources}
                                    onChange={handleInputChange}
                                />
                                {fieldErrors.sources && (
                                    <span className={styles.fieldError}>{fieldErrors.sources}</span>
                                )}
                            </div>

                            {/* 5. Featured Toggle */}
                            <div className={styles.controlGroup}>
                                <label className={styles.toggleLabel}>
                                    <span>Featured Article</span>
                                    <input
                                        type="checkbox"
                                        name="featured"
                                        checked={formData.featured}
                                        onChange={handleInputChange}
                                    />
                                </label>
                                <span className={styles.toggleHint}>Affects homepage selection only</span>
                            </div>


                            {/* 6. Publish Button */}
                            <button
                                type="submit"
                                className={styles.publishButton}
                                disabled={isSubmitting}
                            >
                                {isSubmitting ? 'Publishing...' : 'Publish Now'}
                            </button>
                        </>
                    )}
                </div>
            </div>
        </form>
    );
}
