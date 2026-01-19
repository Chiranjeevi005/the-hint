/**
 * Footer Component
 * 
 * Institutional newspaper footer - reduced height, tight spacing.
 * Four columns: About, Contact, Policy, Subscribe
 * Serious institutional tone, no decorative spacing.
 */

"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

const FOOTER_SECTIONS = [
    {
        title: "About Us",
        links: [
            { label: "Our Mission", href: "/about" },
            { label: "Editorial Standards", href: "/standards" },
            { label: "Our Team", href: "/team" },
            { label: "Careers", href: "/careers" },
        ],
    },
    {
        title: "Contact",
        links: [
            { label: "News Tips", href: "/tips" },
            { label: "Letters to Editor", href: "/letters" },
            { label: "Corrections", href: "/corrections" },
            { label: "Advertising", href: "/advertise" },
        ],
    },
    {
        title: "Policy",
        links: [
            { label: "Terms of Service", href: "/terms" },
            { label: "Privacy Policy", href: "/privacy" },
            { label: "Cookie Policy", href: "/cookies" },
            { label: "Accessibility", href: "/accessibility" },
        ],
    },
    {
        title: "Subscribe",
        links: [
            { label: "Digital Access", href: "/subscribe" },
            { label: "Newsletters", href: "/newsletters" },
            { label: "RSS Feeds", href: "/rss" },
            { label: "Mobile Apps", href: "/apps" },
        ],
    },
] as const;

export function Footer() {
    const [currentYear, setCurrentYear] = useState<number | null>(null);

    useEffect(() => {
        setCurrentYear(new Date().getFullYear());
    }, []);

    return (
        <footer className="footer-bg" role="contentinfo">
            {/* Main Footer Content - Reduced height */}
            <div className="container-editorial" style={{ padding: "1rem 1.25rem" }}>
                <div style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(4, 1fr)",
                    gap: "2rem"
                }}>
                    {FOOTER_SECTIONS.map((section) => (
                        <div key={section.title}>
                            <h2 className="footer-heading" style={{ marginBottom: "0.5rem", fontSize: "11px" }}>
                                {section.title}
                            </h2>
                            <ul style={{ listStyle: "none", margin: 0, padding: 0 }}>
                                {section.links.map((link) => (
                                    <li key={link.href}>
                                        <Link
                                            href={link.href}
                                            className="footer-link"
                                            style={{ padding: "0.125rem 0", fontSize: "13px" }}
                                        >
                                            {link.label}
                                        </Link>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    ))}
                </div>
            </div>

            {/* Copyright - Tight */}
            <div
                className="container-editorial"
                style={{
                    padding: "0.5rem 1.25rem",
                    borderTop: "1px solid rgba(255,255,255,0.1)"
                }}
            >
                <p className="footer-copyright" style={{ fontSize: "11px", margin: 0 }}>
                    © {currentYear || "2026"} The Hint. All rights reserved.
                </p>
            </div>
        </footer>
    );
}
