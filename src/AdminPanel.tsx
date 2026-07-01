import { useState } from 'react';
import { callApi, type ApiResult } from './api';

// The authorization demo. The "Delete all statuses" button is hidden for
// non-admins, which feels like a control but is not one: the endpoint is still
// in the bundle and anyone can call it. The server (the Lambda behind /admin)
// is what actually enforces the `admins` group, returning 403 for everyone else.
export function AdminPanel({ isAdmin }: { isAdmin: boolean }) {
  const [result, setResult] = useState<ApiResult | null>(null);
  const [loading, setLoading] = useState(false);

  const callAdminDirectly = async () => {
    setLoading(true);
    try {
      setResult(await callApi('/admin'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="card">
      <h2>Admin</h2>

      {/* UI-only gate. Hiding this button is a usability choice, not security. */}
      {isAdmin && <button className="danger">Delete all statuses</button>}

      <p className="hint">
        The button above only renders for admins. The endpoint behind it does not
        care about that. Call it directly:
      </p>

      <button onClick={callAdminDirectly} disabled={loading}>
        {loading ? 'Calling…' : 'Call /admin directly'}
      </button>

      {result && (
        <pre className={result.status === 200 ? 'ok' : 'blocked'}>
          {result.status} {JSON.stringify(result.body)}
        </pre>
      )}
    </section>
  );
}
