# EarthAPI

An interactive 3D globe in the browser, built with **Vite + React + CesiumJS**. It uses free satellite imagery and needs no API keys, so it runs as soon as you install it.

EarthAPI is the base layer. The globe comes first, and any free public API (earthquakes, flights, weather, satellites, and so on) can be added on top as its own toggleable data layer.

<!-- Add a screenshot: ![EarthAPI screenshot](docs/screenshot.png) -->

## Features

- Smooth, Google Earth-style navigation: rotate, zoom from space down to street level, and tilt
- Free Esri World Imagery satellite tiles, with no key or signup
- Atmosphere, sky and starfield
- 3D, 2D and Columbus view modes, plus a Home button that returns to the starting view
- A small layer system (`addPoints`, `toggleLayer`, `clearLayer`) so each API feed can be shown, hidden or cleared independently

## Tech Stack

- [React 18](https://react.dev/)
- [Vite 5](https://vitejs.dev/)
- [CesiumJS 1.120](https://cesium.com/platform/cesiumjs/)
- [vite-plugin-cesium](https://github.com/nshen/vite-plugin-cesium), which serves Cesium's workers and assets locally

## Getting Started

**Requirements:** Node.js 18 or newer.

```bash
git clone https://github.com/Aashwalayan/EarthAPI.git
cd EarthAPI
npm install
npm run dev
```

Open the local URL Vite prints (usually `http://localhost:5173`).

### Other scripts

| Command           | What it does                        |
| ----------------- | ----------------------------------- |
| `npm run dev`     | Start the dev server with hot reload |
| `npm run build`   | Create a production build in `dist/` |
| `npm run preview` | Serve the production build locally   |

## Project Structure

```
EarthAPI/
├── index.html
├── vite.config.js            # React + Cesium plugins
├── package.json
└── src/
    ├── main.jsx              # React entry point
    ├── App.jsx               # Attach your API data here
    ├── index.css
    ├── components/
    │   └── Globe.jsx         # Creates the Cesium viewer, calls onReady(viewer)
    └── globe/
        ├── config.js         # Imagery source and home camera position
        └── layers.js         # addPoints, clearLayer, toggleLayer helpers
```

## Adding Data from an API

Data layers are attached in `src/App.jsx`, inside `handleReady(viewer)`. The pattern is: fetch the data, map each item to `{ lon, lat, label, color, size }`, and pass the list to `addPoints`.

Example using the free [USGS earthquake feed](https://earthquake.usgs.gov/earthquakes/feed/) (no key needed):

```jsx
import Globe from "./components/Globe.jsx";
import { addPoints } from "./globe/layers.js";

export default function App() {
  const handleReady = (viewer) => {
    fetch("https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/2.5_day.geojson")
      .then((r) => r.json())
      .then((geo) =>
        addPoints(
          viewer,
          "earthquakes",
          geo.features.map((f) => ({
            lon: f.geometry.coordinates[0],
            lat: f.geometry.coordinates[1],
            label: "M" + f.properties.mag,
            size: 4 + f.properties.mag * 2,
          }))
        )
      );
  };

  return <Globe onReady={handleReady} />;
}
```

### Layer helpers (`src/globe/layers.js`)

| Function                          | Description                                  |
| --------------------------------- | -------------------------------------------- |
| `addPoints(viewer, name, items)`  | Add points to a named layer (created on demand) |
| `toggleLayer(name, show)`         | Show or hide a whole layer                   |
| `clearLayer(viewer, name)`        | Remove everything in a layer                 |

Each layer name is its own Cesium data source, so feeds never interfere with each other. A layer-switcher UI is mostly a matter of calling `toggleLayer` from checkboxes.

### Free APIs that work without a key

- USGS Earthquakes: recent earthquakes worldwide
- NASA EONET: wildfires, storms, volcanoes and other natural events
- OpenSky Network: live aircraft positions (rate-limited for anonymous use)
- Open Notify: current ISS position

Check each provider's terms and rate limits before relying on them.

## Configuration

`src/globe/config.js` holds the main settings:

- `IMAGERY`: the tile source. The default is Esri World Imagery (satellite). For a street-map look, use `https://tile.openstreetmap.org/{z}/{x}/{y}.png`. OpenStreetMap's tile servers are meant for light use, so use your own tile server for anything heavy.
- `HOME_VIEW`: starting longitude, latitude and camera height (in meters)

### Optional: Cesium ion features

Search, 3D terrain and 3D buildings need a free [Cesium ion](https://ion.cesium.com) access token. They are off by default so the app works without signup. To enable them, set the token before creating the viewer in `Globe.jsx`:

```js
Cesium.Ion.defaultAccessToken = import.meta.env.VITE_CESIUM_ION_TOKEN;
```

Put the token in a `.env` file (already covered by typical ignore rules, but check) and never commit it.

## Troubleshooting

**`Missing "./lib/zip-no-worker.js" specifier in "@zip.js/zip.js"`**
Cesium 1.120 needs an older `@zip.js/zip.js` layout than the latest release provides. `package.json` pins it to `2.7.73` through `overrides`. If you see this error, delete `node_modules` and `package-lock.json`, then run `npm install` again so the pin is applied.

**Worker or `SecurityError` messages when opening `index.html` directly**
Cesium relies on web workers, which browsers restrict on `file://` pages and some sandboxed previews. Run the app through `npm run dev` or `npm run preview` instead.

**Blank or dark globe with failed tile requests**
Check your network connection, and make sure an ad blocker or firewall isn't blocking the imagery host (`server.arcgisonline.com`).

## Attribution

- Imagery © Esri, Maxar, Earthstar Geographics (shown in the viewer's credit area)
- Globe rendering by [CesiumJS](https://cesium.com/platform/cesiumjs/), licensed under Apache 2.0