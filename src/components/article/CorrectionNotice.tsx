/**
 * CorrectionNotice Component
 * 
 * Renders a correction or update notice for articles that have been modified.
 * Only displays when an update date is provided.
 * 
 * NO business logic, NO imports from lib/content.
 */

interface CorrectionNoticeProps {
    updatedAt: string | null;
    correctionText?: string;
}

export function CorrectionNotice({ updatedAt, correctionText }: CorrectionNoticeProps) {
    if (!updatedAt) {
        return null;
    }

    const formattedDate = new Date(updatedAt).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
    });

    return (
        <aside className="border border-current p-6 mb-12">
            <h2 className="text-base font-bold uppercase tracking-wide mb-2">
                Correction
            </h2>
            <p className="text-base mb-2">
                <span className="font-semibold">Updated:</span> {formattedDate}
            </p>
            {correctionText && (
                <p className="text-base">{correctionText}</p>
            )}
            {!correctionText && (
                <p className="text-base">
                    This article has been updated since its original publication.
                </p>
            )}
        </aside>
    );
}
