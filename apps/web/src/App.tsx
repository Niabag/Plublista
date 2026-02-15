import { useEffect, useState } from 'react';

interface HealthResponse {
  data: {
    status: string;
    timestamp: string;
  };
}

function App() {
  const [health, setHealth] = useState<HealthResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch('/api/health')
      .then((res) => res.json())
      .then((data: HealthResponse) => setHealth(data))
      .catch(() => setError('Backend not reachable'));
  }, []);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <div className="text-center">
        <img src="/logo.png" alt="Publista" className="mx-auto h-[48px]" />
        <p className="mt-2 text-muted-foreground">AI-powered content creation platform</p>
        <div className="mt-6 rounded-lg border bg-card p-4 shadow-sm">
          <p className="text-sm font-medium text-muted-foreground">Backend Status</p>
          {health && (
            <p className="mt-1 text-sm text-emerald-600">
              {health.data.status} — {health.data.timestamp}
            </p>
          )}
          {error && <p className="mt-1 text-sm text-rose-600">{error}</p>}
          {!health && !error && <p className="mt-1 text-sm text-muted-foreground">Connecting...</p>}
        </div>
      </div>
    </div>
  );
}

export default App;
