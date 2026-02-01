/**
 * useFeedback Hook
 * 
 * React hook for managing toast notifications and error states
 * using the editorial feedback system.
 * 
 * USAGE:
 * ```tsx
 * const { toast, showError, showSuccess, dismiss, fieldErrors, setFieldError, clearFieldErrors } = useFeedback();
 * 
 * // Show a toast from error code
 * showError(ErrorCodes.NETWORK_TIMEOUT);
 * 
 * // Show a success toast
 * showSuccess(SuccessCodes.DRAFT_SAVED);
 * 
 * // Set a field error
 * setFieldError('headline', ErrorCodes.VALIDATION_MISSING_HEADLINE);
 * ```
 */

'use client';

import { useState, useCallback } from 'react';
import {
    ErrorCodes,
    SuccessCodes,
    createToastFromError,
    createToastFromSuccess,
    getErrorMessage,
    transformApiErrors,
    getFirstError,
    type ErrorCode,
    type SuccessCode,
    type FieldError,
} from '@/lib/feedback';
import type { ToastData } from '@/components/feedback';

/**
 * Field errors map
 */
export type FieldErrorsMap = Record<string, { message: string; code?: ErrorCode }>;

/**
 * Feedback hook return type
 */
export interface UseFeedbackReturn {
    /** Current toast to display (null if none) */
    toast: ToastData | null;
    /** Show an error toast */
    showError: (code: ErrorCode, fallbackMessage?: string) => void;
    /** Show a success toast */
    showSuccess: (code: SuccessCode, data?: { url?: string; label?: string }) => void;
    /** Show a custom toast */
    showToast: (toast: Omit<ToastData, 'id'>) => void;
    /** Dismiss the current toast */
    dismiss: () => void;
    /** Field-level errors */
    fieldErrors: FieldErrorsMap;
    /** Set a field error */
    setFieldError: (field: string, code: ErrorCode) => void;
    /** Set multiple field errors from API response */
    setFieldErrorsFromApi: (errors: Array<{ field: string; message: string }>) => void;
    /** Clear a specific field error */
    clearFieldError: (field: string) => void;
    /** Clear all field errors */
    clearFieldErrors: () => void;
    /** Check if a field has an error */
    hasError: (field: string) => boolean;
    /** Get error message for a field */
    getFieldError: (field: string) => string | undefined;
}

/**
 * Generate a unique ID
 */
function generateId(): string {
    return `fb-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`;
}

/**
 * useFeedback Hook
 */
export function useFeedback(): UseFeedbackReturn {
    const [toast, setToast] = useState<ToastData | null>(null);
    const [fieldErrors, setFieldErrors] = useState<FieldErrorsMap>({});

    /**
     * Show an error toast
     */
    const showError = useCallback((code: ErrorCode, fallbackMessage?: string) => {
        const { message, type, id } = createToastFromError(code, fallbackMessage);
        const translation = getErrorMessage(code);

        setToast({
            id,
            type: type as ToastData['type'],
            message,
            guidance: translation.guidance,
            timeout: 6000, // Slightly longer for errors
        });
    }, []);

    /**
     * Show a success toast
     */
    const showSuccess = useCallback((code: SuccessCode, data?: { url?: string; label?: string }) => {
        const { message, id, link } = createToastFromSuccess(code, data);

        setToast({
            id,
            type: 'success',
            message,
            link,
            timeout: 4000, // Shorter for success
        });
    }, []);

    /**
     * Show a custom toast
     */
    const showToast = useCallback((toastData: Omit<ToastData, 'id'>) => {
        setToast({
            ...toastData,
            id: generateId(),
        });
    }, []);

    /**
     * Dismiss toast
     */
    const dismiss = useCallback(() => {
        setToast(null);
    }, []);

    /**
     * Set a field error
     */
    const setFieldError = useCallback((field: string, code: ErrorCode) => {
        const translation = getErrorMessage(code);
        setFieldErrors(prev => ({
            ...prev,
            [field]: {
                message: translation.message,
                code,
            },
        }));
    }, []);

    /**
     * Set field errors from API response
     */
    const setFieldErrorsFromApi = useCallback((errors: Array<{ field: string; message: string }>) => {
        const transformed = transformApiErrors(errors);
        const newErrors: FieldErrorsMap = {};

        for (const error of transformed) {
            newErrors[error.field] = {
                message: error.message,
                code: error.code,
            };
        }

        setFieldErrors(newErrors);

        // Also show the first error as a toast for visibility
        const firstError = getFirstError(transformed);
        if (firstError && firstError.code) {
            const translation = getErrorMessage(firstError.code);
            // Only show as toast if it's not an inline display style
            if (translation.displayStyle === 'toast') {
                showError(firstError.code);
            }
        }
    }, [showError]);

    /**
     * Clear a specific field error
     */
    const clearFieldError = useCallback((field: string) => {
        setFieldErrors(prev => {
            const next = { ...prev };
            delete next[field];
            return next;
        });
    }, []);

    /**
     * Clear all field errors
     */
    const clearFieldErrors = useCallback(() => {
        setFieldErrors({});
    }, []);

    /**
     * Check if a field has an error
     */
    const hasError = useCallback((field: string): boolean => {
        return field in fieldErrors;
    }, [fieldErrors]);

    /**
     * Get error message for a field
     */
    const getFieldError = useCallback((field: string): string | undefined => {
        return fieldErrors[field]?.message;
    }, [fieldErrors]);

    return {
        toast,
        showError,
        showSuccess,
        showToast,
        dismiss,
        fieldErrors,
        setFieldError,
        setFieldErrorsFromApi,
        clearFieldError,
        clearFieldErrors,
        hasError,
        getFieldError,
    };
}
