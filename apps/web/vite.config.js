import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// VITE_API_BASE is baked in at build time. It points the status strip at the
// public URL of the api app. Leave it empty for a same origin setup.
export default defineConfig({
  plugins: [react()],
});
