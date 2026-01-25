# Media-Enabled Editorial Writing System
## Design & Plan Specification v1.0

**Publication:** The Hint  
**Author:** System Architect  
**Date:** 2026-01-25  
**Status:** DESIGN SPECIFICATION (No Implementation)

---

## Table of Contents

1. [Executive Summary](#1-executive-summary)
2. [Core Philosophy](#2-core-philosophy)
3. [System Architecture Overview](#3-system-architecture-overview)
4. [Type System Extension](#4-type-system-extension)
5. [Block-Based Content Model](#5-block-based-content-model)
6. [Image Block Specification](#6-image-block-specification)
7. [Video Block Specification](#7-video-block-specification)
8. [Editor UI Design](#8-editor-ui-design)
9. [Media Management Layer](#9-media-management-layer)
10. [Validation & Guardrails](#10-validation--guardrails)
11. [Public Rendering System](#11-public-rendering-system)
12. [API Design](#12-api-design)
13. [Storage Architecture](#13-storage-architecture)
14. [Performance Contracts](#14-performance-contracts)
15. [Migration Strategy](#15-migration-strategy)
16. [Implementation Phases](#16-implementation-phases)
17. [Testing Requirements](#17-testing-requirements)
18. [Anti-Patterns (Forbidden)](#18-anti-patterns-forbidden)

---

## 1. Executive Summary

This specification extends The Hint's existing `/publish` editorial console to support **images** and **videos** as first-class story blocks, while preserving the publication's core values of **text-first journalism**, **reader experience**, and **editorial discipline**.

### Current State Analysis

The existing system (`src/app/publish/page.tsx`) provides:
- Two-column editor layout (writing canvas + metadata sidebar)
- Draft/publish workflow with server-side validation
- Plain text body with markdown support
- Single optional featured image per article (URL in frontmatter)
- No video support
- No inline media blocks

### Target State

A block-based writing surface where:
- Media exists ONLY as structured blocks within the narrative
- Hard limits: **3 images max**, **1 video max** per article
- All media is URL-referenced, never embedded
- Performance is protected by lazy-loading and progressive rendering

---

## 2. Core Philosophy

### Immutable Principles

| Principle | Enforcement |
|-----------|-------------|
| Text is primary, media is supportive | Media blocks cannot exist without surrounding text |
| Media strengthens reporting | Each media item must have narrative purpose |
| Reader experience > editor convenience | Performance optimizations are non-negotiable |
| Editorial discipline by design | Hard limits enforced at system level |

### What This System IS

✅ A professional newsroom writing tool  
✅ A structured content editor with media blocks  
✅ A performance-first media reference system  

### What This System IS NOT

❌ A media gallery  
❌ A video platform  
❌ A CMS with attachments  
❌ A blog editor  
❌ A performance liability  

---

## 3. System Architecture Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                     EDITOR LAYER                                 │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │              ArticleEditor.tsx (Extended)                │    │
│  │  ┌─────────────────────────────────────────────────────┐│    │
│  │  │            Block-Based Writing Surface              ││    │
│  │  │  ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌───────────┐ ││    │
│  │  │  │Paragraph│ │Subhead  │ │ Quote   │ │Image Block│ ││    │
│  │  │  └─────────┘ └─────────┘ └─────────┘ └───────────┘ ││    │
│  │  │  ┌───────────┐                                      ││    │
│  │  │  │Video Block│                                      ││    │
│  │  │  └───────────┘                                      ││    │
│  │  └─────────────────────────────────────────────────────┘│    │
│  │  ┌─────────────────┐  ┌─────────────────────────────┐   │    │
│  │  │  Media Counter  │  │     Insert Media Action     │   │    │
│  │  │  "2/3 images"   │  │  [+ Image] [+ Video]        │   │    │
│  │  └─────────────────┘  └─────────────────────────────┘   │    │
│  └─────────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                   VALIDATION LAYER                               │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │              src/lib/validation/media.ts                 │    │
│  │  • validateMediaBlock()                                  │    │
│  │  • enforceImageLimit(blocks) → max 3                     │    │
│  │  • enforceVideoLimit(blocks) → max 1 (soft warning)      │    │
│  │  • validateMediaContext() → must have surrounding text   │    │
│  └─────────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                    STORAGE LAYER                                 │
│  ┌──────────────────────┐  ┌──────────────────────────────┐     │
│  │   Media Repository   │  │     Article Content          │     │
│  │   /public/media/     │  │   /src/content/{section}/    │     │
│  │   - images/          │  │   - {slug}.md                │     │
│  │   - External URLs    │  │   (references media by URL)  │     │
│  └──────────────────────┘  └──────────────────────────────┘     │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                   RENDERING LAYER                                │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │           src/components/article/ArticleBody.tsx         │    │
│  │  • Renders blocks in sequence                            │    │
│  │  • Text loads first (blocking)                           │    │
│  │  • Media loads progressively (non-blocking)              │    │
│  │  • Images: lazy-load, explicit dimensions                │    │
│  │  • Videos: click-to-play, load player on visibility      │    │
│  └─────────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────────┘
```

---

## 4. Type System Extension

### New Types (src/lib/content/media-types.ts)

```typescript
/**
 * Media Block Types
 * Strict type definitions for story-integrated media
 */

/** Block types allowed in article body */
export type ContentBlockType = 
  | 'paragraph'
  | 'subheading'
  | 'quote'
  | 'image'
  | 'video';

/** Base block interface */
interface BaseBlock {
  id: string;           // Unique block identifier
  type: ContentBlockType;
  order: number;        // Position in article flow
}

/** Text-based blocks */
export interface ParagraphBlock extends BaseBlock {
  type: 'paragraph';
  content: string;      // Markdown-supported text
}

export interface SubheadingBlock extends BaseBlock {
  type: 'subheading';
  content: string;
}

export interface QuoteBlock extends BaseBlock {
  type: 'quote';
  content: string;
  attribution?: string;
}

/** Image block with full metadata */
export interface ImageBlock extends BaseBlock {
  type: 'image';
  src: string;              // URL to image
  alt: string;              // Required accessibility text
  caption?: string;         // Optional caption (encouraged)
  credit?: string;          // Photographer/source credit
  width: number;            // Explicit width (prevents layout shift)
  height: number;           // Explicit height
  aspectRatio: string;      // e.g., "16:9", "4:3", "1:1"
}

/** Video block (external sources only) */
export interface VideoBlock extends BaseBlock {
  type: 'video';
  provider: 'youtube' | 'vimeo' | 'cdn';
  videoId: string;          // Platform-specific ID
  embedUrl: string;         // Full embed URL
  posterUrl: string;        // Thumbnail/poster image
  caption?: string;
  duration?: number;        // Seconds (for display)
}

/** Union type for all blocks */
export type ContentBlock = 
  | ParagraphBlock 
  | SubheadingBlock 
  | QuoteBlock 
  | ImageBlock 
  | VideoBlock;

/** Media limits (enforced at validation layer) */
export const MEDIA_LIMITS = {
  MAX_IMAGES: 3,
  MAX_VIDEOS: 1,
  VIDEO_LIMIT_TYPE: 'soft' as const,  // Warning, not block
  IMAGE_LIMIT_TYPE: 'hard' as const,  // Block insertion
} as const;

/** Allowed image formats */
export const ALLOWED_IMAGE_FORMATS = [
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/avif',
] as const;

/** Max file sizes */
export const MAX_IMAGE_SIZE_BYTES = 5 * 1024 * 1024;  // 5MB

/** Allowed video providers */
export const ALLOWED_VIDEO_PROVIDERS = ['youtube', 'vimeo', 'cdn'] as const;
```

### Extended Article Type

```typescript
/** Extended Article with block-based body */
export interface ArticleWithMedia extends Omit<Article, 'body'> {
  /** Block-structured body content */
  bodyBlocks: ContentBlock[];
  
  /** Featured image (for homepage/social) - first image or explicit */
  featuredImage?: {
    src: string;
    alt: string;
    width: number;
    height: number;
  };
  
  /** Media summary for validation */
  mediaSummary: {
    imageCount: number;
    videoCount: number;
    hasVideo: boolean;
  };
}
```

---

## 5. Block-Based Content Model

### Block Ordering Rules (WAIVED / RELAXED)

> **UPDATE 2026-01-25:** The following strict ordering rules have been **WAIVED** to allow flexible editorial layouts. Editors may place media at the start/end or consecutively if desired.

1. ~~**First block** MUST be a text block (paragraph, subheading, or quote)~~ (WAIVED)
2. ~~**Last block** MUST be a text block~~ (WAIVED)
3. ~~**Media blocks** MUST have at least one text block before AND after~~ (WAIVED)
4. ~~**Consecutive media blocks** are NOT allowed~~ (WAIVED)

> **Text Context Clarification:** For the purposes of block ordering validation, `paragraph`, `subheading`, and `quote` blocks ALL qualify as valid "text context". A sequence like `subheading → image → paragraph` is valid. A sequence like `quote → video → quote` is also valid.
5. Block order defines reading flow (no reordering on render)

### Block Serialization (Markdown Storage)

Articles continue to be stored as Markdown files. Media blocks use custom syntax:

```markdown
---
title: "Headline Here"
subtitle: "Subheadline Here"
# ... other frontmatter
---

Opening paragraph text goes here. This is the lede.

Second paragraph with more context.

:::image
src: /media/images/article-photo-1.webp
alt: Protestors gathered outside city hall
caption: Hundreds gathered Tuesday morning
credit: Jane Doe / The Hint
width: 1200
height: 800
:::

The protest continued for several hours, with speakers
addressing the crowd about proposed legislation.

## A Subheading

More body text continues here after the subheading.

:::video
provider: youtube
videoId: dQw4w9WgXcQ
posterUrl: /media/posters/video-thumbnail.webp
caption: Full recording of the mayor's address
:::

The mayor's response came later that evening, with
a press statement issued around 8 PM.
```

### Parser Extension Requirements

The content parser (`src/lib/content/parser.ts`) must be extended to:

1. Detect `:::image` and `:::video` fence blocks
2. Parse YAML-like key-value pairs within fences
3. Convert to typed ContentBlock objects
4. Validate block ordering rules
5. Count media items and enforce limits on parse

---

## 6. Image Block Specification

### Technical Requirements

| Requirement | Specification |
|-------------|---------------|
| Max per article | 3 (hard limit, blocked at editor) |
| Storage | URL reference only (no base64) |
| Formats | JPEG, PNG, WebP, AVIF |
| Max file size | 5MB per image |
| Dimensions | Explicit width/height required |
| Responsive | Generate srcset at upload time |
| Loading | Native lazy loading (`loading="lazy"`) |

### Image Upload Flow

```
┌─────────────────────────────────────────────────────────────┐
│ 1. Editor clicks "Insert Image"                              │
├─────────────────────────────────────────────────────────────┤
│ 2. System checks: imageCount < 3?                            │
│    ├─ NO  → Show error: "Maximum 3 images allowed"           │
│    └─ YES → Continue                                         │
├─────────────────────────────────────────────────────────────┤
│ 3. File picker opens (accept: .jpg, .png, .webp, .avif)      │
├─────────────────────────────────────────────────────────────┤
│ 4. Client-side validation:                                   │
│    • File size ≤ 5MB                                         │
│    • Valid image format                                      │
│    • Extract dimensions                                      │
├─────────────────────────────────────────────────────────────┤
│ 5. Upload to /api/media/upload                               │
│    • Server validates again                                  │
│    • Generate responsive sizes (400w, 800w, 1200w)           │
│    • Convert to WebP if not already                          │
│    • Store in /public/media/images/{hash}.webp               │
│    • Return: { url, width, height, srcset }                  │
├─────────────────────────────────────────────────────────────┤
│ 6. ImageBlockEditor modal opens:                             │
│    • Preview image                                           │
│    • Alt text input (required)                               │
│    • Caption input (optional, encouraged)                    │
│    • Credit input (optional)                                 │
├─────────────────────────────────────────────────────────────┤
│ 7. Editor confirms → Block inserted at cursor position       │
├─────────────────────────────────────────────────────────────┤
│ 8. Media counter updates: "2 of 3 images used"               │
└─────────────────────────────────────────────────────────────┘
```

### Image Rendering Output

```html
<figure class="article-image" data-block-id="img-001">
  <picture>
    <source 
      srcset="/media/images/abc123-400w.webp 400w,
              /media/images/abc123-800w.webp 800w,
              /media/images/abc123-1200w.webp 1200w"
      sizes="(max-width: 600px) 400px,
             (max-width: 1000px) 800px,
             1200px"
      type="image/webp"
    />
    <img 
      src="/media/images/abc123-800w.webp"
      alt="Protestors gathered outside city hall"
      width="1200"
      height="800"
      loading="lazy"
      decoding="async"
    />
  </picture>
  <figcaption>
    <span class="caption">Hundreds gathered Tuesday morning</span>
    <span class="credit">Jane Doe / The Hint</span>
  </figcaption>
</figure>
```

---

## 7. Video Block Specification

### Technical Requirements

| Requirement | Specification |
|-------------|---------------|
| Max per article | 1 (soft limit, warning shown) |
| Hosting | External only (YouTube, Vimeo, CDN) |
| Self-hosted | NOT ALLOWED in v1 |
| Autoplay | NEVER |
| Load behavior | Click-to-play, player loads on visibility |
| Poster | Required (thumbnail before play) |

### Supported Providers

| Provider | URL Pattern | Embed Method |
|----------|-------------|--------------|
| YouTube | `youtube.com/watch?v=ID` or `youtu.be/ID` | lite-youtube-embed |
| Vimeo | `vimeo.com/ID` | lite-vimeo-embed |
| CDN | Direct MP4/WebM URL | Native video element |

### Video Insert Flow

```
┌─────────────────────────────────────────────────────────────┐
│ 1. Editor clicks "Insert Video"                              │
├─────────────────────────────────────────────────────────────┤
│ 2. System checks: videoCount >= 1?                           │
│    ├─ YES → Show warning dialog:                             │
│    │        "Article already has a video.                    │
│    │         Adding another may affect performance.          │
│    │         [Cancel] [Add Anyway]"                          │
│    └─ NO  → Continue                                         │
├─────────────────────────────────────────────────────────────┤
│ 3. VideoURLInput modal opens:                                │
│    • Paste video URL                                         │
│    • System auto-detects provider                            │
│    • Fetches thumbnail via oEmbed API                        │
├─────────────────────────────────────────────────────────────┤
│ 4. Preview shown with thumbnail                              │
│    • Caption input (optional)                                │
│    • Confirm insertion                                       │
├─────────────────────────────────────────────────────────────┤
│ 5. Block inserted at cursor position                         │
├─────────────────────────────────────────────────────────────┤
│ 6. Media counter updates: "1 video used"                     │
└─────────────────────────────────────────────────────────────┘
```

### Video Rendering (Facade Pattern)

Videos use a **facade pattern** where only a static thumbnail loads initially. The actual player iframe loads only when the user clicks.

```html
<figure class="article-video" data-block-id="vid-001">
  <lite-youtube 
    videoid="dQw4w9WgXcQ"
    playlabel="Play: Mayor's Address"
    posterquality="maxresdefault"
  >
    <button type="button" class="lty-playbtn" aria-label="Play video">
      <span class="lyt-visually-hidden">Play</span>
    </button>
  </lite-youtube>
  <figcaption>
    <span class="caption">Full recording of the mayor's address</span>
  </figcaption>
</figure>
```

**Dependencies:** Use `lite-youtube-embed` and `lite-vimeo-embed` packages for facade pattern implementation.

---

## 8. Editor UI Design

### Writing Surface Extension

The current `ArticleEditor.tsx` body textarea transforms into a block-aware writing surface:

```
┌─────────────────────────────────────────────────────────────────┐
│  WRITING CANVAS                                                  │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │ [Headline Input - unchanged]                                │ │
│  └────────────────────────────────────────────────────────────┘ │
│                                                                  │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │ [Subheadline Input - unchanged]                             │ │
│  └────────────────────────────────────────────────────────────┘ │
│                                                                  │
│  ┌────────────────────────────── BLOCKS ─────────────────────┐  │
│  │                                                            │  │
│  │  ┌─ Paragraph Block ─────────────────────────────────────┐ │  │
│  │  │ Opening paragraph of the article goes here...         │ │  │
│  │  │ More text continues in this block.                    │ │  │
│  │  └───────────────────────────────────────────────────────┘ │  │
│  │                                                            │  │
│  │  ┌────────────────────────────────────────────────────────┐│  │
│  │  │ [+ Insert Block]  ¶ Paragraph | H Subhead | ❝ Quote   ││  │
│  │  │                   🖼 Image (2/3) | 🎬 Video (0/1)      ││  │
│  │  └────────────────────────────────────────────────────────┘│  │
│  │                                                            │  │
│  │  ┌─ Image Block ─────────────────────────────────────────┐ │  │
│  │  │ ┌─────────────────────────────────────────┐           │ │  │
│  │  │ │                                         │  [✎] [🗑] │ │  │
│  │  │ │         [Image Preview]                 │           │ │  │
│  │  │ │                                         │           │ │  │
│  │  │ └─────────────────────────────────────────┘           │ │  │
│  │  │ Caption: Hundreds gathered Tuesday morning            │ │  │
│  │  │ Credit: Jane Doe / The Hint                           │ │  │
│  │  └───────────────────────────────────────────────────────┘ │  │
│  │                                                            │  │
│  │  ┌─ Paragraph Block ─────────────────────────────────────┐ │  │
│  │  │ The protest continued for several hours...            │ │  │
│  │  └───────────────────────────────────────────────────────┘ │  │
│  │                                                            │  │
│  └────────────────────────────────────────────────────────────┘  │
│                                                                  │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │  MEDIA SUMMARY                                              │ │
│  │  Images: 2 of 3 used  •  Video: 0 of 1 used                 │ │
│  └────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────┘
```

### Block Controls

Each block has:
- **Drag handle** (left side) - for reordering
- **Edit button** - opens block editor modal
- **Delete button** - removes block (with confirmation for media)
- **Type indicator** - subtle label showing block type

> **Drag-and-Drop Guardrails:**
> - Drag reordering is **flat only** - no nested blocks
> - Blocks cannot morph types during drag (an image stays an image)
> - Drop validation enforces ordering rules in real-time
> - If a drop would create invalid ordering (e.g., consecutive media), the drop is rejected with visual feedback
> - Keep implementation simple; complex drag behaviors are explicitly out of scope

### Media Counter Component

Persistent display showing current media usage:

```typescript
interface MediaCounterProps {
  imageCount: number;
  maxImages: number;      // 3
  videoCount: number;
  maxVideos: number;      // 1
}

// Display logic:
// "2 of 3 images" - normal
// "3 of 3 images" - warning color, "Image limit reached"
// "1 video" - subtle warning if adding another
```

---

## 9. Media Management Layer

### Media Repository Structure

```
public/
└── media/
    ├── images/
    │   ├── {hash}-400w.webp
    │   ├── {hash}-800w.webp
    │   ├── {hash}-1200w.webp
    │   └── {hash}-original.webp
    └── posters/
        └── {videoId}-poster.webp
```

### Media Asset Lifecycle

| Event | Action |
|-------|--------|
| Upload | Store in `/public/media/`, generate responsive sizes |
| Reference | Article stores URL, never binary |
| Article Delete | Media NOT auto-deleted (reuse possible) |
| Orphan Cleanup | Manual admin task (future feature) |

> **Future Consideration (v2+):** Over time, orphaned media assets will accumulate as articles are deleted or edited. A future admin tool or scheduled task may surface unused assets for review. **No auto-delete will ever be implemented** - all cleanup requires explicit editor action. The `usedBy` array in `MediaAsset` supports this future functionality.

### Media Metadata Storage

```typescript
// src/lib/media/registry.ts
interface MediaAsset {
  id: string;               // Unique hash
  type: 'image' | 'video-poster';
  originalFilename: string;
  mimeType: string;
  size: number;
  width: number;
  height: number;
  uploadedAt: string;
  urls: {
    original: string;
    sizes: Record<string, string>;  // e.g., { "400w": "/media/...", "800w": "..." }
  };
  usedBy: string[];         // Article slugs referencing this asset
}
```

---

## 10. Validation & Guardrails

### Server-Side Validation (src/lib/validation/media.ts)

```typescript
/**
 * Media validation rules
 * ALL validation happens server-side
 */

export interface MediaValidationResult {
  isValid: boolean;
  errors: MediaValidationError[];
  warnings: MediaValidationWarning[];
}

export interface MediaValidationError {
  type: 'image_limit' | 'video_limit' | 'missing_alt' | 'invalid_url' | 
        'missing_dimensions' | 'no_text_context' | 'consecutive_media';
  message: string;
  blockId?: string;
}

export interface MediaValidationWarning {
  type: 'video_soft_limit' | 'missing_caption';
  message: string;
  blockId?: string;
}

/** Validate all media blocks in an article */
export function validateMediaBlocks(blocks: ContentBlock[]): MediaValidationResult {
  const errors: MediaValidationError[] = [];
  const warnings: MediaValidationWarning[] = [];
  
  const imageBlocks = blocks.filter(b => b.type === 'image');
  const videoBlocks = blocks.filter(b => b.type === 'video');
  
  // HARD LIMIT: Max 3 images
  if (imageBlocks.length > MEDIA_LIMITS.MAX_IMAGES) {
    errors.push({
      type: 'image_limit',
      message: `Maximum ${MEDIA_LIMITS.MAX_IMAGES} images allowed. Found: ${imageBlocks.length}`,
    });
  }
  
  // SOFT LIMIT: Max 1 video (warning, not error)
  if (videoBlocks.length > MEDIA_LIMITS.MAX_VIDEOS) {
    warnings.push({
      type: 'video_soft_limit',
      message: `Recommended maximum is ${MEDIA_LIMITS.MAX_VIDEOS} video. Found: ${videoBlocks.length}`,
    });
  }
  
  // Validate each image block
  for (const block of imageBlocks) {
    if (!block.alt || block.alt.trim() === '') {
      errors.push({
        type: 'missing_alt',
        message: 'Image requires alt text for accessibility',
        blockId: block.id,
      });
    }
    if (!block.width || !block.height) {
      errors.push({
        type: 'missing_dimensions',
        message: 'Image requires explicit dimensions',
        blockId: block.id,
      });
    }
    if (!block.caption) {
      warnings.push({
        type: 'missing_caption',
        message: 'Consider adding a caption to provide context',
        blockId: block.id,
      });
    }
  }
  
  // Validate block ordering (WAIVED / RELAXED)
  /* 
  // STRICT RULES CURRENTLY DISABLED per user request (2026-01-25)
  for (let i = 0; i < blocks.length; i++) {
    const block = blocks[i];
    const isMedia = block.type === 'image' || block.type === 'video';
    
    if (isMedia) {
      // Check for text before (unless first block - already invalid)
      if (i === 0) {
        errors.push({
          type: 'no_text_context',
          message: 'Article must begin with text, not media',
          blockId: block.id,
        });
      }
      
      // Check for text after (unless last block - already invalid)
      if (i === blocks.length - 1) {
        errors.push({
          type: 'no_text_context',
          message: 'Article must end with text, not media',
          blockId: block.id,
        });
      }
      
      // Check for consecutive media
      const prevBlock = blocks[i - 1];
      if (prevBlock && (prevBlock.type === 'image' || prevBlock.type === 'video')) {
        errors.push({
          type: 'consecutive_media',
          message: 'Media blocks must be separated by text',
          blockId: block.id,
        });
      }
    }
  }
  */
  
  return {
    isValid: errors.length === 0,
    errors,
    warnings,
  };
}
```

### Client-Side Guardrails (UX Only)

```typescript
// In ArticleEditor - UX hints, not validation
function getMediaHints(blocks: ContentBlock[]): Record<string, string> {
  const hints: Record<string, string> = {};
  
  const imageCount = blocks.filter(b => b.type === 'image').length;
  const videoCount = blocks.filter(b => b.type === 'video').length;
  
  if (imageCount >= 3) {
    hints.images = 'Image limit reached';
  }
  if (videoCount >= 1) {
    hints.video = 'Adding another video may impact performance';
  }
  
  return hints;
}
```

---

## 11. Public Rendering System

### Rendering Priorities

| Priority | Content | Behavior |
|----------|---------|----------|
| 1 (Critical) | Headline, subheadline | Server-rendered, blocking |
| 2 (High) | Text blocks | Server-rendered, blocking |
| 3 (Medium) | Images above fold | `loading="eager"`, dimensions set |
| 4 (Low) | Images below fold | `loading="lazy"`, dimensions set |
| 5 (Deferred) | Video player | Facade only, load on click |

### ArticleBody Component Extension

```typescript
// src/components/article/ArticleBody.tsx (extended)
interface ArticleBodyProps {
  blocks: ContentBlock[];
}

export function ArticleBody({ blocks }: ArticleBodyProps) {
  return (
    <div className="article-body">
      {blocks.map((block, index) => (
        <BlockRenderer 
          key={block.id} 
          block={block} 
          isAboveFold={index < 3} 
        />
      ))}
    </div>
  );
}

function BlockRenderer({ block, isAboveFold }: { block: ContentBlock; isAboveFold: boolean }) {
  switch (block.type) {
    case 'paragraph':
      return <ParagraphBlock content={block.content} />;
    case 'subheading':
      return <SubheadingBlock content={block.content} />;
    case 'quote':
      return <QuoteBlock content={block.content} attribution={block.attribution} />;
    case 'image':
      return <ImageBlockRenderer block={block} loading={isAboveFold ? 'eager' : 'lazy'} />;
    case 'video':
      return <VideoBlockRenderer block={block} />;
  }
}
```

### Homepage/Section Page Rules

| Page Type | Media Display |
|-----------|---------------|
| Homepage Lead | Featured image only, no video |
| Homepage Top Stories | Featured image only, no video |
| Section Page List | Featured image thumbnails only |
| Article Page | Full media blocks rendered |

---

## 12. API Design

### New Endpoints

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/media/upload` | POST | Upload image, return URL + metadata |
| `/api/media/video-info` | POST | Validate video URL, fetch oEmbed data |
| `/api/media/list` | GET | List all uploaded media assets |

### Upload API Specification

```typescript
// POST /api/media/upload
// Content-Type: multipart/form-data

// Request
interface MediaUploadRequest {
  file: File;            // Image file
  altText?: string;      // Optional, can be added later
}

// Response
interface MediaUploadResponse {
  success: boolean;
  data?: {
    id: string;
    url: string;           // Primary URL
    srcset: string;        // Responsive srcset
    width: number;
    height: number;
    mimeType: string;
    size: number;
  };
  error?: string;
}
```

### Video Info API

```typescript
// POST /api/media/video-info
// Content-Type: application/json

// Request
interface VideoInfoRequest {
  url: string;           // YouTube/Vimeo URL
}

// Response
interface VideoInfoResponse {
  success: boolean;
```

> **Rate Limiting Note:** All `/api/media/*` endpoints assume authenticated editor usage behind the existing session middleware. Rate limiting is deferred to infrastructure layer (e.g., Vercel, Cloudflare). For v1, no application-level rate limiting is implemented. This should be revisited if abuse patterns emerge.
  data?: {
    provider: 'youtube' | 'vimeo';
    videoId: string;
    embedUrl: string;
    title: string;
    posterUrl: string;
    duration?: number;
  };
  error?: string;
}
```

---

## 13. Storage Architecture

### Content Storage (Extended Frontmatter)

```yaml
---
title: "Article Headline"
subtitle: "Article Subheadline"
section: politics
contentType: news
publishedAt: "2026-01-25T10:00:00Z"
placement: lead
tags:
  - politics
  - local
featuredImage:
  src: "/media/images/abc123-1200w.webp"
  alt: "Protestors outside city hall"
  width: 1200
  height: 800
mediaSummary:
  imageCount: 2
  videoCount: 1
---

Article body with blocks...
```

### File System Layout

```
src/
└── content/
    └── {section}/
        └── {slug}.md          # Article with block-based body

public/
└── media/
    ├── images/
    │   ├── {hash}-400w.webp
    │   ├── {hash}-800w.webp
    │   └── {hash}-1200w.webp
    └── posters/
        └── {videoId}.webp

src/
└── lib/
    └── media/
        ├── types.ts           # Media type definitions
        ├── upload.ts          # Upload handling
        ├── video-providers.ts # YouTube/Vimeo integration
        └── registry.ts        # Media asset registry
```

---

## 14. Performance Contracts

### Guaranteed Performance Metrics

| Metric | Target | Enforcement |
|--------|--------|-------------|
| LCP (Largest Contentful Paint) | < 2.5s | Text-first rendering |
| CLS (Cumulative Layout Shift) | < 0.1 | Explicit image dimensions |
| FID (First Input Delay) | < 100ms | No blocking media loads |
| Image payload | < 200KB per image | WebP + responsive sizes |
| Video iframe | 0 bytes until click | Facade pattern |

### Loading Sequence

```
T+0ms     HTML document loads
T+50ms    Text content visible (headline, subheadline, paragraphs)
T+100ms   Above-fold images begin loading
T+200ms   Video posters begin loading (static images only)
T+500ms   Below-fold images begin loading (as scrolled into view)
T+∞       Video iframe loads (only on user click)
```

---

## 15. Migration Strategy

### Phase 1: Preserve Existing Articles

- All existing articles continue to work unchanged
- `body` field (plain text/markdown) remains valid
- Parser detects legacy vs. block-based articles automatically

### Phase 2: Gradual Adoption

- New articles can use block-based editing
- Editor shows "Convert to blocks" option for legacy articles
- No forced migration

### Phase 3: Legacy Detection

```typescript
function isLegacyArticle(article: Article): boolean {
  // Legacy articles have string body, not block array
  return typeof article.body === 'string' && !article.body.includes(':::image');
}

function getBodyContent(article: Article): ContentBlock[] {
  if (isLegacyArticle(article)) {
    // Convert plain markdown to single paragraph blocks
    return convertMarkdownToBlocks(article.body);
  }
  return parseBlocksFromMarkdown(article.body);
}
```

---

## 16. Implementation Phases

### Phase 1: Foundation (Week 1-2)
- [ ] Create `src/lib/content/media-types.ts` with all type definitions
- [ ] Create `src/lib/validation/media.ts` with validation rules
- [ ] Extend content parser to detect block syntax
- [ ] Create media upload API endpoint

### Phase 2: Editor UI (Week 3-4)
- [ ] Create `BlockEditor` component for writing surface
- [ ] Create `ImageBlockEditor` modal component
- [ ] Create `VideoBlockEditor` modal component  
- [ ] Create `MediaCounter` component
- [ ] Integrate block editing into `ArticleEditor.tsx`

### Phase 3: Storage & Processing (Week 5)
- [ ] Implement image upload with responsive size generation
- [ ] Implement video URL validation and oEmbed fetching
- [ ] Create media asset registry
- [ ] Update article serialization to block format

### Phase 4: Rendering (Week 6)
- [ ] Create `ImageBlockRenderer` component with lazy loading
- [ ] Create `VideoBlockRenderer` component with facade pattern
- [ ] Update `ArticleBody.tsx` for block rendering
- [ ] Update homepage/section components for featured images

### Phase 5: Polish & Testing (Week 7-8)
- [ ] Performance testing and optimization
- [ ] Accessibility audit (alt text, keyboard navigation)
- [ ] Edge case handling and error states
- [ ] Documentation and training

---

## 17. Testing Requirements

### Unit Tests

| Test Suite | Coverage |
|------------|----------|
| Media type validation | All type guards and validators |
| Block ordering rules | All valid/invalid sequences |
| Limit enforcement | Image max, video soft limit |
| URL parsing | YouTube, Vimeo, CDN patterns |

### Integration Tests

| Test Case | Expected Behavior |
|-----------|-------------------|
| Upload image at limit | Error: "Maximum 3 images" |
| Add 2nd video | Warning shown, allowed to proceed |
| Media block without text | Error: "Must have surrounding text" |
| Delete image block | Counter updates, no orphaned files |

### E2E Tests

| Flow | Validation |
|------|------------|
| Full article with 3 images | Publishes successfully, all images render |
| Article with YouTube video | Facade loads, click triggers player |
| Legacy article edit | No data loss, optional block conversion |

---

## 18. Anti-Patterns (Forbidden)

### ❌ NEVER DO

1. **Base64 embedded images** - Always use URL references
2. **Autoplay video** - Never, under any circumstances
3. **Blocking media loads** - Text must render first
4. **Silent limit failures** - Always show clear feedback
5. **Media without context** - Blocks must have surrounding text
6. **Self-hosted video streaming** - External providers only in v1
7. **Layout shifts** - Always specify dimensions
8. **Media galleries** - This is a story editor, not a gallery
9. **Inline image editing** - Cropping/filters are out of scope
10. **Media-only articles** - Text is always primary

---

## Appendix A: Component File Map

| Component | File Path | Purpose |
|-----------|-----------|---------|
| Media Types | `src/lib/content/media-types.ts` | Type definitions |
| Media Validation | `src/lib/validation/media.ts` | Server-side validation |
| Block Parser | `src/lib/content/block-parser.ts` | Parse markdown blocks |
| Media Upload | `src/lib/media/upload.ts` | Handle image uploads |
| Video Providers | `src/lib/media/video-providers.ts` | YouTube/Vimeo integration |
| Block Editor | `src/components/publish/BlockEditor.tsx` | Block-aware writing surface |
| Image Block Editor | `src/components/publish/ImageBlockEditor.tsx` | Image insertion modal |
| Video Block Editor | `src/components/publish/VideoBlockEditor.tsx` | Video insertion modal |
| Media Counter | `src/components/publish/MediaCounter.tsx` | Usage display |
| Image Renderer | `src/components/article/ImageBlock.tsx` | Public image display |
| Video Renderer | `src/components/article/VideoBlock.tsx` | Public video facade |

---

## Appendix B: Decision Log

| Decision | Rationale | Date |
|----------|-----------|------|
| Max 3 images | Prevents gallery-like articles, maintains text focus | 2026-01-25 |
| Soft video limit | Performance concern, but editorial discretion allowed | 2026-01-25 |
| External video only | Complexity of self-hosted streaming out of v1 scope | 2026-01-25 |
| Facade pattern for video | Zero performance impact until user interaction | 2026-01-25 |
| Block-based storage in Markdown | Maintains human-readable content files | 2026-01-25 |
| URL references only | Clean separation of content and assets | 2026-01-25 |

---

**END OF SPECIFICATION**

*This document serves as the authoritative design reference. Implementation must not deviate from these specifications without documented amendment.*
