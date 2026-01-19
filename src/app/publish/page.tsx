'use client';

/**
 * Publishing Console Page
 * Internal tool for publishing articles to the news website.
 * Design: Private, Text-First, Distraction-Free.
 */

import { useState, FormEvent, ChangeEvent, useEffect } from 'react';
import styles from './publish.module.css';

/** Valid sections */
const SECTIONS = [
    { value: 'politics', label: 'Politics' },
    { value: 'crime', label: 'Crime' },
    { value: 'court', label: 'Court' },
    { value: 'opinion', label: 'Opinion' },
    { value: 'world-affairs', label: 'World Affairs' },
] as const;

/** Valid content types */
const CONTENT_TYPES = [
    { value: 'news', label: 'News' },
    { value: 'analysis', label: 'Analysis' },
    { value: 'opinion', label: 'Opinion' },
] as const;

interface ApiResponse {
    success: boolean;
    message?: string;
    error?: string;
    errors?: { field: string; message: string }[];
    data?: {
        slug: string;
        section: string;
        url: string;
    };
}

interface FormData {
    title: string;
    subtitle: string;
    section: string;
    contentType: string;
    body: string;
    tags: string;
    featured: boolean;
    status: 'draft' | 'published';
    sources: string;
}

const INITIAL_FORM_DATA: FormData = {
    title: '',
    subtitle: '',
    section: 'politics',
    contentType: 'news',
    body: '',
    tags: '',
    featured: false,
    status: 'draft',
    sources: '',
};

export default function PublishPage() {
    const [formData, setFormData] = useState<FormData>(INITIAL_FORM_DATA);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [submitResult, setSubmitResult] = useState<ApiResponse | null>(null);

    // Auto-save draft timer (mock)
    useEffect(() => {
        const timer = setInterval(() => {
            // In a real app, save to local storage or API
            // console.log('Auto-saving draft...');
        }, 30000);
        return () => clearInterval(timer);
    }, [formData]);

    function handleInputChange(
        e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
    ) {
        const { name, value, type } = e.target;

        if (type === 'checkbox') {
            const checked = (e.target as HTMLInputElement).checked;
            setFormData(prev => ({ ...prev, [name]: checked }));
        } else {
            setFormData(prev => ({ ...prev, [name]: value }));
        }
    }

    async function handleSubmit(e: FormEvent<HTMLFormElement>) {
        e.preventDefault();
        setIsSubmitting(true);
        setSubmitResult(null);

        // Normalize tags and sources
        const tagsArray = formData.tags.split(',').map(t => t.trim()).filter(Boolean);
        const sourcesArray = formData.sources.split(',').map(s => s.trim()).filter(Boolean);

        const payload = {
            ...formData,
            tags: tagsArray,
            sources: sourcesArray,
        };

        try {
            const response = await fetch('/api/publish', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
            });
            const result: ApiResponse = await response.json();
            setSubmitResult(result);

            if (result.success) {
                // Optional: redirect or show success
                // Resetting might be annoying if they want to edit, but for now we reset on success or just show message
                // setFormData(INITIAL_FORM_DATA); 
            }
        } catch (error) {
            setSubmitResult({ success: false, error: 'Network error occurred.' });
        } finally {
            setIsSubmitting(false);
        }
    }

    return (
        <form className={styles.page} onSubmit={handleSubmit}>
            {/* TOP BAR */}
            <div className={styles.topBar}>
                <button type="button" className={styles.topBarAction}>Save Draft</button>
                <button type="button" className={styles.topBarAction}>Preview</button>
                <button type="button" className={styles.topBarAction}>History</button>
            </div>

            {/* MAIN LAYOUT */}
            <div className={styles.mainLayout}>
                {/* LEFT COLUMN: WRITING CANVAS */}
                <div className={styles.writingCanvas}>
                    {/* 1. Headline */}
                    <input
                        type="text"
                        name="title"
                        className={styles.headlineInput}
                        placeholder="Headline: Enter Article Title"
                        value={formData.title}
                        onChange={handleInputChange}
                        required
                        autoComplete="off"
                    />

                    {/* 2. Subheadline */}
                    <input
                        type="text"
                        name="subtitle"
                        className={styles.subheadlineInput}
                        placeholder="Subheadline: Enter Summary"
                        value={formData.subtitle}
                        onChange={handleInputChange}
                        required
                        autoComplete="off"
                    />

                    {/* 3. Body Editor */}
                    <textarea
                        name="body"
                        className={styles.bodyEditor}
                        placeholder="Start writing article text here..."
                        value={formData.body}
                        onChange={handleInputChange}
                        required
                    />

                    {/* 4. Inline Quote Style Reference */}
                    <div className={styles.quoteStyle}>
                        “Use this style for inline editorial quotes. Simple, indented, italicized.”
                    </div>
                </div>

                {/* RIGHT COLUMN: PUBLISHING CONTROLS */}
                <div className={styles.controlsPanel}>

                    {/* 1. Section Selector */}
                    <div className={styles.controlGroup}>
                        <label className={styles.label}>Section</label>
                        <select
                            name="section"
                            value={formData.section}
                            onChange={handleInputChange}
                            className={styles.select}
                        >
                            {SECTIONS.map(s => (
                                <option key={s.value} value={s.value}>{s.label}</option>
                            ))}
                        </select>
                    </div>

                    {/* 2. Content Type */}
                    <div className={styles.controlGroup}>
                        <label className={styles.label}>Content Type</label>
                        <select
                            name="contentType"
                            value={formData.contentType}
                            onChange={handleInputChange}
                            className={styles.select}
                        >
                            {CONTENT_TYPES.map(t => (
                                <option key={t.value} value={t.value}>{t.label}</option>
                            ))}
                        </select>
                        {formData.contentType === 'opinion' && formData.section !== 'opinion' && (
                            <span className={styles.fieldWarning}>
                                ⚠ Opinion articles must be in Opinion section
                            </span>
                        )}
                    </div>

                    {/* 3. Tags */}
                    <div className={styles.controlGroup}>
                        <label className={styles.label}>Tags</label>
                        <input
                            type="text"
                            name="tags"
                            className={styles.input}
                            placeholder="Add tags..."
                            value={formData.tags}
                            onChange={handleInputChange}
                        />
                    </div>

                    {/* Extra: Sources (Hidden requirement but good for integrity) */}
                    <div className={styles.controlGroup}>
                        <label className={styles.label}>Sources</label>
                        <input
                            type="text"
                            name="sources"
                            className={styles.input}
                            placeholder="Add sources..."
                            value={formData.sources}
                            onChange={handleInputChange}
                        />
                    </div>

                    {/* 4. Featured Toggle */}
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
                    </div>

                    {/* 5. Status */}
                    <div className={styles.controlGroup}>
                        <label className={styles.label}>Status</label>
                        <select
                            name="status"
                            value={formData.status}
                            onChange={handleInputChange}
                            className={styles.select}
                        >
                            <option value="draft">Draft</option>
                            <option value="published">Published</option>
                        </select>
                    </div>

                    {/* Status Message */}
                    {submitResult && (
                        <div className={`${styles.statusMessage} ${submitResult.success ? styles.success : styles.error}`}>
                            {submitResult.success ? 'Article Saved.' : submitResult.error}
                            {submitResult.data?.url && (
                                <div style={{ marginTop: '4px' }}>
                                    <a href={submitResult.data.url} target="_blank" rel="noreferrer" style={{ textDecoration: 'underline' }}>View Article</a>
                                </div>
                            )}
                        </div>
                    )}

                    {/* 6. Publish Button */}
                    <button
                        type="submit"
                        className={styles.publishButton}
                        disabled={isSubmitting}
                    >
                        {isSubmitting ? 'Processing...' : (formData.status === 'published' ? 'Publish Now' : 'Save Draft')}
                    </button>

                </div>
            </div>
        </form>
    );
}
