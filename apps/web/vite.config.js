import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// VITE_API_BASE is baked in at build time. It points the status strip at the
// public URL of the api app. Leave it empty for a same origin setup.
//
// In the Docker dev container (DOCKER_DEV=1) we poll for file changes, because
// mount based file events are not always delivered. On the host this stays off,
// so local dev stays fast.
export default defineConfig({
  plugins: [react()],
  server: process.env.DOCKER_DEV
    ? { host: true, watch: { usePolling: true } }
    : {},
});
