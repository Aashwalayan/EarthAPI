// Normalization: raw dataset record -> Feature (see ../feature.js).
// Pure functions, no Cesium and no fetching, so this is easy to test and reuse.

import {
  parseLatitude,
  parseLongitude,
  parseCount,
  formatCoordinates,
  formatCount,
  cleanString,
} from "../feature.js";

// The dataset's `type` field mixes settlements with administrative divisions
// and wider areas. In Chhattisgarh it holds: city, adm2, area. Treating them
// all as "cities" would be wrong (and an `area` carries a region-wide
// population), so each record is classified and styled by category.
export const CATEGORIES = [
  { key: "settlement", label: "Cities & towns" },
  { key: "administrative", label: "Administrative divisions" },
  { key: "area", label: "Areas & regions" },
  { key: "other", label: "Other" },
];

const SETTLEMENT_TYPES = new Set(["city", "town", "village", "municipality", "locality"]);

const capitalize = (s) => s.charAt(0).toUpperCase() + s.slice(1);

/** Map the dataset's raw `type` to { category, typeLabel }. Unknown types are kept, not dropped. */
export function classifyType(rawType) {
  const type = cleanString(rawType)?.toLowerCase() ?? null;
  if (!type) return { category: "other", typeLabel: "Unknown type" };
  if (SETTLEMENT_TYPES.has(type)) return { category: "settlement", typeLabel: capitalize(type) };
  if (/^adm\d+$/.test(type)) {
    return { category: "administrative", typeLabel: `Administrative division (${type})` };
  }
  if (type === "area") return { category: "area", typeLabel: "Area" };
  return { category: "other", typeLabel: capitalize(type) };
}

const wikidataHref = (id) => {
  const q = cleanString(id);
  return q && /^Q\d+$/.test(q) ? `https://www.wikidata.org/wiki/${q}` : null;
};

const withCode = (name, code) => {
  const n = cleanString(name);
  const c = cleanString(code);
  if (n && c) return `${n} (${c})`;
  return n ?? c ?? null;
};

/**
 * @returns {{ feature: import("../feature.js").Feature } | { skip: string }}
 */
export function normalizeLocation(record, meta, index) {
  if (record === null || typeof record !== "object") return { skip: "not an object" };

  const lat = parseLatitude(record.latitude);
  const lon = parseLongitude(record.longitude);
  if (lat === null || lon === null) return { skip: "missing or invalid coordinates" };
  // Exactly 0,0 is almost always a placeholder for "unknown", not a real place.
  if (lat === 0 && lon === 0) return { skip: "placeholder coordinates (0, 0)" };

  const { category, typeLabel } = classifyType(record.type);
  const population = parseCount(record.population);
  const name = cleanString(record.name) ?? "Unnamed location";

  const fields = [];
  const add = (label, value, href) => {
    if (value === null || value === undefined || value === "") return;
    fields.push(href ? { label, value, href } : { label, value });
  };

  add("Population", population === null ? null : formatCount(population));
  add("Coordinates", formatCoordinates(lat, lon));
  add("State", withCode(meta?.state?.name, meta?.state?.code));
  add("Country", withCode(meta?.country?.name, meta?.country?.code));
  add("Time zone", cleanString(record.timezone));
  add("Native name", cleanString(record.native));
  const href = wikidataHref(record.wikiDataId);
  add("Wikidata", href ? cleanString(record.wikiDataId) : null, href ?? undefined);

  return {
    feature: {
      id: record.id === null || record.id === undefined ? `row-${index}` : String(record.id),
      name,
      lon,
      lat,
      category,
      subtitle: typeLabel,
      population,
      fields,
    },
  };
}

/**
 * Normalize the whole generated dataset.
 * Bad records are skipped individually (and reported), never fatal.
 */
export function normalizeDataset(dataset) {
  const locations = dataset?.locations;
  if (!Array.isArray(locations)) {
    throw new Error("Chhattisgarh dataset is missing a `locations` array");
  }

  const features = [];
  const skipped = [];
  const seen = new Set();

  locations.forEach((record, index) => {
    const result = normalizeLocation(record, dataset.meta, index);
    if ("skip" in result) {
      skipped.push({ index, id: record?.id ?? null, name: record?.name ?? null, reason: result.skip });
      return;
    }
    const { feature } = result;
    if (seen.has(feature.id)) feature.id = `${feature.id}-${index}`; // keep ids unique
    seen.add(feature.id);
    features.push(feature);
  });

  return { features, skipped };
}
