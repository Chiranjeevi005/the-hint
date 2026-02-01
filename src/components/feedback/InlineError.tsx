/**
 * Inline Field Error Component
 * 
 * Displays contextual error messages below form fields.
 * Part of the editorial feedback system.
 */

'use client';

import styles from './InlineError.module.css';

export interface InlineErrorProps {
    /** Error message to display */
    message: string;
    /** Optional guidance text */
    guidance?: string;
    /** Field ID for accessibility */
    fieldId?: string;
}

/**
 * Inline Error Component
 * Shows errors directly below the related field
 */
export function InlineError({ message, guidance, fieldId }: InlineErrorProps) {
    return (
        <div
            className={styles.error}
            role="alert"
            aria-live="polite"
            id={fieldId ? `${fieldId}-error` : undefined}
        >
            <span className={styles.message}>{message}</span>
            {guidance && (
                <span className={styles.guidance}>{guidance}</span>
            )}
        </div>
    );
}

/**
 * Inline Warning Component
 * Shows non-blocking warnings below fields
 */
export function InlineWarning({ message, guidance, fieldId }: InlineErrorProps) {
    return (
        <div
            className={`${styles.error} ${styles.warning}`}
            role="status"
            aria-live="polite"
            id={fieldId ? `${fieldId}-warning` : undefined}
        >
            <span className={styles.message}>{message}</span>
            {guidance && (
                <span className={styles.guidance}>{guidance}</span>
            )}
        </div>
    );
}

/**
 * Inline Success/Hint Component
 * Shows positive feedback or hints below fields
 */
export function InlineHint({ message }: { message: string }) {
    return (
        <div className={styles.hint}>
            <span className={styles.message}>{message}</span>
        </div>
    );
}
