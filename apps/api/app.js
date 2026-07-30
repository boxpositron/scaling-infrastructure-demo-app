const express = require("express");
const os = require("os");

const app = express();
const PORT = process.env.PORT || 3000;

// Version and container id are safe to show. They never contain a secret.
const APP_VERSION = process.env.APP_VERSION || "dev";
const CONTAINER = os.hostname();

// The web status strip is served from a different origin, so it needs to read
// status cross origin. Only GET is allowed and only non secret fields go out.
app.use((_req, res, next) => {
  res.set("Access-Control-Allow-Origin", "*");
  res.set("Access-Control-Allow-Methods", "GET");
  next();
});

// Reoclo health check target. Returns 200 while the app is up.
app.get("/healthz", (_req, res) => res.status(200).send("ok"));

// Data source for the live status strip. Serving version plus container id.
app.get("/status", (_req, res) => {
  res.json({ status: "ok", version: APP_VERSION, container: CONTAINER });
});

app.get("/", (_req, res) => res.send("nithub demo api"));

app.listen(PORT, () => {
  console.log("api listening on " + PORT + ", version " + APP_VERSION);
});
