/**
 * StoryList Component
 * 
 * Renders a list of stories for section pages.
 * Receives fully prepared article data via props.
 * 
 * NO business logic, NO imports from lib/content.
 */

interface StoryListArticle {
    id: string;
    title: string;
    subtitle: string;
    publishedAt: string;
    contentType: string;
    section: string;
}

interface StoryListProps {
    /** Array of articles to display */
    articles: StoryListArticle[];
}

export function StoryList({ articles }: StoryListProps) {
    if (articles.length === 0) {
        return (
            <div className="py-12 text-center">
                <p className="text-lg">
                    No stories available in this section.
                </p>
            </div>
        );
    }

    return (
        <div className="mb-12">
            {/* Story Grid */}
            <div className="space-y-0">
                {articles.map((article, index) => (
                    <article
                        key={article.id}
                        className={`py-6 ${index < articles.length - 1
                                ? 'border-b border-neutral-200'
                                : ''
                            }`}
                    >
                        {/* Two-column layout: content + metadata */}
                        <div className="grid md:grid-cols-12 gap-4">
                            {/* Main Content */}
                            <div className="md:col-span-9">
                                {/* Headline */}
                                <h2 className="text-2xl font-bold leading-tight mb-2">
                                    {article.title}
                                </h2>

                                {/* Subtitle */}
                                <p className="text-base leading-relaxed">
                                    {article.subtitle}
                                </p>
                            </div>

                            {/* Metadata Column */}
                            <div className="md:col-span-3 md:text-right">
                                <div className="flex md:flex-col items-center md:items-end gap-2">
                                    {/* Publication Date */}
                                    <time
                                        dateTime={article.publishedAt}
                                        className="text-sm"
                                    >
                                        {new Date(article.publishedAt).toLocaleDateString('en-US', {
                                            month: 'long',
                                            day: 'numeric',
                                            year: 'numeric',
                                        })}
                                    </time>

                                    {/* Content Type Badge */}
                                    {article.contentType !== 'news' && (
                                        <span className="text-xs font-bold uppercase tracking-wide">
                                            {article.contentType}
                                        </span>
                                    )}
                                </div>
                            </div>
                        </div>
                    </article>
                ))}
            </div>
        </div>
    );
}
