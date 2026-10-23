# Globe

Interactive Google Earth-style globe: Vite + React + CesiumJS.
Free satellite imagery, no API key needed.

## Run

```bash
npm install
npm run dev
```

Open the URL Vite prints (usually http://localhost:5173).

## Structure

- `src/components/Globe.jsx`  creates the Cesium viewer; calls `onReady(viewer)`
- `src/globe/config.js`       imagery source and home camera position
- `src/globe/layers.js`       helpers: `addPoints`, `clearLayer`, `toggleLayer`
- `src/App.jsx`               attach your API data here (USGS example included, commented)

## Adding an API

In `App.jsx`, inside `handleReady(viewer)`: fetch your data, map it to
`{ lon, lat, label, color, size }`, and call `addPoints(viewer, "layer-name", items)`.
Each layer name can be toggled or cleared independently.

## Optional upgrades

Search, 3D terrain and 3D buildings need a free Cesium ion token
(https://ion.cesium.com). Set `Cesium.Ion.defaultAccessToken` before creating the viewer.
