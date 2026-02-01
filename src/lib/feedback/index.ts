/**
 * Feedback System Index
 * 
 * Central export for the human-friendly error and feedback system.
 * 
 * USAGE:
 * ```typescript
 * import { 
 *   ErrorCodes, 
 *   SuccessCodes,
 *   createErrorFeedback,
 *   createSuccessFeedback,
 *   transformApiErrors,
 *   logger,
 * } from '@/lib/feedback';
 * ```
 */

// Error and success codes
export {
    ErrorCodes,
    SuccessCodes,
} from './error-codes';

export type {
    ErrorCode,
    SuccessCode,
    ErrorCategory,
    ErrorDisplayStyle,
    ErrorSeverity,
} from './error-codes';

// Translation layer
export {
    getErrorMessage,
    getSuccessMessage,
    getFullErrorText,
    errorTranslations,
    successTranslations,
} from './translations';

// Core feedback system
export {
    createErrorFeedback,
    createSuccessFeedback,
    transformApiErrors,
    transformApiError,
    detectErrorCode,
    getFirstError,
    createToastFromError,
    createToastFromSuccess,
} from './feedback-system';

export type {
    InternalError,
    UserFeedback,
    FieldError,
} from './feedback-system';

// Console guard and logging
export {
    logger,
    isProduction,
    isDevelopment,
    createInternalError,
    safeStringify,
    extractSafeErrorInfo,
    enforceProductionConsole,
} from './console-guard';
