
'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';

function LoginForm() {
    const [email, setEmail] = useState('');
    const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
    const [message, setMessage] = useState('');

    const searchParams = useSearchParams();

    // Check for error in URL on mount
    useEffect(() => {
        const error = searchParams.get('error');
        if (error) {
            setStatus('error');
            setMessage(decodeURIComponent(error));
        }
    }, [searchParams]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setStatus('loading');
        setMessage('');

        try {
            const res = await fetch('/api/auth/request-link', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email }),
            });

            const data = await res.json();

            if (!res.ok) {
                throw new Error(data.error || 'Something went wrong');
            }

            setStatus('success');
            setMessage(data.message || 'Check your email for the magic link.');
        } catch (err: any) {
            setStatus('error');
            setMessage(err.message);
        }
    };

    return (
        <div className="w-full max-w-md bg-white p-8 border hover:shadow-sm transition-shadow duration-200">
            <h1 className="text-2xl font-bold mb-6 text-center tracking-tight text-neutral-900 border-b pb-4">
                The Hint <span className="font-normal text-neutral-500 text-lg ml-2">Editor</span>
            </h1>

            {status === 'success' ? (
                <div className="text-center py-8">
                    <div className="text-green-800 bg-green-50 p-4 rounded mb-4 text-sm border border-green-100">
                        {message}
                    </div>
                    <p className="text-sm text-neutral-500">
                        You can close this tab.
                    </p>
                </div>
            ) : (
                <form onSubmit={handleSubmit} className="space-y-6">
                    <div>
                        <label htmlFor="email" className="block text-sm font-medium text-neutral-700 mb-2 uppercase tracking-wide text-xs">
                            Email Address
                        </label>
                        <input
                            id="email"
                            type="email"
                            required
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="w-full px-3 py-2 border border-neutral-300 focus:outline-none focus:border-neutral-900 transition-colors font-sans text-sm"
                            placeholder="editor@example.com"
                            disabled={status === 'loading'}
                        />
                    </div>

                    {status === 'error' && (
                        <div className="text-red-700 text-sm bg-red-50 p-3 border border-red-100">
                            {message}
                        </div>
                    )}

                    <button
                        type="submit"
                        disabled={status === 'loading'}
                        className="w-full bg-neutral-900 text-white py-2 px-4 hover:bg-neutral-800 transition-colors disabled:opacity-50 text-sm font-medium uppercase tracking-wide"
                    >
                        {status === 'loading' ? 'Sending...' : 'Send Magic Link'}
                    </button>
                </form>
            )}
        </div>
    );
}

export default function LoginPage() {
    return (
        <main className="min-h-screen flex items-center justify-center bg-[#F5F5F0] p-4 font-serif">
            <Suspense fallback={<div className="text-neutral-500">Loading...</div>}>
                <LoginForm />
            </Suspense>
        </main>
    );
}
