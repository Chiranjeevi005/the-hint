# Human-Friendly Feedback System

A comprehensive error and feedback translation system for The Hint editorial platform, designed to transform technical failures into clear, calm, editorial-style messages.

## Core Principles

1. **Two-Layer Error Model**: Technical details stay internal; users see only editorial-style messages
2. **Central Translation Map**: All error codes map to human-friendly messages in one place  
3. **Contextual Error Placement**: Errors appear where the user is working (inline, toast, modal)
4. **Progressive Disclosure**: Show only the most blocking issue first
5. **Production Console Hygiene**: No raw errors leak to production console
6. **Cross-Device Consistency**: Same messaging logic on mobile and desktop

## Architecture

```
src/lib/feedback/
├── error-codes.ts      # Internal error/success code definitions
├── translations.ts     # Code → Editorial message mapping
├── feedback-system.ts  # Core API for creating feedback
├── console-guard.ts    # Production console protection
└── index.ts           # Public API exports

src/components/feedback/
├── EditorialToast.tsx        # Toast notification component
├── EditorialToast.module.css # Toast styles
├── InlineError.tsx           # Inline field errors
├── InlineError.module.css    # Inline error styles
└── index.ts                  # Component exports

src/hooks/
└── useFeedback.ts      # React hook for feedback management
```

## Usage

### Basic Error Handling

```tsx
import { ErrorCodes, getErrorMessage, logger } from '@/lib/feedback';

try {
    await saveArticle(data);
} catch (error) {
    // Log technical details (dev only)
    logger.error('Save failed', error);
    
    // Show user-friendly message
    const message = getErrorMessage(ErrorCodes.CONTENT_SAVE_FAILED);
    showToast('error', message.message, { guidance: message.guidance });
}
```

### Using the useFeedback Hook

```tsx
import { useFeedback } from '@/hooks/useFeedback';
import { EditorialToast } from '@/components/feedback';
import { ErrorCodes, SuccessCodes } from '@/lib/feedback';

function MyComponent() {
    const { 
        toast, 
        dismiss, 
        showError, 
        showSuccess,
        fieldErrors,
        setFieldError,
        clearFieldError 
    } = useFeedback();
    
    const handleSave = async () => {
        try {
            await save();
            showSuccess(SuccessCodes.DRAFT_SAVED);
        } catch {
            showError(ErrorCodes.NETWORK_REQUEST_FAILED);
        }
    };
    
    return (
        <>
            <EditorialToast toast={toast} onDismiss={dismiss} />
            <form>
                <input name="headline" />
                {fieldErrors.headline && (
                    <InlineError message={fieldErrors.headline.message} />
                )}
            </form>
        </>
    );
}
```

### Transforming API Errors

```tsx
import { transformApiErrors, getFirstError } from '@/lib/feedback';

// API returns: [{ field: 'headline', message: 'required' }]
const transformed = transformApiErrors(response.errors);
// Returns: [{ field: 'headline', message: 'This article needs a headline...', code: 'VALIDATION_MISSING_HEADLINE' }]

const firstError = getFirstError(transformed);
// Show only the first, most important error
```

## Error Code Categories

| Category | Purpose | Example Codes |
|----------|---------|---------------|
| `validation` | User input issues | `VALIDATION_MISSING_HEADLINE`, `VALIDATION_BODY_EMPTY` |
| `content` | Article/draft operations | `CONTENT_SAVE_FAILED`, `CONTENT_NOT_FOUND` |
| `media` | Image/video uploads | `MEDIA_FILE_TOO_LARGE`, `MEDIA_INVALID_TYPE` |
| `network` | Connection problems | `NETWORK_OFFLINE`, `NETWORK_TIMEOUT` |
| `server` | Backend failures | `SERVER_INTERNAL_ERROR`, `SERVER_UNAVAILABLE` |
| `authentication` | Access issues | `AUTH_REQUIRED`, `AUTH_SESSION_EXPIRED` |

## Success Codes

| Code | Message Example |
|------|-----------------|
| `DRAFT_SAVED` | "Your changes have been saved." |
| `ARTICLE_PUBLISHED` | "Article is now live." |
| `MEDIA_UPLOADED` | "Image added to your article." |
| `SUBSCRIPTION_SUCCESS` | "You're subscribed. Welcome aboard." |

## Display Styles

- **`inline`**: Shows directly below the affected field
- **`toast`**: Non-blocking notification at top of screen
- **`modal`**: Blocking dialog for critical errors
- **`page`**: Full-page error state

## Console Guard

In production, the console guard:
- Suppresses raw error messages and stack traces
- Logs only structured, safe information for monitoring
- Prevents sensitive data from appearing in DevTools

```tsx
import { logger, enforceProductionConsole } from '@/lib/feedback';

// Call once at app initialization
enforceProductionConsole();

// Use logger instead of console
logger.debug('Debug info', data);     // Only in development
logger.info('User action', event);    // Safe for production
logger.warn('Potential issue', data); // Safe for production
logger.error('Operation failed', error); // Sanitized in production
```

## Editorial Tone Guidelines

All user-facing messages should be:
- **Calm**: Never alarming or technical
- **Clear**: One sentence, no jargon
- **Actionable**: Include what to do next
- **Professional**: Match editorial brand voice

❌ Bad: "Error 500: Internal server error"
✅ Good: "Something didn't load just now. Please try again."

❌ Bad: "ValidationError: headline must be at least 10 characters"
✅ Good: "This headline is a bit short. Try adding a few more words."

## Files Modified for Integration

The following files have been updated to use the feedback system:
- `src/app/publish/page.tsx` - Main editor page
- `src/components/features/SubscribePopup.tsx` - Email subscription

## Adding New Error Codes

1. Add the code to `src/lib/feedback/error-codes.ts`
2. Add the translation to `src/lib/feedback/translations.ts`
3. Use it in your component via `getErrorMessage(ErrorCodes.NEW_CODE)`
