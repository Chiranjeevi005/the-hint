/**
 * Section Landing Page
 * 
 * Renders all articles for a given section.
 * Fetches pre-composed data from the section data provider.
 * 
 * NO filtering, sorting, or editorial logic here.
 */

import { notFound } from 'next/navigation';
import { getSectionPageData, InvalidSectionError } from '@/lib/content';
import { SectionHeader, StoryList, Pagination } from '@/components/editorial';

interface SectionPageProps {
    params: Promise<{
        section: string;
    }>;
}

export default async function SectionPage({ params }: SectionPageProps) {
    const { section: sectionSlug } = await params;

    // Fetch section data (throws InvalidSectionError for invalid sections)
    let data;
    try {
        data = getSectionPageData(sectionSlug);
    } catch (error) {
        if (error instanceof InvalidSectionError) {
            notFound();
        }
        throw error;
    }

    const { section, articles } = data;

    return (
        <main className="max-w-4xl mx-auto px-4 py-12">
            {/* Section Header */}
            <SectionHeader
                name={section.name}
                description={section.description}
            />

            {/* Article List */}
            <StoryList articles={articles} />

            {/* Pagination (static placeholder) */}
            <Pagination totalArticles={articles.length} />
        </main>
    );
}
