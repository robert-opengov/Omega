'use client';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="en">
      <body
        style={{
          fontFamily:
            'system-ui, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '100vh',
          margin: 0,
          backgroundColor: '#fafafa',
          color: '#171717',
        }}
      >
        <div style={{ textAlign: 'center', maxWidth: 420, padding: '0 24px' }}>
          <h1 style={{ fontSize: 24, fontWeight: 600, marginBottom: 8 }}>
            Something went wrong
          </h1>
          <p style={{ color: '#737373', fontSize: 15, lineHeight: 1.6, marginBottom: 24 }}>
            An unexpected error occurred. Please try again or contact support if
            the problem persists.
          </p>
          {error.digest && (
            <p style={{ color: '#a3a3a3', fontSize: 12, marginBottom: 16 }}>
              Error ID: {error.digest}
            </p>
          )}
          <button
            onClick={reset}
            style={{
              padding: '10px 24px',
              fontSize: 14,
              fontWeight: 500,
              borderRadius: 8,
              border: '1px solid #e5e5e5',
              backgroundColor: '#fff',
              cursor: 'pointer',
              color: '#171717',
            }}
          >
            Try again
          </button>
        </div>
      </body>
    </html>
  );
}
