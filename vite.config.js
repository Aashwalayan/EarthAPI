import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import cesium from "vite-plugin-cesium";

// vite-plugin-cesium copies Cesium's workers/assets/widgets CSS and sets
// CESIUM_BASE_URL for you, so everything is served from your own origin.
export default defineConfig({
  plugins: [react(), cesium()],
});
