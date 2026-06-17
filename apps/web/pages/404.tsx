export default function NotFound() {
  return (
    <div style={{ display: 'flex', minHeight: '100vh', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '1rem', textAlign: 'center', fontFamily: 'system-ui, sans-serif' }}>
      <h1 style={{ fontSize: '3.75rem', fontWeight: 'bold', color: '#6b7280', margin: 0 }}>404</h1>
      <p style={{ fontSize: '1.25rem', fontWeight: '600', margin: 0 }}>Page not found</p>
      <a href="/" style={{ marginTop: '1rem', borderRadius: '0.375rem', backgroundColor: '#0A84FF', padding: '0.5rem 1.5rem', fontSize: '0.875rem', fontWeight: '600', color: 'white', textDecoration: 'none' }}>
        Go home
      </a>
    </div>
  );
}
