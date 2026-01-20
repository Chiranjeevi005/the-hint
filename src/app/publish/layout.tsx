/**
 * Publish Page Layout
 * Private editorial console - not for public access
 * 
 * Security:
 * - noindex, nofollow (never cached by search engines)
 * - Authentication middleware should be added here
 */

import { Metadata } from 'next';

export const metadata: Metadata = {
    title: 'Publish | The Hint Editorial Console',
    description: 'Private editorial publishing console',
    robots: {
        index: false,
        follow: false,
        nocache: true,
        googleBot: {
            index: false,
            follow: false,
            noimageindex: true,
        },
    },
};

export default function PublishLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    // TODO: Add authentication middleware check here
    // In a production environment, this should:
    // 1. Check for valid session/token
    // 2. Redirect unauthenticated users to login
    // 3. Log access attempts

    // For now, we allow access (demo mode)
    // In production, uncomment the following:
    // const session = await getSession();
    // if (!session) {
    //     redirect('/login');
    // }

    return (
        <>{children}</>
    );
}
