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
        <header className="mb-12 border-b-2 border-black pb-6">
            {/* Section Title */}
            <h1 className="text-4xl font-bold uppercase tracking-tight mb-3">
                {name}
            </h1>

            {/* Section Description */}
            <p className="text-lg leading-relaxed max-w-2xl">
                {description}
            </p>
        </header>
    );
}
