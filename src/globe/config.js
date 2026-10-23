// Central place for globe settings.

// Esri World Imagery = satellite look (free, no key).
// For a street-map look use: https://tile.openstreetmap.org/{z}/{x}/{y}.png
export const IMAGERY = {
  url: "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
  maximumLevel: 19,
  credit: "Imagery © Esri, Maxar, Earthstar Geographics",
};

// Starting / home camera position.
export const HOME_VIEW = { lon: 80, lat: 20, height: 18_000_000 };
