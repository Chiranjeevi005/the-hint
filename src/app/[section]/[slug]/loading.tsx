'use client';

import { ArticlePageSkeleton } from '@/components/skeleton';

/**
 * Article Page Loading State
 * Displays editorial skeleton while article content fetches
 */
export default function ArticleLoading() {
    return <ArticlePageSkeleton />;
}
