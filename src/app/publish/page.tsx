'use client';

/**
 * Publishing Console Page
 * Internal tool for publishing articles to the news website.
 * Not exposed in navigation - accessed directly via /publish
 */

import { useState, FormEvent, ChangeEvent } from 'react';
import styles from './publish.module.css';

/** Valid sections (must match backend validation) */
const SECTIONS = [
    { value: 'politics', label: 'Politics' },
    { value: 'crime', label: 'Crime' },
    { value: 'court', label: 'Court' },
    { value: 'opinion', label: 'Opinion' },
    { value: 'world-affairs', label: 'World Affairs' },
] as const;

/** Valid content types (must match backend validation) */
const CONTENT_TYPES = [
    { value: 'news', label: 'News' },
    { value: 'analysis', label: 'Analysis' },
    { value: 'opinion', label: 'Opinion' },
] as const;

/** API error response structure */
interface FieldError {
    field: string;
    message: string;
}

interface ApiResponse {
    success: boolean;
    message?: string;
    error?: string;
    errors?: FieldError[];
    data?: {
        slug: string;
        section: string;
        url: string;
    };
}

/** Form state interface */
interface FormData {
    title: string;
    subtitle: string;
    section: string;
    contentType: string;
    body: string;
    tags: string;
    featured: boolean;
    sources: string;
}

/** Initial form state */
const INITIAL_FORM_DATA: FormData = {
    title: '',
    subtitle: '',
    section: 'politics',
    contentType: 'news',
    body: '',
    tags: '',
    featured: false,
    sources: '',
};

export default function PublishPage() {
    const [formData, setFormData] = useState<FormData>(INITIAL_FORM_DATA);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [submitResult, setSubmitResult] = useState<ApiResponse | null>(null);
    const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

    /**
     * Parse comma-separated string into array
     */
    function parseCommaSeparated(value: string): string[] {
        return value
            .split(',')
            .map(item => item.trim())
            .filter(item => item.length > 0);
    }

    /**
     * Get error message for a specific field
     */
    function getFieldError(fieldName: string): string | undefined {
        return fieldErrors[fieldName];
    }

    /**
     * Handle input changes
     */
    function handleInputChange(
        e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
    ): void {
        const { name, value, type } = e.target;

        // Clear field error when user starts typing
        if (fieldErrors[name]) {
            setFieldErrors(prev => {
                const updated = { ...prev };
                delete updated[name];
                return updated;
            });
        }

        if (type === 'checkbox') {
            const checked = (e.target as HTMLInputElement).checked;
            setFormData(prev => ({ ...prev, [name]: checked }));
        } else {
            setFormData(prev => ({ ...prev, [name]: value }));
        }
    }

    /**
     * Handle form submission
     */
    async function handleSubmit(e: FormEvent<HTMLFormElement>): Promise<void> {
        e.preventDefault();
        setIsSubmitting(true);
        setSubmitResult(null);
        setFieldErrors({});

        // Prepare payload
        const payload = {
            title: formData.title,
            subtitle: formData.subtitle,
            section: formData.section,
            contentType: formData.contentType,
            body: formData.body,
            tags: parseCommaSeparated(formData.tags),
            featured: formData.featured,
            sources: parseCommaSeparated(formData.sources),
        };

        try {
            const response = await fetch('/api/publish', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(payload),
            });

            const result: ApiResponse = await response.json();

            // Extract field-specific errors
            if (result.errors && result.errors.length > 0) {
                const errors: Record<string, string> = {};
                for (const err of result.errors) {
                    errors[err.field] = err.message;
                }
                setFieldErrors(errors);
            }

            setSubmitResult(result);

            // Reset form on success
            if (result.success) {
                setFormData(INITIAL_FORM_DATA);
            }
        } catch (error) {
            setSubmitResult({
                success: false,
                error: 'Network error. Please check your connection and try again.',
            });
        } finally {
            setIsSubmitting(false);
        }
    }

    /**
     * Reset form and clear all states
     */
    function handleReset(): void {
        setFormData(INITIAL_FORM_DATA);
        setSubmitResult(null);
        setFieldErrors({});
    }

    return (
        <main className={styles.container}>
            <header className={styles.header}>
                <h1 className={styles.title}>Publishing Console</h1>
                <p className={styles.subtitle}>Create and publish articles to The Hint</p>
            </header>

            {/* Success Banner */}
            {submitResult?.success && (
                <div className={styles.successBanner}>
                    <div className={styles.successContent}>
                        <span className={styles.successIcon}>✓</span>
                        <div>
                            <strong>Article published successfully!</strong>
                            <p>
                                View at:{' '}
                                <a
                                    href={submitResult.data?.url}
                                    className={styles.articleLink}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                >
                                    {submitResult.data?.url}
                                </a>
                            </p>
                        </div>
                    </div>
                </div>
            )}

            {/* Error Banner */}
            {submitResult && !submitResult.success && (
                <div className={styles.errorBanner}>
                    <span className={styles.errorIcon}>✕</span>
                    <strong>{submitResult.error || 'An error occurred'}</strong>
                </div>
            )}

            <form onSubmit={handleSubmit} className={styles.form}>
                {/* Title */}
                <div className={styles.formGroup}>
                    <label htmlFor="title" className={styles.label}>
                        Title <span className={styles.required}>*</span>
                    </label>
                    <input
                        type="text"
                        id="title"
                        name="title"
                        value={formData.title}
                        onChange={handleInputChange}
                        className={`${styles.input} ${getFieldError('title') ? styles.inputError : ''}`}
                        placeholder="Enter article headline"
                        maxLength={200}
                        required
                    />
                    {getFieldError('title') && (
                        <span className={styles.fieldError}>{getFieldError('title')}</span>
                    )}
                </div>

                {/* Subtitle */}
                <div className={styles.formGroup}>
                    <label htmlFor="subtitle" className={styles.label}>
                        Subtitle <span className={styles.required}>*</span>
                    </label>
                    <input
                        type="text"
                        id="subtitle"
                        name="subtitle"
                        value={formData.subtitle}
                        onChange={handleInputChange}
                        className={`${styles.input} ${getFieldError('subtitle') ? styles.inputError : ''}`}
                        placeholder="Enter article deck/subheadline"
                        maxLength={500}
                        required
                    />
                    {getFieldError('subtitle') && (
                        <span className={styles.fieldError}>{getFieldError('subtitle')}</span>
                    )}
                </div>

                {/* Section and Content Type Row */}
                <div className={styles.formRow}>
                    <div className={styles.formGroup}>
                        <label htmlFor="section" className={styles.label}>
                            Section <span className={styles.required}>*</span>
                        </label>
                        <select
                            id="section"
                            name="section"
                            value={formData.section}
                            onChange={handleInputChange}
                            className={`${styles.select} ${getFieldError('section') ? styles.inputError : ''}`}
                            required
                        >
                            {SECTIONS.map(section => (
                                <option key={section.value} value={section.value}>
                                    {section.label}
                                </option>
                            ))}
                        </select>
                        {getFieldError('section') && (
                            <span className={styles.fieldError}>{getFieldError('section')}</span>
                        )}
                    </div>

                    <div className={styles.formGroup}>
                        <label htmlFor="contentType" className={styles.label}>
                            Content Type <span className={styles.required}>*</span>
                        </label>
                        <select
                            id="contentType"
                            name="contentType"
                            value={formData.contentType}
                            onChange={handleInputChange}
                            className={`${styles.select} ${getFieldError('contentType') ? styles.inputError : ''}`}
                            required
                        >
                            {CONTENT_TYPES.map(type => (
                                <option key={type.value} value={type.value}>
                                    {type.label}
                                </option>
                            ))}
                        </select>
                        {getFieldError('contentType') && (
                            <span className={styles.fieldError}>{getFieldError('contentType')}</span>
                        )}
                        {formData.contentType === 'opinion' && formData.section !== 'opinion' && (
                            <span className={styles.fieldWarning}>
                                ⚠ Opinion articles must be in the Opinion section
                            </span>
                        )}
                    </div>
                </div>

                {/* Body */}
                <div className={styles.formGroup}>
                    <label htmlFor="body" className={styles.label}>
                        Body (Markdown) <span className={styles.required}>*</span>
                    </label>
                    <textarea
                        id="body"
                        name="body"
                        value={formData.body}
                        onChange={handleInputChange}
                        className={`${styles.textarea} ${getFieldError('body') ? styles.inputError : ''}`}
                        placeholder="Write your article content in Markdown format..."
                        rows={16}
                        required
                    />
                    {getFieldError('body') && (
                        <span className={styles.fieldError}>{getFieldError('body')}</span>
                    )}
                </div>

                {/* Tags */}
                <div className={styles.formGroup}>
                    <label htmlFor="tags" className={styles.label}>
                        Tags
                    </label>
                    <input
                        type="text"
                        id="tags"
                        name="tags"
                        value={formData.tags}
                        onChange={handleInputChange}
                        className={`${styles.input} ${getFieldError('tags') ? styles.inputError : ''}`}
                        placeholder="tag1, tag2, tag3 (comma-separated)"
                    />
                    {getFieldError('tags') && (
                        <span className={styles.fieldError}>{getFieldError('tags')}</span>
                    )}
                    <span className={styles.fieldHint}>Separate multiple tags with commas</span>
                </div>

                {/* Sources */}
                <div className={styles.formGroup}>
                    <label htmlFor="sources" className={styles.label}>
                        Sources
                    </label>
                    <input
                        type="text"
                        id="sources"
                        name="sources"
                        value={formData.sources}
                        onChange={handleInputChange}
                        className={`${styles.input} ${getFieldError('sources') ? styles.inputError : ''}`}
                        placeholder="Source 1, Source 2 (comma-separated)"
                    />
                    {getFieldError('sources') && (
                        <span className={styles.fieldError}>{getFieldError('sources')}</span>
                    )}
                    <span className={styles.fieldHint}>Separate multiple sources with commas</span>
                </div>

                {/* Featured Checkbox */}
                <div className={styles.formGroupCheckbox}>
                    <label className={styles.checkboxLabel}>
                        <input
                            type="checkbox"
                            id="featured"
                            name="featured"
                            checked={formData.featured}
                            onChange={handleInputChange}
                            className={styles.checkbox}
                        />
                        <span className={styles.checkboxText}>
                            Featured article
                        </span>
                    </label>
                    <span className={styles.fieldHint}>
                        Featured articles appear prominently on the homepage
                    </span>
                </div>

                {/* Form Actions */}
                <div className={styles.formActions}>
                    <button
                        type="button"
                        onClick={handleReset}
                        className={styles.resetButton}
                        disabled={isSubmitting}
                    >
                        Reset
                    </button>
                    <button
                        type="submit"
                        className={styles.submitButton}
                        disabled={isSubmitting}
                    >
                        {isSubmitting ? 'Publishing...' : 'Publish Article'}
                    </button>
                </div>
            </form>
        </main>
    );
}
