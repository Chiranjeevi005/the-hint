/**
 * TopStories Component
 * 
 * Renders the secondary tier of stories below the lead.
 * Receives fully prepared article data via props.
 * 
 * NO business logic, NO imports from lib/content.
 */

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

    return (
        <section className="mb-16">
            <h2 className="text-xl font-bold uppercase tracking-wide border-b-2 border-black pb-2 mb-8">
                Top Stories
            </h2>

            <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
                {articles.map((article, index) => {
                    const sectionLabel = article.section
                        .replace('-', ' ')
                        .replace(/\b\w/g, (c) => c.toUpperCase());

                    return (
                        <article
                            key={article.id}
                            className={`border-b border-neutral-300 pb-6 ${index === 0 ? 'md:col-span-2 lg:col-span-1' : ''
                                }`}
                        >
                            {/* Section Label */}
                            <div className="mb-2">
                                <span className="text-xs font-bold uppercase tracking-widest">
                                    {sectionLabel}
                                </span>
                            </div>

                            {/* Headline */}
                            <h3 className="text-2xl font-bold leading-tight mb-3">
                                {article.title}
                            </h3>

                            {/* Subtitle */}
                            <p className="text-base leading-relaxed mb-3">
                                {article.subtitle}
                            </p>

                            {/* Timestamp */}
                            <time
                                dateTime={article.publishedAt}
                                className="text-sm"
                            >
                                {new Date(article.publishedAt).toLocaleDateString('en-US', {
                                    month: 'short',
                                    day: 'numeric',
                                })}
                            </time>
                        </article>
                    );
                })}
            </div>
        </section>
    );
}
