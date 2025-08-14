import { useEffect, useState } from "react";

export type SalesCallMinimal = { summary?: string };

const friendly = (msg: string) =>
  msg === "not_found" ? "No analysis yet for this session." :
  msg === "invalid_schema" ? "Received data is invalid. Try again." :
  msg.startsWith("http_") ? "Server error. Please retry." :
  msg;

export function useSalesCall(sessionId?: string) {
  const [data, setData] = useState<SalesCallMinimal | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!sessionId) return;
    const ac = new AbortController();
    let cancelled = false;
    setLoading(true); setError(null); setData(null);

    fetch(`/api/sessions/${encodeURIComponent(sessionId)}/analysis`, { signal: ac.signal })
      .then(async (r) => {
        if (!r.ok) {
          const maybe = await r.json().catch(() => ({}));
          const msg = typeof maybe?.error === "string" ? maybe.error : `http_${r.status}`;
          throw new Error(msg);
        }
        return r.json();
      })
      .then((json) => { if (!cancelled) setData(json); })
      .catch((e) => { if (!cancelled && e.name !== "AbortError") setError(friendly(String(e.message || e))); })
      .finally(() => { if (!cancelled) setLoading(false); });

    return () => { cancelled = true; ac.abort(); };
  }, [sessionId]);

  return { data, error, loading };
}