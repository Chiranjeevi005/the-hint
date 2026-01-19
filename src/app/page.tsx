/**
 * Homepage
 * 
 * The Hint - A Classic Broadsheet Newspaper Homepage
 * 
 * LAYOUT STRUCTURE:
 * 1. TOP MASTHEAD - Centered "THE HINT" with navigation
 * 2. LEAD STORY - Full-width dominant story
 * 3. SECONDARY LEADS (Left) + RIGHT RAIL (Crime/Court)
 * 4. MID-PAGE: Politics (Left) + World Affairs (Right)
 * 5. OPINION & ANALYSIS - Four columns
 * 6. FOOTER - Institutional dark footer
 * 
 * All editorial selection logic is handled by getHomepageData().
 * This component only handles rendering and layout.
 */

import { getHomepageData } from "@/lib/content/homepage";
import { LeadStory, TopStories, SectionBlock } from "@/components/editorial";
import { Header, Footer } from "@/components/layout";

export default function HomePage() {
  // Get all homepage data in a single call
  const { leadStory, topStories, sections } = getHomepageData();

  return (
    <div className="min-h-screen flex flex-col">
      {/* 1. TOP MASTHEAD */}
      <Header />

      {/* Main Content */}
      <main id="main-content" className="flex-1">
        <div className="container-editorial py-8">

          {/* 2. LEAD STORY - Full Width, Maximum Prominence */}
          <LeadStory article={leadStory} />

          {/* 3. SECONDARY LEADS + RIGHT RAIL */}
          <div className="grid-12 section-spacing">
            {/* Left: Secondary Lead Stories (8 columns on desktop) */}
            <div className="col-span-full md:col-span-8">
              <TopStories articles={topStories} />
            </div>

            {/* Right Rail: Crime & Court (4 columns on desktop) */}
            <aside className="col-span-full md:col-span-4" aria-label="Breaking news">
              {/* Crime Section - Wire Style */}
              <SectionBlock
                sectionTitle="Crime"
                articles={sections.crime}
              />

              {/* Court Section - Wire Style */}
              <SectionBlock
                sectionTitle="Court"
                articles={sections.court}
              />
            </aside>
          </div>

          {/* 4. MID-PAGE SECTIONS */}
          <div className="grid-12 section-spacing">
            {/* Left: Politics - Vertical List */}
            <div className="col-span-full md:col-span-6">
              <SectionBlock
                sectionTitle="Politics"
                articles={sections.politics}
              />
            </div>

            {/* Right: World Affairs - Two Column Image-Led */}
            <div className="col-span-full md:col-span-6">
              <SectionBlock
                sectionTitle="World Affairs"
                articles={sections.worldAffairs}
              />
            </div>
          </div>

          {/* 5. OPINION & ANALYSIS - Four Columns */}
          <SectionBlock
            sectionTitle="Opinion & Analysis"
            articles={sections.opinion}
          />

        </div>
      </main>

      {/* 6. FOOTER */}
      <Footer />
    </div>
  );
}
