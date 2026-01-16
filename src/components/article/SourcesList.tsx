/**
 * SourcesList Component
 * 
 * Renders the list of sources/citations for the article.
 * Provides transparency about information origins.
 * 
 * NO business logic, NO imports from lib/content.
 */

interface SourcesListProps {
    sources: string[];
}

export function SourcesList({ sources }: SourcesListProps) {
    if (sources.length === 0) {
        return null;
    }

    return (
        <aside className="border-t border-current pt-8 mb-12">
            <h2 className="text-lg font-bold mb-4">Sources</h2>
            <ul className="list-none space-y-2">
                {sources.map((source, index) => (
                    <li key={index} className="text-base">
                        {source}
                    </li>
                ))}
            </ul>
        </aside>
    );
}
