/**
 * SectionHeader Component
 * 
 * Renders the header for a section landing page.
 * Receives fully prepared section data via props.
 * 
 * NO business logic, NO imports from lib/content.
 */

interface SectionHeaderProps {
    /** Display name for the section */
    name: string;
    /** Editorial description of the section */
    description: string;
}

export function SectionHeader({ name, description }: SectionHeaderProps) {
    return (
        <header className="mb-8 border-b border-neutral-300 pb-4">
            {/* Section Title */}
            <h1 className="text-5xl font-serif font-bold tracking-tight text-neutral-900 mb-2 uppercase">
                {name}
            </h1>

            {/* Section Description */}
            {description && (
                <p className="text-lg text-neutral-600 font-sans max-w-3xl">
                    {description}
                </p>
            )}
        </header>
    );
}
