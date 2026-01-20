/**
 * Draft Storage System
 * File-based storage for article drafts
 * 
 * Drafts are stored separately from published content.
 * Each draft has a unique ID for tracking versions.
 */

import fs from 'fs';
import path from 'path';
import { ValidatedDraftData } from '../validation';

/** Base path for draft files */
const DRAFTS_BASE_PATH = path.join(process.cwd(), 'src', 'drafts');

/** Draft metadata for history */
export interface DraftHistoryEntry {
    draftId: string;
    headline: string;
    savedAt: string;
    section: string;
    contentType: string;
}

/**
 * Ensure drafts directory exists
 */
function ensureDraftsDirectory(): void {
    if (!fs.existsSync(DRAFTS_BASE_PATH)) {
        fs.mkdirSync(DRAFTS_BASE_PATH, { recursive: true });
    }
}

/**
 * Get the file path for a draft
 */
function getDraftFilePath(draftId: string): string {
    // Sanitize draftId to prevent path traversal
    const safeDraftId = draftId.replace(/[^a-z0-9-]/gi, '');
    return path.join(DRAFTS_BASE_PATH, `${safeDraftId}.json`);
}

/**
 * Save a draft to the file system
 * Overwrites existing draft with same ID
 */
export function saveDraft(draft: ValidatedDraftData): { success: boolean; draftId: string; error?: string } {
    try {
        ensureDraftsDirectory();

        const filePath = getDraftFilePath(draft.draftId);
        const content = JSON.stringify(draft, null, 2);

        // Atomic write
        const tempPath = `${filePath}.tmp`;
        fs.writeFileSync(tempPath, content, { encoding: 'utf-8' });
        fs.renameSync(tempPath, filePath);

        return { success: true, draftId: draft.draftId };
    } catch (error) {
        console.error('Failed to save draft:', error);
        return {
            success: false,
            draftId: draft.draftId,
            error: 'Failed to save draft to file system'
        };
    }
}

/**
 * Load a draft by ID
 */
export function loadDraft(draftId: string): ValidatedDraftData | null {
    try {
        const filePath = getDraftFilePath(draftId);

        if (!fs.existsSync(filePath)) {
            return null;
        }

        const content = fs.readFileSync(filePath, 'utf-8');
        return JSON.parse(content) as ValidatedDraftData;
    } catch (error) {
        console.error('Failed to load draft:', error);
        return null;
    }
}

/**
 * Delete a draft by ID (called after publishing)
 */
export function deleteDraft(draftId: string): boolean {
    try {
        const filePath = getDraftFilePath(draftId);

        if (fs.existsSync(filePath)) {
            fs.unlinkSync(filePath);
            return true;
        }
        return false;
    } catch (error) {
        console.error('Failed to delete draft:', error);
        return false;
    }
}

/**
 * Get draft history - chronological list of all saved drafts
 * Sorted by savedAt (newest first)
 */
export function getDraftHistory(): DraftHistoryEntry[] {
    try {
        ensureDraftsDirectory();

        const files = fs.readdirSync(DRAFTS_BASE_PATH);
        const jsonFiles = files.filter(f => f.endsWith('.json'));

        const entries: DraftHistoryEntry[] = [];

        for (const filename of jsonFiles) {
            const filePath = path.join(DRAFTS_BASE_PATH, filename);
            try {
                const content = fs.readFileSync(filePath, 'utf-8');
                const draft = JSON.parse(content) as ValidatedDraftData;

                entries.push({
                    draftId: draft.draftId,
                    headline: draft.headline,
                    savedAt: draft.savedAt,
                    section: draft.section,
                    contentType: draft.contentType,
                });
            } catch {
                // Skip invalid files
                console.warn(`Skipping invalid draft file: ${filename}`);
            }
        }

        // Sort by savedAt descending (newest first)
        entries.sort((a, b) => {
            return new Date(b.savedAt).getTime() - new Date(a.savedAt).getTime();
        });

        return entries;
    } catch (error) {
        console.error('Failed to get draft history:', error);
        return [];
    }
}

/**
 * Check if a draft ID exists
 */
export function draftExists(draftId: string): boolean {
    const filePath = getDraftFilePath(draftId);
    return fs.existsSync(filePath);
}
