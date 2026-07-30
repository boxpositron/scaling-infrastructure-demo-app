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
    return {
      healthy: true,
      version: data.version,
      container: data.container,
      taps: data.taps,
      devices: data.devices,
    };
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
  const [counts, setCounts] = useState({ taps: null, devices: 0 });
  const [lastOk, setLastOk] = useState(null);
  const [popping, setPopping] = useState(false);
  const mounted = useRef(true);
  const now = useClock();

  useEffect(() => {
    mounted.current = true;
    async function tick() {
      const next = await fetchStatus();
      if (!mounted.current) return;
      setState(next);
      if (next.healthy) {
        setLastOk(Date.now());
        // Only update the count on a healthy read. When the api is down the
        // number stays frozen at its last known value.
        if (typeof next.taps === "number") {
          setCounts({ taps: next.taps, devices: next.devices || 0 });
        }
      }
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
  const version =
    state.version && state.version.length > 12 ? state.version.slice(0, 7) : state.version;

  async function tap() {
    if (!healthy) return;
    try {
      const res = await fetch(API_BASE + "/tap", { method: "POST", cache: "no-store" });
      if (!res.ok) return;
      const data = await res.json();
      if (!mounted.current) return;
      setCounts({ taps: data.taps, devices: data.devices || 0 });
      setPopping(true);
    } catch (_err) {
      // The api is unreachable. The next poll shows the button as paused.
    }
  }

  const countLabel =
    counts.devices > 0
      ? "taps from " + counts.devices + (counts.devices === 1 ? " device" : " devices")
      : "taps so far";

  return (
    <main className={"screen " + phase}>
      <header className="brand">
        <span className="brand-mark">eggshells.dev</span>
        <span className="brand-sub">NITHUB masterclass, live status</span>
      </header>

      <section className="strip" role="status" aria-live="polite">
        <span className="dot" aria-hidden="true" />
        <span className="label">{label}</span>
      </section>

      <section className="counter">
        <p
          className={"count-num" + (popping ? " pop" : "")}
          onAnimationEnd={() => setPopping(false)}
        >
          {counts.taps === null ? "—" : counts.taps.toLocaleString()}
        </p>
        <p className="count-label">{countLabel}</p>
        <button className="egg-btn" onClick={tap} disabled={!healthy}>
          <span className="egg-btn-egg" aria-hidden="true" />
          <span>{healthy ? "Tap the egg" : "Paused, API down"}</span>
        </button>
      </section>

      <dl className="facts">
        <div>
          <dt>Serving version</dt>
          <dd>{healthy ? version : "unavailable"}</dd>
        </div>
        <div>
          <dt>Container</dt>
          <dd>{healthy ? state.container : "unavailable"}</dd>
        </div>
      </dl>

      <p className="note">
        {healthy
          ? "Every tap is counted by the API. If the API goes down the count freezes, and it resumes where it left off once the API is back."
          : "The page is still up. The API is down, so no taps are counted right now, and production did not go down."}
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
