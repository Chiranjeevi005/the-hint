/**
 * SectionBlock Component
 * 
 * Renders a section block with its articles.
 * Receives fully prepared section data via props.
 * 
 * NO business logic, NO imports from lib/content.
 */

interface SectionArticle {
    id: string;
    title: string;
    subtitle: string;
    publishedAt: string;
    contentType: string;
}

interface SectionBlockProps {
    /** Display name for the section header */
    sectionTitle: string;
    articles: SectionArticle[];
}

export function SectionBlock({ sectionTitle, articles }: SectionBlockProps) {
    if (articles.length === 0) {
        return null;
    }

    return (
        <section className="mb-14">
            {/* Section Header */}
            <h2 className="text-lg font-bold uppercase tracking-wide border-b-2 border-black pb-2 mb-6">
                {sectionTitle}
            </h2>

            <div className="grid gap-6 md:grid-cols-3">
                {articles.map((article, index) => (
                    <article
                        key={article.id}
                        className={`pb-4 ${index < articles.length - 1 ? 'border-b border-neutral-200 md:border-b-0' : ''
                            }`}
                    >
                        {/* Headline */}
                        <h3 className="text-xl font-bold leading-tight mb-2">
                            {article.title}
                        </h3>

                        {/* Subtitle */}
                        <p className="text-sm leading-relaxed mb-2">
                            {article.subtitle}
                        </p>

                        {/* Metadata Row */}
                        <div className="flex items-center gap-3 text-xs">
                            <time dateTime={article.publishedAt}>
                                {new Date(article.publishedAt).toLocaleDateString('en-US', {
                                    month: 'short',
                                    day: 'numeric',
                                })}
                            </time>
                            {article.contentType === 'opinion' && (
                                <span className="font-semibold uppercase">
                                    Opinion
                                </span>
                            )}
                            {article.contentType === 'analysis' && (
                                <span className="font-semibold uppercase">
                                    Analysis
                                </span>
                            )}
                        </div>
                    </article>
                ))}
            </div>
        </section>
    );
}
