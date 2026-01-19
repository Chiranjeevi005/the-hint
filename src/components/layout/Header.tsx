/**
 * Header / Masthead Component
 * 
 * Classic broadsheet newspaper masthead with:
 * - Centered publication name "THE HINT"
 * - Date line
 * - Primary navigation
 * - Headline ticker band below navigation
 * 
 * NO icons, NO background fills, NO decorative elements
 */

"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

const NAVIGATION_ITEMS = [
    { label: "Home", href: "/" },
    { label: "Politics", href: "/politics" },
    { label: "World", href: "/world-affairs" },
    { label: "Crime", href: "/crime" },
    { label: "Court", href: "/court" },
    { label: "Opinion", href: "/opinion" },
] as const;

// Top headlines for the ticker
const TICKER_HEADLINES = [
    "Government Announces Major Infrastructure Investment",
    "Supreme Court Hears Arguments on Digital Privacy Rights",
    "G20 Leaders Forge Historic Trade Agreement",
    "Multi-State Drug Trafficking Network Dismantled",
    "Senate Passes Landmark Election Reform Bill",
    "Climate Resilience Act Gains Momentum",
] as const;

export function Header() {
    const [currentDate, setCurrentDate] = useState<string>("");
    const [isMenuOpen, setIsMenuOpen] = useState(false);

    useEffect(() => {
        const formatted = new Date().toLocaleDateString("en-US", {
            weekday: "long",
            year: "numeric",
            month: "long",
            day: "numeric",
        });
        setCurrentDate(formatted);
    }, []);

    // Lock body scroll when menu is open
    useEffect(() => {
        if (isMenuOpen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = 'unset';
        }
        return () => { document.body.style.overflow = 'unset'; };
    }, [isMenuOpen]);

    return (
        <header role="banner" className="sticky top-0 z-50 bg-[#F7F6F2]">
            {/* Skip Link for Accessibility */}
            <a href="#main-content" className="skip-link">
                Skip to main content
            </a>

            {/* Mobile Menu 'News Index' Drawer */}
            <div className={`md:hidden ${isMenuOpen ? 'pointer-events-auto' : 'pointer-events-none'}`}>
                {/* Transparent Backdrop for clicking outside */}
                <div
                    className="fixed inset-0 z-30 bg-transparent"
                    onClick={() => setIsMenuOpen(false)}
                    aria-hidden="true"
                />

                {/* Vertical Rail Menu (Behind Header, Above Content) */}
                <div
                    className={`fixed inset-y-0 left-0 z-40 w-[40vw] min-w-[160px] bg-[#F7F6F2] border-r border-[#111111] pt-24 pb-8 flex flex-col transform transition-transform duration-300 ease-out ${isMenuOpen ? 'translate-x-0' : '-translate-x-full'
                        }`}
                >
                    {/* Rail Header */}
                    <div className="px-4 pb-4 border-b border-[#111111] mb-2">
                        <span className="text-[10px] font-sans font-bold uppercase tracking-[0.2em] text-[#8A8A8A]">Sections</span>
                    </div>

                    {/* Navigation Links */}
                    <nav className="flex-1 overflow-y-auto px-0">
                        {NAVIGATION_ITEMS.map((item) => (
                            <Link
                                key={item.href}
                                href={item.href}
                                className="block px-4 py-3 border-b border-[#E5E5E5] font-serif text-lg font-medium text-[#111111] hover:text-[#6B6B6B] transition-colors leading-tight"
                                onClick={() => setIsMenuOpen(false)}
                            >
                                {item.label}
                            </Link>
                        ))}
                    </nav>

                    {/* Rail Footer */}
                    <div className="p-4 mt-auto">
                        <p className="text-[10px] font-sans text-[#6B6B6B] uppercase tracking-widest leading-relaxed">
                            {currentDate}
                        </p>
                    </div>
                </div>
            </div>

            {/* Masthead */}
            <div className="container-editorial relative z-50 bg-[#F7F6F2]">
                {/* Mobile Header Top Row */}
                <div className="md:hidden flex justify-between items-center py-4 border-b border-[#D9D9D9]">
                    <button
                        onClick={() => setIsMenuOpen(!isMenuOpen)}
                        className={`p-2 -ml-2 transition-colors duration-200 ${isMenuOpen ? 'text-[#8A8A8A]' : 'text-[#111111]'}`}
                        aria-label="Open menu"
                    >
                        <div className="w-6 h-px bg-[#111111] mb-1.5"></div>
                        <div className="w-6 h-px bg-[#111111] mb-1.5"></div>
                        <div className="w-6 h-px bg-[#111111]"></div>
                    </button>

                    <Link href="/" className="no-underline">
                        <h1 className="font-serif text-2xl font-black tracking-tight text-[#111111] leading-none">THE HINT</h1>
                    </Link>

                    <div className="w-5"></div> {/* Spacer for center alignment */}
                </div>

                {/* Desktop Date Line */}
                <div className="hidden md:block" style={{ padding: "0.375rem 0", textAlign: "center", minHeight: "20px" }}>
                    {currentDate && (
                        <time className="meta-text" dateTime={new Date().toISOString().split("T")[0]}>
                            {currentDate}
                        </time>
                    )}
                </div>

                {/* Desktop Publication Name */}
                <div className="hidden md:block" style={{ padding: "1rem 0 0.75rem", textAlign: "center" }}>
                    <Link href="/" style={{ textDecoration: "none", display: "inline-block" }}>
                        <h1 className="masthead-title">The Hint</h1>
                    </Link>
                </div>

                {/* Desktop Horizontal Rule */}
                <hr className="hidden md:block" style={{ border: "none", borderTop: "1px solid #BEBEBE", margin: 0 }} />

                {/* Desktop Primary Navigation */}
                <nav aria-label="Primary navigation" className="hidden md:block" style={{ padding: "0.5rem 0" }}>
                    <ul style={{
                        display: "flex",
                        flexWrap: "wrap",
                        alignItems: "center",
                        justifyContent: "center",
                        gap: "1.25rem",
                        listStyle: "none",
                        margin: 0,
                        padding: 0
                    }}>
                        {NAVIGATION_ITEMS.map((item) => (
                            <li key={item.href}>
                                <Link href={item.href} className="nav-link">
                                    {item.label}
                                </Link>
                            </li>
                        ))}
                    </ul>
                </nav>

                {/* Bottom Rule - Thick */}
                <hr className="section-divider-thick md:block hidden" />
            </div>

            {/* Headline Ticker Band */}
            <div className="headline-ticker">
                <div className="container-editorial" style={{ overflow: "hidden" }}>
                    <div className="ticker-container">
                        {/* Duplicate headlines for seamless scroll */}
                        {[...TICKER_HEADLINES, ...TICKER_HEADLINES].map((headline, index) => (
                            <span key={index} className="ticker-item">
                                {headline}
                            </span>
                        ))}
                    </div>
                </div>
            </div>
        </header>
    );
}
