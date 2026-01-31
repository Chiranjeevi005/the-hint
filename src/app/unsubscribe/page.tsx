'use client';

import { useSearchParams } from 'next/navigation';
import { Suspense } from 'react';

function UnsubscribeContent() {
    const searchParams = useSearchParams();
    const status = searchParams.get('status');
    const message = searchParams.get('message');

    const isSuccess = status === 'success';

    return (
        <main style={{
            minHeight: '100vh',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: '#f5f5f5',
            fontFamily: 'Georgia, serif',
            padding: '20px',
        }}>
            <div style={{
                maxWidth: '500px',
                backgroundColor: '#ffffff',
                padding: '40px',
                textAlign: 'center',
                border: '1px solid #e5e5e5',
            }}>
                <h1 style={{
                    fontSize: '32px',
                    fontWeight: 900,
                    letterSpacing: '-0.5px',
                    marginBottom: '30px',
                    color: '#111',
                }}>
                    THE HINT
                </h1>

                {isSuccess ? (
                    <>
                        <div style={{
                            fontSize: '48px',
                            marginBottom: '20px',
                        }}>
                            ✓
                        </div>
                        <h2 style={{
                            fontSize: '24px',
                            fontWeight: 'bold',
                            marginBottom: '15px',
                            color: '#111',
                        }}>
                            Unsubscribed
                        </h2>
                        <p style={{
                            fontSize: '16px',
                            lineHeight: 1.6,
                            color: '#666',
                            marginBottom: '30px',
                        }}>
                            {message || 'You have been successfully unsubscribed from our mailing list.'}
                        </p>
                    </>
                ) : (
                    <>
                        <h2 style={{
                            fontSize: '24px',
                            fontWeight: 'bold',
                            marginBottom: '15px',
                            color: '#111',
                        }}>
                            Unsubscribe
                        </h2>
                        <p style={{
                            fontSize: '16px',
                            lineHeight: 1.6,
                            color: '#666',
                            marginBottom: '30px',
                        }}>
                            {message || 'There was an issue processing your request.'}
                        </p>
                    </>
                )}

                <a
                    href="/"
                    style={{
                        display: 'inline-block',
                        padding: '14px 28px',
                        backgroundColor: '#111',
                        color: '#fff',
                        textDecoration: 'none',
                        fontFamily: 'Arial, sans-serif',
                        fontSize: '13px',
                        fontWeight: 'bold',
                        textTransform: 'uppercase',
                        letterSpacing: '1px',
                    }}
                >
                    Return to Homepage
                </a>

                <p style={{
                    marginTop: '30px',
                    fontSize: '13px',
                    color: '#999',
                    fontFamily: 'Arial, sans-serif',
                }}>
                    Changed your mind?{' '}
                    <a href="/" style={{ color: '#666', textDecoration: 'underline' }}>
                        Subscribe again
                    </a>
                </p>
            </div>
        </main>
    );
}

export default function UnsubscribePage() {
    return (
        <Suspense fallback={
            <main style={{
                minHeight: '100vh',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: '#f5f5f5',
            }}>
                <p>Loading...</p>
            </main>
        }>
            <UnsubscribeContent />
        </Suspense>
    );
}
