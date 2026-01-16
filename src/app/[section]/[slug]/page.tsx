/**
 * Article Page
 * 
 * Dynamic route for individual article pages.
 * Reads route params, calls data provider, and renders UI components.
 * 
 * NO editorial logic, NO formatting logic.
 */

import { notFound } from 'next/navigation';
import {
    getArticlePageData,
    ArticleNotFoundError,
    InvalidArticleSectionError,
    InvalidSlugError,
} from '@/lib/content/article';
import {
    ArticleHeader,
    ArticleMeta,
    ArticleBody,
    SourcesList,
    CorrectionNotice,
} from '@/components/article';

interface ArticlePageProps {
    params: Promise<{
        section: string;
        slug: string;
    }>;
}

export default async function ArticlePage({ params }: ArticlePageProps) {
    const { section, slug } = await params;

    // Fetch article data
    let articleData;
    try {
        articleData = getArticlePageData(section, slug);
    } catch (error) {
        // Handle known error cases
        if (
            error instanceof ArticleNotFoundError ||
            error instanceof InvalidArticleSectionError ||
            error instanceof InvalidSlugError
        ) {
            notFound();
        }
        // Re-throw unexpected errors
        throw error;
    }

    const { article } = articleData;

    // Prepare section label (format slug to display name)
    const sectionLabel = article.section
        .replace('-', ' ')
        .replace(/\b\w/g, (c) => c.toUpperCase());

    return (
        <main className="px-6 py-12 max-w-4xl mx-auto">
            <article>
                {/* Article Header */}
                <ArticleHeader
                    title={article.title}
                    subtitle={article.subtitle}
                    sectionLabel={sectionLabel}
                    contentTypeLabel={article.contentType}
                />

                {/* Article Metadata */}
                <ArticleMeta
                    publishedAt={article.publishedAt}
                    updatedAt={article.updatedAt}
                    tags={article.tags}
                />

                {/* Correction Notice (if updated) */}
                <CorrectionNotice updatedAt={article.updatedAt} />

                {/* Article Body */}
                <ArticleBody content={article.body} />

                {/* Sources */}
                <SourcesList sources={article.sources} />
            </article>
        </main>
    );
}
