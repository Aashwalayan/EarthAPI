import Globe from "./components/Globe.jsx";
// import { addPoints } from "./globe/layers.js";

export default function App() {
  const handleReady = (viewer) => {
    // Handy for experimenting from the browser console:
    //   window.viewer
    window.viewer = viewer;

    // EXAMPLE: plug in a free API (USGS earthquakes, no key needed).
    // Uncomment this and the import above to try it:
    //
    // fetch("https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/2.5_day.geojson")
    //   .then((r) => r.json())
    //   .then((geo) =>
    //     addPoints(
    //       viewer,
    //       "earthquakes",
    //       geo.features.map((f) => ({
    //         lon: f.geometry.coordinates[0],
    //         lat: f.geometry.coordinates[1],
    //         label: "M" + f.properties.mag,
    //         size: 4 + f.properties.mag * 2,
    //       }))
    //     )
    //   );
  };

  return <Globe onReady={handleReady} />;
}
