/**
 * SectionBlock Component
 * 
 * Renders section blocks with different layouts based on section type:
 * 
 * CRIME & COURT (Right Rail Style):
 * - Small thumbnail on left
 * - Headline + short blurb on right
 * - Dense, wire-style, information-first
 * 
 * POLITICS (Left Column):
 * - Vertical list
 * - Small image on left
 * - Headline on right
 * - Compact, policy-driven tone
 * 
 * WORLD AFFAIRS:
 * - Two-column layout
 * - Image-led stories
 * - Headline + short summary
 * - More breathing room
 * 
 * OPINION & ANALYSIS:
 * - Four equal-width columns
 * - Avatar headshot
 * - Headline
 * - Byline below
 * - Never competes with hard news visually
 * 
 * NO business logic, NO imports from lib/content.
 */

import Link from "next/link";

interface SectionArticle {
    id: string;
    title: string;
    subtitle: string;
    section?: string;
    publishedAt: string;
    contentType: string;
}

interface SectionBlockProps {
    sectionTitle: string;
    articles: SectionArticle[];
}

// Wire-style layout for Crime and Court (right rail style)
function WireStyleLayout({ articles, sectionSlug }: { articles: SectionArticle[]; sectionSlug: string }) {
    return (
        <div className="space-y-0">
            {articles.map((article) => {
                const articleUrl = `/${sectionSlug}/${article.id}`;

                return (
                    <Link key={article.id} href={articleUrl} className="article-link">
                        <div className="wire-item">
                            {/* Small Thumbnail */}
                            <div
                                className="wire-thumbnail image-placeholder"
                                role="img"
                                aria-label={`Thumbnail for: ${article.title}`}
                            >
                                <span style={{ fontSize: "8px" }}>IMG</span>
                            </div>

                            {/* Content */}
                            <div className="wire-content">
                                <h3 className="headline-sm mb-1 leading-tight">
                                    {article.title}
                                </h3>
                                <p className="caption-text line-clamp-2">
                                    {article.subtitle}
                                </p>
                            </div>
                        </div>
                    </Link>
                );
            })}
        </div>
    );
}

// Vertical list for Politics
function PoliticsLayout({ articles, sectionSlug }: { articles: SectionArticle[]; sectionSlug: string }) {
    return (
        <div className="space-y-4">
            {articles.map((article) => {
                const articleUrl = `/${sectionSlug}/${article.id}`;
                const formattedDate = new Date(article.publishedAt).toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                });

                return (
                    <Link key={article.id} href={articleUrl} className="article-link">
                        <div className="flex gap-4 pb-4 border-b border-[var(--color-border)] last:border-0">
                            {/* Small Image on Left */}
                            <div
                                className="image-placeholder flex-shrink-0"
                                style={{ width: "100px", height: "70px" }}
                                role="img"
                                aria-label={`Thumbnail for: ${article.title}`}
                            >
                                <span style={{ fontSize: "9px" }}>IMG</span>
                            </div>

                            {/* Content */}
                            <div className="flex-1 min-w-0">
                                <h3 className="headline-md mb-1">
                                    {article.title}
                                </h3>
                                <time dateTime={article.publishedAt} className="meta-text">
                                    {formattedDate}
                                </time>
                            </div>
                        </div>
                    </Link>
                );
            })}
        </div>
    );
}

// Two-column image-led layout for World Affairs
function WorldAffairsLayout({ articles, sectionSlug }: { articles: SectionArticle[]; sectionSlug: string }) {
    return (
        <div className="grid gap-6 md:grid-cols-2">
            {articles.map((article) => {
                const articleUrl = `/${sectionSlug}/${article.id}`;
                const formattedDate = new Date(article.publishedAt).toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                });

                return (
                    <Link key={article.id} href={articleUrl} className="article-link">
                        <article className="pb-4">
                            {/* Image-led */}
                            <div
                                className="image-placeholder article-image mb-3"
                                style={{ aspectRatio: "16/10", width: "100%" }}
                                role="img"
                                aria-label={`Illustration for: ${article.title}`}
                            >
                                <span>Editorial Image</span>
                            </div>

                            {/* Headline */}
                            <h3 className="headline-md mb-2">
                                {article.title}
                            </h3>

                            {/* Short Summary */}
                            <p className="caption-text mb-2 line-clamp-2">
                                {article.subtitle}
                            </p>

                            {/* Date */}
                            <time dateTime={article.publishedAt} className="meta-text">
                                {formattedDate}
                            </time>
                        </article>
                    </Link>
                );
            })}
        </div>
    );
}

// Four-column Opinion layout with avatars
function OpinionLayout({ articles, sectionSlug }: { articles: SectionArticle[]; sectionSlug: string }) {
    return (
        <div className="grid gap-6 grid-cols-2 md:grid-cols-4">
            {articles.map((article) => {
                const articleUrl = `/${sectionSlug}/${article.id}`;
                // Extract author from subtitle or use placeholder
                const authorName = article.subtitle.split("—")[0]?.trim() || "The Hint Editorial";

                return (
                    <Link key={article.id} href={articleUrl} className="article-link">
                        <article className="text-center pb-4">
                            {/* Author Headshot (Avatar) */}
                            <div
                                className="opinion-avatar mx-auto mb-3 image-placeholder"
                                role="img"
                                aria-label={`Photo of ${authorName}`}
                                style={{ width: "56px", height: "56px", borderRadius: "50%" }}
                            >
                                <span style={{ fontSize: "8px" }}>👤</span>
                            </div>

                            {/* Headline */}
                            <h3 className="headline-sm mb-2 leading-tight">
                                {article.title}
                            </h3>

                            {/* Byline */}
                            <p className="byline">
                                By {authorName}
                            </p>
                        </article>
                    </Link>
                );
            })}
        </div>
    );
}

export function SectionBlock({ sectionTitle, articles }: SectionBlockProps) {
    if (articles.length === 0) {
        return null;
    }

    // Determine section slug for URLs
    const sectionSlug = sectionTitle.toLowerCase().replace(/\s+&?\s*/g, "-").replace("--", "-");

    // Map display names to actual slugs
    const slugMap: Record<string, string> = {
        "crime": "crime",
        "court": "court",
        "politics": "politics",
        "world-affairs": "world-affairs",
        "opinion-analysis": "opinion",
    };

    const actualSlug = slugMap[sectionSlug] || sectionSlug;

    // Determine layout based on section
    const isOpinion = sectionTitle.toLowerCase().includes("opinion");
    const isCrimeOrCourt = ["crime", "court"].includes(sectionSlug);
    const isPolitics = sectionSlug === "politics";
    const isWorldAffairs = sectionSlug.includes("world");

    return (
        <section className="section-spacing" aria-labelledby={`section-${sectionSlug}`}>
            {/* Section Header */}
            <div className="section-header">
                <h2 id={`section-${sectionSlug}`} className="section-title">
                    {sectionTitle}
                </h2>
                <div className="section-line" aria-hidden="true" />
            </div>

            {/* Section Content - Different layouts based on section type */}
            {isOpinion && <OpinionLayout articles={articles} sectionSlug={actualSlug} />}
            {isCrimeOrCourt && <WireStyleLayout articles={articles} sectionSlug={actualSlug} />}
            {isPolitics && <PoliticsLayout articles={articles} sectionSlug={actualSlug} />}
            {isWorldAffairs && <WorldAffairsLayout articles={articles} sectionSlug={actualSlug} />}

            {/* Section Divider */}
            <hr className="section-divider mt-6" />
        </section>
    );
}
