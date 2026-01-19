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

    useEffect(() => {
        const formatted = new Date().toLocaleDateString("en-US", {
            weekday: "long",
            year: "numeric",
            month: "long",
            day: "numeric",
        });
        setCurrentDate(formatted);
    }, []);

    return (
        <header role="banner">
            {/* Skip Link for Accessibility */}
            <a href="#main-content" className="skip-link">
                Skip to main content
            </a>

            {/* Masthead */}
            <div className="container-editorial">
                {/* Date Line */}
                <div style={{ padding: "0.375rem 0", textAlign: "center", minHeight: "20px" }}>
                    {currentDate && (
                        <time className="meta-text" dateTime={new Date().toISOString().split("T")[0]}>
                            {currentDate}
                        </time>
                    )}
                </div>

                {/* Publication Name - Larger for authority */}
                <div style={{ padding: "1rem 0 0.75rem", textAlign: "center" }}>
                    <Link href="/" style={{ textDecoration: "none", display: "inline-block" }}>
                        <h1 className="masthead-title">The Hint</h1>
                    </Link>
                </div>

                {/* Horizontal Rule - Stronger contrast */}
                <hr style={{ border: "none", borderTop: "1px solid #BEBEBE", margin: 0 }} />

                {/* Primary Navigation - Tighter */}
                <nav aria-label="Primary navigation" style={{ padding: "0.5rem 0" }}>
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
                <hr className="section-divider-thick" />
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
