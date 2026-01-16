/**
 * ArticleHeader Component
 * 
 * Renders the article headline, subtitle, and section label.
 * Optimized for long-form reading with maximum typographic prominence.
 * 
 * NO business logic, NO imports from lib/content.
 */

interface ArticleHeaderProps {
    title: string;
    subtitle: string;
    sectionLabel: string;
    contentTypeLabel?: string;
}

export function ArticleHeader({
    title,
    subtitle,
    sectionLabel,
    contentTypeLabel,
}: ArticleHeaderProps) {
    return (
        <header className="mb-12">
            {/* Section and Content Type Labels */}
            <div className="mb-6 flex items-center gap-4">
                <span className="text-sm font-bold uppercase tracking-widest">
                    {sectionLabel}
                </span>
                {contentTypeLabel && contentTypeLabel !== 'news' && (
                    <span className="text-sm font-semibold uppercase tracking-wide border-l border-current pl-4">
                        {contentTypeLabel}
                    </span>
                )}
            </div>

            {/* Main Headline */}
            <h1 className="text-4xl font-black leading-tight mb-6 max-w-4xl md:text-5xl lg:text-6xl">
                {title}
            </h1>

            {/* Subtitle / Deck */}
            <p className="text-xl leading-relaxed max-w-3xl md:text-2xl">
                {subtitle}
            </p>
        </header>
    );
}
