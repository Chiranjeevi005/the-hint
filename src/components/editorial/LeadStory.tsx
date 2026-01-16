/**
 * LeadStory Component
 * 
 * Renders the dominant lead story with maximum visual prominence.
 * Receives fully prepared article data via props.
 * 
 * NO business logic, NO imports from lib/content.
 */

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

    const formattedDate = new Date(article.publishedAt).toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
    });

    const sectionLabel = article.section
        .replace('-', ' ')
        .replace(/\b\w/g, (c) => c.toUpperCase());

    return (
        <section className="mb-16">
            <article className="border-b-4 border-black pb-8">
                {/* Section Label */}
                <div className="mb-4">
                    <span className="text-sm font-bold uppercase tracking-widest">
                        {sectionLabel}
                    </span>
                </div>

                {/* Dominant Headline */}
                <h1 className="text-5xl font-black leading-tight mb-6 max-w-4xl md:text-6xl lg:text-7xl">
                    {article.title}
                </h1>

                {/* Subtitle / Deck */}
                <p className="text-xl leading-relaxed mb-6 max-w-3xl md:text-2xl">
                    {article.subtitle}
                </p>

                {/* Metadata */}
                <div className="flex flex-wrap items-center gap-4 text-sm">
                    <time dateTime={article.publishedAt}>
                        {formattedDate}
                    </time>
                    {article.contentType !== 'news' && (
                        <span className="font-semibold uppercase tracking-wide">
                            {article.contentType}
                        </span>
                    )}
                </div>
            </article>
        </section>
    );
}
