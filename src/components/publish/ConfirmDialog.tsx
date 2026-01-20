'use client';

/**
 * Confirm Dialog Component
 * Custom styled confirmation modal for delete and other destructive actions
 */

import { useEffect, useRef } from 'react';
import styles from './ConfirmDialog.module.css';

interface ConfirmDialogProps {
    /** Whether the dialog is open */
    isOpen: boolean;
    /** Dialog title */
    title: string;
    /** Dialog message (can include article title) */
    message: string;
    /** Confirm button text */
    confirmText?: string;
    /** Cancel button text */
    cancelText?: string;
    /** Whether this is a destructive action (styles confirm button red) */
    isDestructive?: boolean;
    /** Handler for confirm */
    onConfirm: () => void;
    /** Handler for cancel */
    onCancel: () => void;
}

export function ConfirmDialog({
    isOpen,
    title,
    message,
    confirmText = 'Confirm',
    cancelText = 'Cancel',
    isDestructive = false,
    onConfirm,
    onCancel,
}: ConfirmDialogProps) {
    const dialogRef = useRef<HTMLDivElement>(null);
    const confirmBtnRef = useRef<HTMLButtonElement>(null);

    // Focus management and keyboard handling
    useEffect(() => {
        if (isOpen) {
            // Focus the cancel button by default for safety
            confirmBtnRef.current?.focus();

            // Handle escape key
            const handleKeyDown = (e: KeyboardEvent) => {
                if (e.key === 'Escape') {
                    onCancel();
                }
            };

            document.addEventListener('keydown', handleKeyDown);
            return () => document.removeEventListener('keydown', handleKeyDown);
        }
    }, [isOpen, onCancel]);

    // Prevent body scroll when dialog is open
    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = 'hidden';
            return () => {
                document.body.style.overflow = '';
            };
        }
    }, [isOpen]);

    if (!isOpen) return null;

    return (
        <div className={styles.overlay} onClick={onCancel}>
            <div
                ref={dialogRef}
                className={styles.dialog}
                onClick={(e) => e.stopPropagation()}
                role="alertdialog"
                aria-modal="true"
                aria-labelledby="confirm-title"
                aria-describedby="confirm-message"
            >
                <h2 id="confirm-title" className={styles.title}>{title}</h2>
                <p id="confirm-message" className={styles.message}>{message}</p>

                <div className={styles.actions}>
                    <button
                        type="button"
                        className={styles.cancelBtn}
                        onClick={onCancel}
                    >
                        {cancelText}
                    </button>
                    <button
                        ref={confirmBtnRef}
                        type="button"
                        className={`${styles.confirmBtn} ${isDestructive ? styles.destructive : ''}`}
                        onClick={onConfirm}
                    >
                        {confirmText}
                    </button>
                </div>
            </div>
        </div>
    );
}
