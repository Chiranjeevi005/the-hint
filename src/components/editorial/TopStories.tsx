/**
 * TopStories Component
 * 
 * Secondary lead stories below the main lead.
 * Two stories side-by-side layout:
 * - Large image on top
 * - Bold headline
 * - Short summary
 * - Date
 * 
 * Clearly secondary to the main lead.
 * 
 * NO business logic, NO imports from lib/content.
 */

import Link from "next/link";

interface TopStoryArticle {
    id: string;
    title: string;
    subtitle: string;
    section: string;
    publishedAt: string;
    contentType: string;
}

interface TopStoriesProps {
    articles: TopStoryArticle[];
}

export function TopStories({ articles }: TopStoriesProps) {
    if (articles.length === 0) {
        return null;
    }

    // Take first 2 for secondary leads
    const secondaryLeads = articles.slice(0, 2);

    return (
        <section className="section-spacing" aria-labelledby="top-stories-heading">
            {/* Section Header */}
            <div className="section-header">
                <h2 id="top-stories-heading" className="section-title">
                    Top Stories
                </h2>
                <div className="section-line" aria-hidden="true" />
            </div>

            {/* Two-Column Layout for Secondary Leads */}
            <div className="grid gap-6 md:grid-cols-2">
                {secondaryLeads.map((article) => {
                    const articleUrl = `/${article.section}/${article.id}`;
                    const formattedDate = new Date(article.publishedAt).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                    });

                    return (
                        <article key={article.id} className="pb-6">
                            {/* Large Image on Top */}
                            <Link href={articleUrl} className="article-link block mb-4">
                                <div
                                    className="image-placeholder article-image"
                                    style={{
                                        aspectRatio: "16/10",
                                        width: "100%",
                                    }}
                                    role="img"
                                    aria-label={`Illustration for: ${article.title}`}
                                >
                                    <span>Editorial Image</span>
                                </div>
                            </Link>

                            {/* Bold Headline */}
                            <Link href={articleUrl} className="article-link">
                                <h3 className="headline-lg mb-3">
                                    {article.title}
                                </h3>
                            </Link>

                            {/* Short Summary */}
                            <p className="body-text mb-3 line-clamp-2">
                                {article.subtitle}
                            </p>

                            {/* Date */}
                            <time dateTime={article.publishedAt} className="meta-text">
                                {formattedDate}
                            </time>
                        </article>
                    );
                })}
            </div>

            {/* Section Divider */}
            <hr className="section-divider mt-4" />
        </section>
    );
}
