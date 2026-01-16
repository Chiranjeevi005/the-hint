/**
 * Homepage
 * 
 * Renders the newsroom homepage using editorial data.
 * All editorial selection logic is handled by getHomepageData().
 * This component only handles rendering and layout.
 */

import { getHomepageData } from '@/lib/content/homepage';
import { LeadStory, TopStories, SectionBlock } from '@/components/editorial';

export default function HomePage() {
  // Get all homepage data in a single call
  const { leadStory, topStories, sections } = getHomepageData();

  return (
    <main className="mx-auto max-w-6xl px-4 py-8">
      {/* Lead Story - Maximum Visual Prominence */}
      <LeadStory article={leadStory} />

      {/* Top Stories - Secondary Tier */}
      <TopStories articles={topStories} />

      {/* Section Blocks */}
      <SectionBlock
        sectionTitle="Crime"
        articles={sections.crime}
      />

      <SectionBlock
        sectionTitle="Court"
        articles={sections.court}
      />

      <SectionBlock
        sectionTitle="Politics"
        articles={sections.politics}
      />

      <SectionBlock
        sectionTitle="World Affairs"
        articles={sections.worldAffairs}
      />

      <SectionBlock
        sectionTitle="Opinion & Analysis"
        articles={sections.opinion}
      />
    </main>
  );
}
