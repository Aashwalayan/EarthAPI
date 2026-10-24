// Layer definition: Chhattisgarh locations.
// Update mode: static. The data is a committed file regenerated on demand with
// `npm run data:chhattisgarh`; there is no backend and no live API.

import { fetchJson } from "../sources.js";
import { CATEGORIES, normalizeDataset } from "./normalize.js";
import { CATEGORY_COLORS, styleFeature } from "./style.js";

export default {
  id: "chhattisgarh-locations",
  title: "Chhattisgarh locations",
  geometry: "point", // which renderer draws it (see globe/LayerManager.js)
  focusOnLoad: true, // fly the camera to the layer's extent once it is drawn
  credit: {
    text: "Contains information from countries-states-cities-database (ODbL)",
    href: "https://github.com/dr5hn/countries-states-cities-database",
  },
  categories: CATEGORIES.map((c) => ({ ...c, color: CATEGORY_COLORS[c.key] })),
  style: styleFeature,

  /** Retrieval + normalization. Returns { features, skipped }. */
  async load({ signal }) {
    const url = `${import.meta.env.BASE_URL}data/chhattisgarh-locations.json`;
    return normalizeDataset(await fetchJson(url, { signal }));
  },
};
