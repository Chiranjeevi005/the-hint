/**
 * LeadStory Component
 * 
 * The dominant lead story with maximum visual prominence.
 * Following broadsheet newspaper layout:
 * 
 * ORDER:
 * a) Section label (small uppercase, muted)
 * b) Very large headline (H1)
 * c) Large editorial image below headline
 * d) Caption below image
 * e) Date centered below caption
 * 
 * This is the most prominent visual element on the page.
 * NO sidebar beside the lead.
 * 
 * NO business logic, NO imports from lib/content.
 */

import Link from "next/link";

interface LeadStoryProps {
    article: {
        id: string;
        title: string;
        subtitle: string;
        section: string;
        publishedAt: string;
        contentType: string;
    } | null;
}

export function LeadStory({ article }: LeadStoryProps) {
    if (!article) {
        return null;
    }

    const formattedDate = new Date(article.publishedAt).toLocaleDateString("en-US", {
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric",
    });

    const sectionLabel = article.section
        .replace("-", " ")
        .replace(/\b\w/g, (c) => c.toUpperCase());

    const articleUrl = `/${article.section}/${article.id}`;

    return (
        <section className="section-spacing" aria-labelledby="lead-story-heading">
            <article>
                {/* Section Label */}
                <div className="mb-3">
                    <span className="section-label">{sectionLabel}</span>
                </div>

                {/* Dominant Headline */}
                <Link href={articleUrl} className="article-link">
                    <h2 id="lead-story-heading" className="headline-xl mb-4">
                        {article.title}
                    </h2>
                </Link>

                {/* Large Editorial Image */}
                <Link href={articleUrl} className="article-link block mb-3">
                    <div
                        className="image-placeholder article-image"
                        style={{
                            aspectRatio: "16/9",
                            width: "100%",
                            maxHeight: "500px"
                        }}
                        role="img"
                        aria-label={`Illustration for: ${article.title}`}
                    >
                        <span>Editorial Image</span>
                    </div>
                </Link>

                {/* Caption / Subtitle */}
                <p className="body-text mb-3 max-w-3xl">
                    {article.subtitle}
                </p>

                {/* Date - Centered */}
                <div className="text-center">
                    <time dateTime={article.publishedAt} className="meta-text">
                        {formattedDate}
                    </time>
                    {article.contentType !== "news" && (
                        <span className="meta-text ml-3 uppercase font-medium">
                            {article.contentType}
                        </span>
                    )}
                </div>
            </article>

            {/* Section Divider */}
            <hr className="section-divider mt-8" />
        </section>
    );
}
