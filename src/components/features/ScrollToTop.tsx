"use client";

import { usePathname } from 'next/navigation';
import { useEffect } from 'react';

export default function ScrollToTop() {
    const pathname = usePathname();

    useEffect(() => {
        // Force scroll to top on pathname change with a slight delay
        // to ensure the new page content has started to render
        const handleScroll = () => {
            window.scrollTo({
                top: 0,
                left: 0,
                behavior: 'instant' // Instant jump, no smooth scroll interference
            });
        };

        // Execute immediately
        handleScroll();

        // Also try a minimal timeout in case layout shifts happen
        const timeoutId = setTimeout(handleScroll, 10);

        return () => clearTimeout(timeoutId);
    }, [pathname]);

    return null;
}
