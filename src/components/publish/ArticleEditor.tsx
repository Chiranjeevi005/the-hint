'use client';

/**
 * Article Editor Component
 * Two-column layout: Writing surface (70%) + Metadata sidebar (30%)
 * 
 * Writing Surface:
 * - Headline (required)
 * - Subheadline (required)
 * - Body editor (long-form)
 * 
 * Sidebar:
 * - Section (required)
 * - Content Type (News | Opinion)
 * - Tags (optional, max 10)
 * - Sources (optional)
 * - Homepage Placement
 * - Status indicator
 */

import { ChangeEvent, useCallback } from 'react';
import {
    ArticleFormData,
    FieldErrors,
    PreviewData,
    SECTIONS,
    CONTENT_TYPES,
} from './types';
import styles from './ArticleEditor.module.css';

interface ArticleEditorProps {
    /** Form data */
    formData: ArticleFormData;
    /** Handler for form changes */
    onFormChange: (data: ArticleFormData) => void;
    /** Field errors from validation */
    fieldErrors: FieldErrors;
    /** Client-side hints */
    clientHints: Record<string, string>;
    /** Preview data if showing preview */
    previewData: PreviewData | null;
    /** Show preview panel */
    showPreview: boolean;
    /** Close preview panel */
    onClosePreview: () => void;
}

export function ArticleEditor({
    formData,
    onFormChange,
    fieldErrors,
    clientHints,
    previewData,
    showPreview,
    onClosePreview,
}: ArticleEditorProps) {
    /**
     * Handle input changes
     */
    const handleInputChange = useCallback(
        (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
            const { name, value } = e.target;
            onFormChange({ ...formData, [name]: value });
        },
        [formData, onFormChange]
    );

    /**
     * Handle placement toggle
     */
    const handlePlacementChange = useCallback(
        (placement: 'lead' | 'top' | 'standard') => {
            const newPlacement = formData.placement === placement ? 'standard' : placement;
            onFormChange({ ...formData, placement: newPlacement });
        },
        [formData, onFormChange]
    );

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

    return (
        <div className={styles.editorLayout}>
            {/* LEFT COLUMN: WRITING CANVAS */}
            <div className={styles.writingCanvas}>
                {/* Headline */}
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

                {/* Subheadline */}
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

                {/* Body Editor */}
                <div className={styles.fieldWrapper}>
                    <textarea
                        name="body"
                        className={`${styles.bodyEditor} ${fieldErrors.body ? styles.inputError : ''}`}
                        placeholder="Start writing article text here...

Supports:
• Paragraphs (separate with blank lines)
• Inline quotes (use quotation marks)
• Rich formatting through markdown"
                        value={formData.body}
                        onChange={handleInputChange}
                    />
                    {fieldErrors.body && (
                        <span className={styles.fieldError}>{fieldErrors.body}</span>
                    )}
                </div>
            </div>

            {/* RIGHT COLUMN: METADATA SIDEBAR */}
            <div className={styles.sidebar}>
                {/* Preview Panel */}
                {showPreview && previewData && (
                    <div className={styles.previewPanel}>
                        <div className={styles.panelHeader}>
                            <span className={styles.panelTitle}>Preview</span>
                            <button type="button" className={styles.closeButton} onClick={onClosePreview}>×</button>
                        </div>
                        <div className={styles.previewContent}>
                            <div className={styles.previewSection}>{previewData.section.toUpperCase()}</div>
                            <h1 className={styles.previewHeadline}>{previewData.headline}</h1>
                            {previewData.subheadline && (
                                <p className={styles.previewSubheadline}>{previewData.subheadline}</p>
                            )}
                            <div className={styles.previewMeta}>
                                <span className={styles.previewType}>{previewData.contentType}</span>
                                {previewData.placement === 'lead' && <span className={styles.previewFeatured}>Lead Story</span>}
                                {previewData.placement === 'top' && <span className={styles.previewFeatured}>Top Story</span>}
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

                {/* Controls - hidden when preview is open */}
                {!showPreview && (
                    <>
                        {/* Section */}
                        <div className={styles.controlGroup}>
                            <label className={styles.label}>Section <span className={styles.required}>*</span></label>
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

                        {/* Content Type */}
                        <div className={styles.controlGroup}>
                            <label className={styles.label}>Content Type <span className={styles.required}>*</span></label>
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

                        {/* Tags */}
                        <div className={styles.controlGroup}>
                            <label className={styles.label}>
                                Tags <span className={styles.optional}>(optional, max 10)</span>
                            </label>
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

                        {/* Sources */}
                        <div className={styles.controlGroup}>
                            <label className={styles.label}>
                                Sources <span className={styles.optional}>(optional)</span>
                            </label>
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

                        {/* Homepage Placement */}
                        <div className={styles.controlGroup}>
                            <label className={styles.label}>Homepage Placement</label>
                            <div className={styles.placementGrid}>
                                <button
                                    type="button"
                                    onClick={() => handlePlacementChange('lead')}
                                    className={`${styles.placementOption} ${formData.placement === 'lead' ? styles.placementActive : ''}`}
                                >
                                    <div className={styles.placementTitle}>Lead Story</div>
                                    <div className={styles.placementDesc}>Main hero story</div>
                                </button>
                                <button
                                    type="button"
                                    onClick={() => handlePlacementChange('top')}
                                    className={`${styles.placementOption} ${formData.placement === 'top' ? styles.placementActive : ''}`}
                                >
                                    <div className={styles.placementTitle}>Top Story</div>
                                    <div className={styles.placementDesc}>Secondary lead</div>
                                </button>
                            </div>
                            <div className={styles.placementHint}>
                                ℹ {formData.placement === 'standard'
                                    ? 'Article will appear in its section normally.'
                                    : `Selected: ${formData.placement === 'lead' ? 'Lead Story' : 'Top Story'}. Click to deselect.`}
                            </div>
                        </div>

                        {/* Status Indicator */}
                        <div className={styles.statusSection}>
                            <div className={styles.statusLabel}>
                                Status: <span className={formData.status === 'published' ? styles.statusPublished : styles.statusDraft}>
                                    {formData.status === 'published' ? 'Published' : 'Draft'}
                                </span>
                            </div>
                            {formData.publishedAt && (
                                <div className={styles.statusDate}>
                                    Published: {formatDate(formData.publishedAt)}
                                </div>
                            )}
                            {formData.lastEdited && (
                                <div className={styles.statusDate}>
                                    Last edited: {formatDate(formData.lastEdited)}
                                </div>
                            )}
                        </div>
                    </>
                )}
            </div>
        </div>
    );
}
