// Shared contract and helpers for data layers. No Cesium imports: everything
// here is plain data, so it can be tested in Node and reused by any layer.
//
// A layer's job is to turn some dataset into an array of Features.

/**
 * @typedef {Object} Field
 * @property {string} label
 * @property {string} value
 * @property {string} [href]  Optional link (http/https only).
 */

/**
 * @typedef {Object} Feature
 * @property {string} id            Unique within the layer.
 * @property {string} name          Display name.
 * @property {number} lon           Validated longitude, degrees.
 * @property {number} lat           Validated latitude, degrees.
 * @property {string} category      Layer-defined key used for styling and the legend.
 * @property {string} subtitle      Short description shown under the name.
 * @property {number|null} population  Parsed value, or null when unknown.
 * @property {Field[]} fields       Ordered details for the info card.
 */

/** Parse a latitude/longitude that may be a number, a numeric string, or junk. */
export function parseCoordinate(value, { min, max }) {
  // Number(null) and Number("") are 0, which would silently put a marker at
  // 0°, so reject empty-ish values before converting.
  if (value === null || value === undefined) return null;
  if (typeof value === "string" && value.trim() === "") return null;
  if (typeof value !== "number" && typeof value !== "string") return null;
  const n = typeof value === "number" ? value : Number(value);
  return Number.isFinite(n) && n >= min && n <= max ? n : null;
}

export const parseLatitude = (v) => parseCoordinate(v, { min: -90, max: 90 });
export const parseLongitude = (v) => parseCoordinate(v, { min: -180, max: 180 });

/** Parse a count such as population. Returns null for missing/invalid/negative. */
export function parseCount(value) {
  if (value === null || value === undefined) return null;
  if (typeof value === "string" && value.trim() === "") return null;
  if (typeof value !== "number" && typeof value !== "string") return null;
  const n = typeof value === "number" ? value : Number(value);
  return Number.isFinite(n) && n >= 0 ? n : null;
}

/** "21.2562° N, 81.6902° E" */
export function formatCoordinates(lat, lon, digits = 4) {
  const ns = lat >= 0 ? "N" : "S";
  const ew = lon >= 0 ? "E" : "W";
  return `${Math.abs(lat).toFixed(digits)}° ${ns}, ${Math.abs(lon).toFixed(digits)}° ${ew}`;
}

/** Locale-aware integer formatting, e.g. 1,027,264 (grouping follows the browser locale). */
export function formatCount(n) {
  return new Intl.NumberFormat().format(Math.round(n));
}

/** Non-empty trimmed string, or null. */
export function cleanString(value) {
  if (typeof value !== "string") return null;
  const s = value.trim();
  return s === "" ? null : s;
}
