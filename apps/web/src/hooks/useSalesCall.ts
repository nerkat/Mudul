import { useEffect, useState } from "react";

export type SalesCall = {
  summary?: string;
  // (we only use summary now; keep the rest implicit)
};

export function useSalesCall(sessionId?: string) {
  const [data, setData] = useState<SalesCall | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!sessionId) return;
    let cancelled = false;
    setLoading(true); setError(null); setData(null);
    fetch(`/api/sessions/${encodeURIComponent(sessionId)}/analysis`)
      .then(async (r) => {
        if (!r.ok) {
          const maybe = await r.json().catch(() => ({}));
          const msg = typeof maybe?.error === "string" ? maybe.error : `http_${r.status}`;
          throw new Error(msg);
        }
        return r.json();
      })
      .then((json) => { if (!cancelled) setData(json); })
      .catch((e) => { if (!cancelled) setError(String(e.message || e)); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [sessionId]);

  return { data, error, loading };
}