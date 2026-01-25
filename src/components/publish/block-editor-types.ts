/**
 * Media Block Editor Types
 * Types for the block-based writing surface
 * 
 * DESIGN SPEC: .agent/specifications/MEDIA_SYSTEM_DESIGN.md
 */

import {
    ContentBlock,
    ContentBlockType,
    ImageBlock,
    VideoBlock,
    MediaSummary,
    MEDIA_LIMITS,
} from '@/lib/content/media-types';

// =============================================================================
// EDITOR STATE
// =============================================================================

/** Editor focus state */
export interface EditorFocus {
    /** Currently focused block ID */
    blockId: string | null;
    /** Cursor position within block (for text blocks) */
    cursorPosition?: number;
}

/** Block being edited */
export interface EditingBlock {
    /** Block ID being edited */
    id: string;
    /** Type of editing (content, metadata, etc.) */
    editType: 'content' | 'caption' | 'alt' | 'metadata';
}

/** Drag state for reordering */
export interface DragState {
    /** Block being dragged */
    draggedBlockId: string | null;
    /** Current drop target position */
    dropTargetIndex: number | null;
    /** Whether the current drop position is valid */
    isValidDrop: boolean;
}

// =============================================================================
// BLOCK EDITOR PROPS
// =============================================================================

/** Props for individual block renderer */
export interface BlockRendererProps {
    /** The block to render */
    block: ContentBlock;
    /** Whether this block is focused */
    isFocused: boolean;
    /** Whether this block is being edited */
    isEditing: boolean;
    /** Callback when block content changes */
    onContentChange: (id: string, content: string) => void;
    /** Callback when block is focused */
    onFocus: (id: string) => void;
    /** Callback when block loses focus */
    onBlur: () => void;
    /** Callback to delete block */
    onDelete: (id: string) => void;
    /** Callback to start editing block */
    onEdit: (id: string) => void;
    /** Whether block is being dragged */
    isDragging: boolean;
    /** Drag handle props */
    dragHandleProps?: Record<string, unknown>;
}

/** Props for image block editor modal */
export interface ImageBlockEditorProps {
    /** Block being edited (null for new block) */
    block: ImageBlock | null;
    /** Callback when save is clicked */
    onSave: (block: Omit<ImageBlock, 'id' | 'type' | 'order'>) => void;
    /** Callback when cancel is clicked */
    onCancel: () => void;
    /** Whether upload is in progress */
    isUploading: boolean;
}

/** Props for video block editor modal */
export interface VideoBlockEditorProps {
    /** Block being edited (null for new block) */
    block: VideoBlock | null;
    /** Callback when save is clicked */
    onSave: (block: Omit<VideoBlock, 'id' | 'type' | 'order'>) => void;
    /** Callback when cancel is clicked */
    onCancel: () => void;
    /** Whether video info fetch is in progress */
    isFetching: boolean;
}

// =============================================================================
// MEDIA COUNTER PROPS
// =============================================================================

/** Props for media counter display */
export interface MediaCounterProps {
    /** Current media summary */
    summary: MediaSummary;
    /** Maximum allowed images */
    maxImages: number;
    /** Maximum allowed videos */
    maxVideos: number;
}

// =============================================================================
// INSERT MENU
// =============================================================================

/** Block type option for insert menu */
export interface InsertOption {
    /** Block type to insert */
    type: ContentBlockType;
    /** Display label */
    label: string;
    /** Icon (emoji or component) */
    icon: string;
    /** Whether this option is disabled */
    disabled: boolean;
    /** Reason if disabled */
    disabledReason?: string;
}

/** Props for insert menu */
export interface InsertMenuProps {
    /** Position to insert at */
    insertPosition: number;
    /** Available insert options */
    options: InsertOption[];
    /** Callback when option is selected */
    onSelect: (type: ContentBlockType, position: number) => void;
    /** Callback to close menu */
    onClose: () => void;
}

// =============================================================================
// BLOCK EDITOR ACTIONS
// =============================================================================

/** Action types for block editor reducer */
export type BlockEditorAction =
    | { type: 'SET_BLOCKS'; blocks: ContentBlock[] }
    | { type: 'ADD_BLOCK'; block: ContentBlock; position: number }
    | { type: 'UPDATE_BLOCK'; id: string; updates: Partial<ContentBlock> }
    | { type: 'DELETE_BLOCK'; id: string }
    | { type: 'MOVE_BLOCK'; fromIndex: number; toIndex: number }
    | { type: 'SET_FOCUS'; blockId: string | null }
    | { type: 'SET_EDITING'; blockId: string | null }
    | { type: 'START_DRAG'; blockId: string }
    | { type: 'UPDATE_DROP_TARGET'; index: number | null; isValid: boolean }
    | { type: 'END_DRAG' };

/** Block editor state */
export interface BlockEditorState {
    /** All content blocks */
    blocks: ContentBlock[];
    /** Currently focused block */
    focusedBlockId: string | null;
    /** Currently editing block */
    editingBlockId: string | null;
    /** Drag state */
    drag: DragState;
    /** Media summary (calculated) */
    mediaSummary: MediaSummary;
}

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

/** Get insert options based on current state */
export function getInsertOptions(
    blocks: ContentBlock[],
    insertPosition: number
): InsertOption[] {
    const imageCount = blocks.filter(b => b.type === 'image').length;
    const videoCount = blocks.filter(b => b.type === 'video').length;

    // Check if position is valid for media
    const canInsertMedia = insertPosition > 0 && insertPosition < blocks.length;
    const prevBlock = blocks[insertPosition - 1];
    const nextBlock = blocks[insertPosition];
    const prevIsMedia = prevBlock && (prevBlock.type === 'image' || prevBlock.type === 'video');
    const nextIsMedia = nextBlock && (nextBlock.type === 'image' || nextBlock.type === 'video');
    const mediaWouldBeConsecutive = prevIsMedia || nextIsMedia;

    return [
        {
            type: 'paragraph' as ContentBlockType,
            label: 'Paragraph',
            icon: '¶',
            disabled: false,
        },
        {
            type: 'subheading' as ContentBlockType,
            label: 'Subheading',
            icon: 'H',
            disabled: false,
        },
        {
            type: 'quote' as ContentBlockType,
            label: 'Quote',
            icon: '❝',
            disabled: false,
        },
        {
            type: 'image' as ContentBlockType,
            label: `Image (${imageCount}/${MEDIA_LIMITS.MAX_IMAGES})`,
            icon: '🖼',
            disabled: imageCount >= MEDIA_LIMITS.MAX_IMAGES || !canInsertMedia || mediaWouldBeConsecutive,
            disabledReason: imageCount >= MEDIA_LIMITS.MAX_IMAGES
                ? 'Image limit reached'
                : !canInsertMedia
                    ? 'Cannot insert media at this position'
                    : mediaWouldBeConsecutive
                        ? 'Media must be separated by text'
                        : undefined,
        },
        {
            type: 'video' as ContentBlockType,
            label: `Video (${videoCount}/${MEDIA_LIMITS.MAX_VIDEOS})`,
            icon: '🎬',
            disabled: !canInsertMedia || mediaWouldBeConsecutive,
            disabledReason: !canInsertMedia
                ? 'Cannot insert media at this position'
                : mediaWouldBeConsecutive
                    ? 'Media must be separated by text'
                    : videoCount >= MEDIA_LIMITS.MAX_VIDEOS
                        ? 'Consider limiting to 1 video for performance'
                        : undefined,
        },
    ];
}

/** Calculate if a drop position is valid */
export function isValidDropPosition(
    blocks: ContentBlock[],
    draggedBlockId: string,
    targetIndex: number
): boolean {
    const draggedBlock = blocks.find(b => b.id === draggedBlockId);
    if (!draggedBlock) return false;

    const isMedia = draggedBlock.type === 'image' || draggedBlock.type === 'video';

    // Text blocks can go anywhere
    if (!isMedia) return true;

    // Media cannot be first or last
    if (targetIndex === 0 || targetIndex >= blocks.length) return false;

    // Create simulated block order
    const newBlocks = blocks.filter(b => b.id !== draggedBlockId);
    newBlocks.splice(targetIndex, 0, draggedBlock);

    // Check for consecutive media
    for (let i = 0; i < newBlocks.length - 1; i++) {
        const current = newBlocks[i];
        const next = newBlocks[i + 1];
        const currentIsMedia = current.type === 'image' || current.type === 'video';
        const nextIsMedia = next.type === 'image' || next.type === 'video';
        if (currentIsMedia && nextIsMedia) {
            return false;
        }
    }

    return true;
}
