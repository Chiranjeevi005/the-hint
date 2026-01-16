/**
 * ArticleMeta Component
 * 
 * Renders publication date, update date, and tags.
 * Provides clear temporal context for the article.
 * 
 * NO business logic, NO imports from lib/content.
 */

interface ArticleMetaProps {
    publishedAt: string;
    updatedAt: string | null;
    tags: string[];
}

export function ArticleMeta({ publishedAt, updatedAt, tags }: ArticleMetaProps) {
    const formattedPublished = new Date(publishedAt).toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
    });

    const formattedTime = new Date(publishedAt).toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: '2-digit',
        hour12: true,
    });

    const formattedUpdated = updatedAt
        ? new Date(updatedAt).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: 'numeric',
            minute: '2-digit',
            hour12: true,
        })
        : null;

    return (
        <div className="border-t border-b border-current py-6 mb-12">
            {/* Publication Date */}
            <div className="mb-4">
                <time dateTime={publishedAt} className="text-base">
                    <span className="font-semibold">Published:</span>{' '}
                    {formattedPublished} at {formattedTime}
                </time>
            </div>

            {/* Updated Date */}
            {formattedUpdated && (
                <div className="mb-4">
                    <time dateTime={updatedAt!} className="text-base">
                        <span className="font-semibold">Updated:</span>{' '}
                        {formattedUpdated}
                    </time>
                </div>
            )}

            {/* Tags */}
            {tags.length > 0 && (
                <div className="flex flex-wrap items-center gap-2">
                    <span className="text-sm font-semibold">Topics:</span>
                    {tags.map((tag) => (
                        <span
                            key={tag}
                            className="text-sm px-2 py-1 border border-current"
                        >
                            {tag}
                        </span>
                    ))}
                </div>
            )}
        </div>
    );
}
