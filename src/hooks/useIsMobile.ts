/**
 * Custom hook to detect mobile viewport
 * Returns true if viewport width < 768px
 * Uses matchMedia for performance and SSR safety
 */

'use client';

import { useState, useEffect } from 'react';

const MOBILE_BREAKPOINT = 768;

export function useIsMobile(): boolean {
    const [isMobile, setIsMobile] = useState(false);

    useEffect(() => {
        // Check if window is available (SSR safety)
        if (typeof window === 'undefined') return;

        const mediaQuery = window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT - 1}px)`);

        // Set initial value
        setIsMobile(mediaQuery.matches);

        // Handler for changes
        const handleChange = (event: MediaQueryListEvent) => {
            setIsMobile(event.matches);
        };

        // Add listener
        mediaQuery.addEventListener('change', handleChange);

        // Cleanup
        return () => {
            mediaQuery.removeEventListener('change', handleChange);
        };
    }, []);

    return isMobile;
}

export { MOBILE_BREAKPOINT };
