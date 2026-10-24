import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { classifyType, normalizeDataset, normalizeLocation } from "./normalize.js";

const dataset = JSON.parse(
  readFileSync(new URL("../../../public/data/chhattisgarh-locations.json", import.meta.url), "utf8")
);

const meta = dataset.meta;
const good = { id: 1, name: "Testville", latitude: "21.5", longitude: "81.5", type: "city", population: 1000 };

test("classifyType separates settlements, administrative divisions and areas", () => {
  assert.deepEqual(classifyType("city"), { category: "settlement", typeLabel: "City" });
  assert.deepEqual(classifyType(" Town "), { category: "settlement", typeLabel: "Town" });
  assert.deepEqual(classifyType("adm2"), {
    category: "administrative",
    typeLabel: "Administrative division (adm2)",
  });
  assert.equal(classifyType("ADM1").category, "administrative");
  assert.deepEqual(classifyType("area"), { category: "area", typeLabel: "Area" });
});

test("classifyType keeps unknown or missing types instead of dropping them", () => {
  assert.deepEqual(classifyType("section"), { category: "other", typeLabel: "Section" });
  assert.deepEqual(classifyType(null), { category: "other", typeLabel: "Unknown type" });
  assert.deepEqual(classifyType(""), { category: "other", typeLabel: "Unknown type" });
});

test("real dataset: all 81 records normalize, none skipped", () => {
  const { features, skipped } = normalizeDataset(dataset);
  assert.equal(dataset.locations.length, 81);
  assert.equal(features.length, 81);
  assert.equal(skipped.length, 0);
  assert.equal(new Set(features.map((f) => f.id)).size, 81, "ids are unique");
});

test("real dataset: type counts match what the data contains", () => {
  const { features } = normalizeDataset(dataset);
  const count = (c) => features.filter((f) => f.category === c).length;
  assert.equal(count("settlement"), 69);
  assert.equal(count("administrative"), 8);
  assert.equal(count("area"), 4);
  assert.equal(count("other"), 0);
});

test("real dataset: coordinates are numbers inside Chhattisgarh's rough bounds", () => {
  for (const f of normalizeDataset(dataset).features) {
    assert.equal(typeof f.lat, "number");
    assert.equal(typeof f.lon, "number");
    assert.ok(f.lat > 17 && f.lat < 25, `${f.name} lat ${f.lat}`);
    assert.ok(f.lon > 79 && f.lon < 85, `${f.name} lon ${f.lon}`);
  }
});

test("real dataset: the 5 records without population show no population row", () => {
  const { features } = normalizeDataset(dataset);
  const without = features.filter((f) => f.population === null);
  assert.equal(without.length, 5);
  for (const f of without) {
    assert.ok(!f.fields.some((x) => x.label === "Population"), f.name);
    assert.ok(f.fields.some((x) => x.label === "Coordinates"), f.name);
  }
  const raipur = features.find((f) => f.name === "Raipur");
  assert.equal(raipur.population, 1027264);
  assert.ok(raipur.fields.some((x) => x.label === "Population"));
  assert.equal(raipur.subtitle, "City");
});

test("info fields include administrative details and a safe Wikidata link", () => {
  const raipur = normalizeDataset(dataset).features.find((f) => f.name === "Raipur");
  const get = (label) => raipur.fields.find((f) => f.label === label);
  assert.equal(get("State").value, "Chhattisgarh (CT)");
  assert.equal(get("Country").value, "India (IN)");
  assert.equal(get("Time zone").value, "Asia/Kolkata");
  assert.equal(get("Wikidata").href, "https://www.wikidata.org/wiki/Q2295914");
});

test("bad coordinates are skipped with a reason, never plotted at 0,0", () => {
  const cases = [
    { ...good, latitude: null },
    { ...good, longitude: "" },
    { ...good, latitude: "abc" },
    { ...good, latitude: "95" },
    { ...good, latitude: "0", longitude: "0" },
    { ...good, latitude: undefined, longitude: undefined },
  ];
  for (const bad of cases) {
    const result = normalizeLocation(bad, meta, 0);
    assert.ok("skip" in result, JSON.stringify(bad));
  }
  const { features, skipped } = normalizeDataset({ meta, locations: [good, ...cases, null, 42] });
  assert.equal(features.length, 1);
  assert.equal(skipped.length, cases.length + 2);
});

test("bad population values degrade to 'no population', not an error", () => {
  for (const population of [null, undefined, "", "n/a", -5, NaN]) {
    const { feature } = normalizeLocation({ ...good, population }, meta, 0);
    assert.equal(feature.population, null);
    assert.ok(!feature.fields.some((f) => f.label === "Population"));
  }
});

test("missing name and id fall back safely; duplicate ids stay unique", () => {
  const { features } = normalizeDataset({
    meta,
    locations: [
      { latitude: "21", longitude: "81" },
      { ...good, id: 7 },
      { ...good, id: 7 },
    ],
  });
  assert.equal(features[0].name, "Unnamed location");
  assert.equal(features[0].id, "row-0");
  assert.equal(new Set(features.map((f) => f.id)).size, 3);
});

test("a malformed Wikidata id never becomes a link", () => {
  const { feature } = normalizeLocation({ ...good, wikiDataId: "javascript:alert(1)" }, meta, 0);
  assert.ok(!feature.fields.some((f) => f.label === "Wikidata"));
});

test("dataset without a locations array fails loudly", () => {
  assert.throws(() => normalizeDataset({}), /locations/);
  assert.throws(() => normalizeDataset(null), /locations/);
});
