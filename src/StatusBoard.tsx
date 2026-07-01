import { useState } from 'react';
import DOMPurify from 'dompurify';

type Status = { id: number; text: string };

// The XSS demo. Statuses are rendered with dangerouslySetInnerHTML, which drops
// raw HTML into the page with no escaping. Flip "Hardened mode" in the header to
// wrap the same value in DOMPurify.sanitize() and watch the payload go inert.
export function StatusBoard({ hardened }: { hardened: boolean }) {
  const [text, setText] = useState('');
  const [statuses, setStatuses] = useState<Status[]>([
    { id: 1, text: 'Shipped the new login flow 🎉' },
    { id: 2, text: 'Reviewing the API Gateway authorizer next' },
  ]);

  const post = () => {
    if (!text.trim()) return;
    setStatuses((prev) => [...prev, { id: Date.now(), text }]);
    setText('');
  };

  return (
    <section className="card">
      <h2>Team status</h2>
      <div className="row">
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && post()}
          placeholder="What are you working on?"
          aria-label="Status text"
        />
        <button onClick={post}>Post</button>
      </div>
      <ul className="statuses">
        {statuses.map((s) => (
          <li key={s.id}>
            <div
              dangerouslySetInnerHTML={{
                __html: hardened ? DOMPurify.sanitize(s.text) : s.text,
              }}
            />
          </li>
        ))}
      </ul>
      <p className="hint">
        Try posting: <code>&lt;img src=x onerror=alert('bad')&gt;</code>
      </p>
    </section>
  );
}
