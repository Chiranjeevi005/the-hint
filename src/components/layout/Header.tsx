/**
 * Header / Masthead Component
 * 
 * Classic broadsheet newspaper masthead with:
 * - Centered publication name "THE HINT"
 * - Date line (client-side rendered to avoid hydration issues)
 * - Primary navigation below
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

export function Header() {
    // Avoid hydration mismatch by rendering date only on client
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
                <div className="py-2 text-center" style={{ minHeight: "24px" }}>
                    {currentDate && (
                        <time className="meta-text" dateTime={new Date().toISOString().split("T")[0]}>
                            {currentDate}
                        </time>
                    )}
                </div>

                {/* Publication Name */}
                <div className="py-6 text-center">
                    <Link href="/" className="inline-block" style={{ textDecoration: "none" }}>
                        <h1 className="masthead-title">The Hint</h1>
                    </Link>
                </div>

                {/* Horizontal Rule */}
                <hr className="section-divider" />

                {/* Primary Navigation */}
                <nav aria-label="Primary navigation" className="py-3">
                    <ul className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2" style={{ listStyle: "none", margin: 0, padding: 0 }}>
                        {NAVIGATION_ITEMS.map((item) => (
                            <li key={item.href}>
                                <Link href={item.href} className="nav-link">
                                    {item.label}
                                </Link>
                            </li>
                        ))}
                    </ul>
                </nav>

                {/* Bottom Rule */}
                <hr className="section-divider-thick" />
            </div>
        </header>
    );
}
