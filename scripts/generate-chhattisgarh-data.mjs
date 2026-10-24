// Build-time data step (Node only). Run with:  npm run data:chhattisgarh
//
// @countrystatecity/countries reads its data with Node's `fs`, so it cannot run
// in the browser. This script uses it where it works, extracts only
// Chhattisgarh, and writes a small static JSON file that the app fetches at
// runtime. The generated file is committed, so the 90 MB package is only needed
// when you want to refresh the data.

import { readFile, writeFile, mkdir } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import {
  getStatesOfCountry,
  getCitiesOfState,
  getCountryNameByCode,
} from "@countrystatecity/countries";

const COUNTRY_CODE = "IN";
const STATE_CODE = "CT"; // Chhattisgarh in this dataset
const OUTPUT = resolve(
  dirname(fileURLToPath(import.meta.url)),
  "../public/data/chhattisgarh-locations.json"
);

// Only the fields the app uses. Values are kept exactly as the dataset has them
// (coordinates stay strings, missing population stays null); the app's
// normalizer is the single place that parses and validates them.
const pickLocation = (c) => ({
  id: c.id,
  name: c.name,
  native: c.native ?? null,
  type: c.type ?? null,
  latitude: c.latitude ?? null,
  longitude: c.longitude ?? null,
  population: c.population ?? null,
  timezone: c.timezone ?? null,
  wikiDataId: c.wikiDataId ?? null,
});

async function packageVersion() {
  // The package's exports map doesn't expose package.json, so locate it from
  // the resolved entry point (<pkg>/dist/index.js).
  const entry = import.meta.resolve("@countrystatecity/countries");
  const pkgUrl = new URL("../package.json", entry);
  return JSON.parse(await readFile(pkgUrl, "utf8")).version;
}

const states = await getStatesOfCountry(COUNTRY_CODE);
const state = states.find((s) => s.iso2 === STATE_CODE);
if (!state) throw new Error(`State ${STATE_CODE} not found in ${COUNTRY_CODE}`);

const records = await getCitiesOfState(COUNTRY_CODE, STATE_CODE);
if (!records.length) throw new Error("Dataset returned no locations");

const locations = records
  .map(pickLocation)
  .sort((a, b) => a.name.localeCompare(b.name, "en"));

const data = {
  meta: {
    source: "@countrystatecity/countries",
    sourceVersion: await packageVersion(),
    sourceData: "https://github.com/dr5hn/countries-states-cities-database",
    license: "ODbL-1.0",
    generatedAt: new Date().toISOString(),
    country: {
      code: COUNTRY_CODE,
      name: (await getCountryNameByCode(COUNTRY_CODE)) ?? COUNTRY_CODE,
    },
    state: {
      code: state.iso2,
      name: state.name,
      type: state.type ?? null,
      timezone: state.timezone ?? null,
    },
  },
  locations,
};

// One location per line keeps diffs readable and the file small.
const json =
  `{\n  "meta": ${JSON.stringify(data.meta)},\n  "locations": [\n` +
  locations.map((l) => `    ${JSON.stringify(l)}`).join(",\n") +
  `\n  ]\n}\n`;

await mkdir(dirname(OUTPUT), { recursive: true });
await writeFile(OUTPUT, json);

const byType = locations.reduce((m, l) => ((m[l.type] = (m[l.type] ?? 0) + 1), m), {});
console.log(`Wrote ${locations.length} locations to ${OUTPUT}`);
console.log("By type:", byType);
console.log("Missing population:", locations.filter((l) => l.population == null).length);
console.log(`Size: ${(json.length / 1024).toFixed(1)} KB`);
