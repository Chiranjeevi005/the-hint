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
import { SectionHeader, StoryList, Pagination, LeadStory } from '@/components/editorial';

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

    // Handle empty section
    if (articles.length === 0) {
        return (
            <main className="max-w-4xl mx-auto px-4 py-12">
                <SectionHeader
                    name={section.name}
                    description={section.description}
                />
                <div className="py-12 text-center border-t border-neutral-300">
                    <p className="text-lg font-serif italic text-neutral-500">
                        No stories available in this section.
                    </p>
                </div>
            </main>
        );
    }

    // Split logic: First article is Lead Story, rest are List
    const leadArticle = articles[0];
    const feedArticles = articles.slice(1);

    return (
        <main className="max-w-4xl mx-auto px-4 py-12">
            {/* Section Header */}
            <SectionHeader
                name={section.name}
                description={section.description}
            />

            {/* Lead Story (Top) */}
            <LeadStory article={leadArticle} />

            {/* Separator if we have a list */}
            {feedArticles.length > 0 && (
                <hr className="my-8 border-neutral-200" />
            )}

            {/* Article List (Main Body) */}
            {feedArticles.length > 0 && (
                <StoryList
                    articles={feedArticles}
                    sectionSlug={section.slug}
                />
            )}

            {/* Pagination (static placeholder) */}
            <Pagination totalArticles={articles.length} />
        </main>
    );
}
