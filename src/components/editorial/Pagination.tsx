/**
 * Pagination Component
 * 
 * Static pagination placeholder for section pages.
 * Pagination logic NOT implemented yet.
 * 
 * NO business logic, NO imports from lib/content.
 */

interface PaginationProps {
    /** Total number of articles (for display only) */
    totalArticles: number;
}

export function Pagination({ totalArticles }: PaginationProps) {
    // Don't render if no articles
    if (totalArticles === 0) {
        return null;
    }

    return (
        <nav
            className="border-t border-neutral-200 pt-8 mt-8"
            aria-label="Pagination"
        >
            <div className="flex items-center justify-between">
                {/* Article Count */}
                <p className="text-sm">
                    Showing {totalArticles} {totalArticles === 1 ? 'article' : 'articles'}
                </p>

                {/* Placeholder Navigation */}
                <div className="flex items-center gap-4">
                    {/* Previous (disabled placeholder) */}
                    <span
                        className="text-sm font-medium cursor-not-allowed opacity-40"
                        aria-disabled="true"
                    >
                        ← Previous
                    </span>

                    {/* Page indicator placeholder */}
                    <span className="text-sm">
                        Page 1
                    </span>

                    {/* Next (disabled placeholder) */}
                    <span
                        className="text-sm font-medium cursor-not-allowed opacity-40"
                        aria-disabled="true"
                    >
                        Next →
                    </span>
                </div>
            </div>
        </nav>
    );
}
