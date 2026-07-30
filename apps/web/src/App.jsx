import { useEffect, useRef, useState } from "react";

// Baked in at build time. Points at the public URL of the api app.
const API_BASE = import.meta.env.VITE_API_BASE || "";
const POLL_MS = 2000;
const TIMEOUT_MS = 1500;

async function fetchStatus() {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    const res = await fetch(API_BASE + "/status", {
      signal: controller.signal,
      cache: "no-store",
    });
    if (!res.ok) return { healthy: false };
    const data = await res.json();
    return { healthy: true, version: data.version, container: data.container };
  } catch (_err) {
    // Network error, timeout, or the api being unreachable all land here.
    // The page stays up either way. That is the whole point on stage.
    return { healthy: false };
  } finally {
    clearTimeout(timer);
  }
}

function useClock() {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);
  return now;
}

export default function App() {
  const [state, setState] = useState({ healthy: null });
  const [lastOk, setLastOk] = useState(null);
  const mounted = useRef(true);
  const now = useClock();

  useEffect(() => {
    mounted.current = true;
    async function tick() {
      const next = await fetchStatus();
      if (!mounted.current) return;
      setState(next);
      if (next.healthy) setLastOk(Date.now());
    }
    tick();
    const id = setInterval(tick, POLL_MS);
    return () => {
      mounted.current = false;
      clearInterval(id);
    };
  }, []);

  const pending = state.healthy === null;
  const healthy = state.healthy === true;
  const phase = pending ? "pending" : healthy ? "healthy" : "degraded";
  const label = pending ? "Checking API" : healthy ? "API healthy" : "API degraded";
  const secondsSinceOk = lastOk ? Math.max(0, Math.round((now - lastOk) / 1000)) : null;

  return (
    <main className={"screen " + phase}>
      <header className="brand">
        <span className="brand-mark">NITHUB</span>
        <span className="brand-sub">Infrastructure for Scale, live demo</span>
      </header>

      <section className="strip" role="status" aria-live="polite">
        <span className="dot" aria-hidden="true" />
        <span className="label">{label}</span>
      </section>

      <dl className="facts">
        <div>
          <dt>Serving version</dt>
          <dd>{healthy ? state.version : "unavailable"}</dd>
        </div>
        <div>
          <dt>Container</dt>
          <dd>{healthy ? state.container : "unavailable"}</dd>
        </div>
      </dl>

      <p className="note">
        {healthy
          ? "The API is up and serving this build."
          : "The web app is still serving. The API is unavailable, and production did not go down."}
      </p>

      <footer className="meta">
        {pending
          ? "Connecting"
          : healthy
          ? "Live, refreshing every 2 seconds"
          : secondsSinceOk === null
          ? "No healthy response yet"
          : "Last healthy response " + secondsSinceOk + "s ago"}
      </footer>
    </main>
  );
}
