const express = require("express");
const os = require("os");
const fs = require("fs");
const path = require("path");

const app = express();
const PORT = process.env.PORT || 3000;

// Trust exactly one proxy hop (Caddy). This reads the real client IP from
// X-Forwarded-For while ignoring a header a client forges, because only the
// address Caddy itself adds is honored.
app.set("trust proxy", 1);

// Version and container id are safe to show. They never contain a secret.
const APP_VERSION = process.env.APP_VERSION || "dev";
const CONTAINER = os.hostname();

// Live tap counter. Anyone can tap the button on the site. We keep a running
// total plus a per IP tally, so taps are attributed by device without ever
// showing an address. It persists to a file so the count survives a redeploy,
// which is what lets the number resume after the api is fixed instead of reset.
const TAP_FILE = process.env.TAP_FILE || "/data/taps.json";
// Cap the number of distinct IPs we track so a flood of addresses cannot grow
// memory without bound. Past the cap, new addresses still count toward the
// total, they just do not add a new key.
const MAX_IPS = 50000;
let total = 0;
const byIp = new Map();

function loadTaps() {
  try {
    const data = JSON.parse(fs.readFileSync(TAP_FILE, "utf8"));
    total = data.total || 0;
    for (const [ip, n] of data.byIp || []) {
      if (byIp.size >= MAX_IPS) break;
      byIp.set(ip, n);
    }
    console.log("loaded taps: total " + total + ", devices " + byIp.size);
  } catch (_err) {
    // No file yet, or unreadable. Start fresh and keep going.
  }
}

let saveTimer = null;
function scheduleSave() {
  if (saveTimer) return;
  saveTimer = setTimeout(() => {
    saveTimer = null;
    try {
      fs.mkdirSync(path.dirname(TAP_FILE), { recursive: true });
      fs.writeFileSync(TAP_FILE, JSON.stringify({ total, byIp: [...byIp] }));
    } catch (_err) {
      // If the volume is not writable we simply keep the count in memory.
    }
  }, 1500);
}

loadTaps();

// The site is served from a different origin, so it reads status and posts taps
// cross origin. GET and POST are allowed. Only non secret counts ever go out,
// never an address. POST /tap carries no body, so it stays a simple request with
// no preflight.
app.use((_req, res, next) => {
  res.set("Access-Control-Allow-Origin", "*");
  res.set("Access-Control-Allow-Methods", "GET, POST");
  next();
});

// Reoclo health check target. Returns 200 while the app is up.
app.get("/healthz", (_req, res) => res.status(200).send("ok"));

// Data source for the live status page. Version, container, and the tap counts.
app.get("/status", (_req, res) => {
  res.json({
    status: "ok",
    version: APP_VERSION,
    container: CONTAINER,
    taps: total,
    devices: byIp.size,
  });
});

// Register a tap, attributed to the caller's IP. Returns the fresh counts.
app.post("/tap", (req, res) => {
  const ip = req.ip || "unknown";
  total += 1;
  if (byIp.has(ip) || byIp.size < MAX_IPS) {
    byIp.set(ip, (byIp.get(ip) || 0) + 1);
  }
  scheduleSave();
  res.json({ taps: total, devices: byIp.size, you: byIp.get(ip) || 0 });
});

app.get("/", (_req, res) => res.send("nithub demo api"));

app.listen(PORT, () => {
  console.log("api listening on " + PORT + ", version " + APP_VERSION);
});
