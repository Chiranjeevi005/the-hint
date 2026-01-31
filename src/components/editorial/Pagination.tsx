/**
 * Pagination Component
 * 
 * Working pagination for section pages.
 * Uses URL-based navigation with page query parameter.
 */

import Link from 'next/link';

interface PaginationProps {
    /** Current page number (1-indexed) */
    currentPage: number;
    /** Total number of pages */
    totalPages: number;
    /** Section slug for building URLs */
    sectionSlug: string;
    /** Total number of articles */
    totalArticles: number;
    /** Articles per page */
    articlesPerPage: number;
}

export function Pagination({
    currentPage,
    totalPages,
    sectionSlug,
    totalArticles,
    articlesPerPage
}: PaginationProps) {
    // Don't render if only one page or no articles
    if (totalPages <= 1 || totalArticles === 0) {
        return null;
    }

    const hasPrevious = currentPage > 1;
    const hasNext = currentPage < totalPages;

    // Calculate article range for current page
    const startArticle = (currentPage - 1) * articlesPerPage + 1;
    const endArticle = Math.min(currentPage * articlesPerPage, totalArticles);

    return (
        <nav
            className="border-t border-neutral-200 pt-8 mt-12"
            aria-label="Pagination"
        >
            <div className="flex items-center justify-between">
                {/* Article Range */}
                <p className="text-sm text-neutral-600">
                    Showing {startArticle}–{endArticle} of {totalArticles} articles
                </p>

                {/* Navigation */}
                <div className="flex items-center gap-6">
                    {/* Previous */}
                    {hasPrevious ? (
                        <Link
                            href={currentPage === 2
                                ? `/${sectionSlug}`
                                : `/${sectionSlug}?page=${currentPage - 1}`
                            }
                            className="text-sm font-medium text-neutral-900 hover:text-neutral-600 transition-colors"
                        >
                            ← Previous
                        </Link>
                    ) : (
                        <span className="text-sm font-medium text-neutral-300 cursor-not-allowed">
                            ← Previous
                        </span>
                    )}

                    {/* Page indicator */}
                    <span className="text-sm text-neutral-500">
                        Page {currentPage} of {totalPages}
                    </span>

                    {/* Next */}
                    {hasNext ? (
                        <Link
                            href={`/${sectionSlug}?page=${currentPage + 1}`}
                            className="text-sm font-medium text-neutral-900 hover:text-neutral-600 transition-colors"
                        >
                            Next →
                        </Link>
                    ) : (
                        <span className="text-sm font-medium text-neutral-300 cursor-not-allowed">
                            Next →
                        </span>
                    )}
                </div>
            </div>
        </nav>
    );
}
