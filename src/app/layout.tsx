/**
 * Root Layout
 * 
 * The Hint - A Broadsheet Newspaper
 * Uses Playfair Display for headlines and Inter for body text
 */

import type { Metadata } from "next";
import { Playfair_Display, Inter } from "next/font/google";
import "./globals.css";

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

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${playfairDisplay.variable} ${inter.variable}`}>
        <div className="min-h-screen flex flex-col">
          <Header />
          {children}
          <Footer />
        </div>
      </body>
    </html>
  );
}
