/**
 * Publishing Console Types
 * Re-exports all type definitions for the publishing console
 */

// Article and form types
export {
    SECTIONS,
    CONTENT_TYPES,
    INITIAL_FORM_DATA,
    type SectionValue,
    type ContentTypeValue,
    type PlacementValue,
    type StatusValue,
    type WorkspaceMode,
    type ArticleFormData,
    type ArticleEntry,
    type ApiResponse,
    type PreviewData,
    type DraftHistoryEntry,
    type FieldErrors,
    type ToastMessage,
} from './article-types';

// Block editor types
export {
    getInsertOptions,
    isValidDropPosition,
    type EditorFocus,
    type EditingBlock,
    type DragState,
    type BlockRendererProps,
    type ImageBlockEditorProps,
    type VideoBlockEditorProps,
    type MediaCounterProps,
    type InsertOption,
    type InsertMenuProps,
    type BlockEditorAction,
    type BlockEditorState,
} from './block-editor-types';
