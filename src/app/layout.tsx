import type { Metadata } from "next";
import { Playfair_Display, Inter } from "next/font/google";
import "./globals.css";
import { getAllArticles } from "@/lib/content/reader";

// Serif font for headlines - authoritative, editorial feel
const playfairDisplay = Playfair_Display({
  variable: "--font-serif",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
});

// Sans-serif for body and UI - clean, readable
const inter = Inter({
  variable: "--font-sans",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "The Hint",
  description: "Authoritative news coverage with integrity and depth",
  keywords: ["news", "politics", "world affairs", "crime", "court", "opinion"],
  authors: [{ name: "The Hint Editorial Board" }],
  openGraph: {
    title: "The Hint",
    description: "Authoritative news coverage with integrity and depth",
    type: "website",
    siteName: "The Hint",
  },
};

import { Header, Footer } from "@/components/layout";
import { SubscribePopup } from "@/components/features/SubscribePopup";

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // Fetch articles for global UI elements (Ticker, Updated Indicator)
  const allArticles = getAllArticles();

  // Latest update timestamp (from any article)
  const latestUpdate = allArticles.length > 0 ? allArticles[0].publishedAt : undefined;

  // Ticker headlines: No opinion, max 10, latest first
  const tickerHeadlines = allArticles
    .filter(a => a.contentType !== 'opinion')
    .slice(0, 10)
    .map(a => a.title);

  return (
    <html lang="en">
      <body className={`${playfairDisplay.variable} ${inter.variable}`}>
        <div className="min-h-screen flex flex-col">
          <Header latestUpdate={latestUpdate} tickerHeadlines={tickerHeadlines} />
          {children}
          <Footer />
          <SubscribePopup />
        </div>
      </body>
    </html>
  );
}
