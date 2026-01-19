/**
 * Footer Component
 * 
 * Institutional newspaper footer with:
 * - Dark muted background (#5F5F5A)
 * - Four column layout: About, Contact, Policy, Subscribe
 * - Copyright line
 * 
 * Serious, institutional tone
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
    // Avoid hydration mismatch with year
    const [currentYear, setCurrentYear] = useState<number | null>(null);

    useEffect(() => {
        setCurrentYear(new Date().getFullYear());
    }, []);

    return (
        <footer className="footer-bg" role="contentinfo">
            {/* Main Footer Content */}
            <div className="container-editorial py-12">
                <div className="grid grid-cols-2 gap-8 md:grid-cols-4">
                    {FOOTER_SECTIONS.map((section) => (
                        <div key={section.title}>
                            <h2 className="footer-heading">{section.title}</h2>
                            <ul style={{ listStyle: "none", margin: 0, padding: 0 }}>
                                {section.links.map((link) => (
                                    <li key={link.href}>
                                        <Link href={link.href} className="footer-link">
                                            {link.label}
                                        </Link>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    ))}
                </div>
            </div>

            {/* Copyright */}
            <div className="container-editorial py-6" style={{ borderTop: "1px solid rgba(255,255,255,0.1)" }}>
                <p className="footer-copyright">
                    © {currentYear || "2026"} The Hint. All rights reserved.
                </p>
            </div>
        </footer>
    );
}
