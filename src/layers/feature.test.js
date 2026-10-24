import test from "node:test";
import assert from "node:assert/strict";
import {
  parseLatitude,
  parseLongitude,
  parseCount,
  formatCoordinates,
  cleanString,
} from "./feature.js";

test("coordinates: parses numbers and numeric strings", () => {
  assert.equal(parseLatitude("21.25621000"), 21.25621);
  assert.equal(parseLongitude(-81.5), -81.5);
  assert.equal(parseLatitude("0"), 0); // a real zero is valid
});

test("coordinates: empty, null and junk are rejected, never coerced to 0", () => {
  for (const bad of [null, undefined, "", "   ", "abc", NaN, Infinity, {}, [], true]) {
    assert.equal(parseLatitude(bad), null, `latitude ${String(bad)}`);
    assert.equal(parseLongitude(bad), null, `longitude ${String(bad)}`);
  }
});

test("coordinates: out-of-range values are rejected", () => {
  assert.equal(parseLatitude("90.0001"), null);
  assert.equal(parseLatitude(-91), null);
  assert.equal(parseLongitude("180.5"), null);
  assert.equal(parseLongitude(-181), null);
});

test("count: valid numbers pass, missing/invalid/negative become null", () => {
  assert.equal(parseCount(20384), 20384);
  assert.equal(parseCount("1027264"), 1027264);
  assert.equal(parseCount(0), 0);
  for (const bad of [null, undefined, "", " ", "n/a", -1, NaN, Infinity, {}]) {
    assert.equal(parseCount(bad), null, String(bad));
  }
});

test("formatCoordinates: hemisphere letters and precision", () => {
  assert.equal(formatCoordinates(21.25621, 81.69022), "21.2562° N, 81.6902° E");
  assert.equal(formatCoordinates(-33.8688, -70.5), "33.8688° S, 70.5000° W");
});

test("cleanString", () => {
  assert.equal(cleanString("  hi "), "hi");
  assert.equal(cleanString("   "), null);
  assert.equal(cleanString(null), null);
  assert.equal(cleanString(5), null);
});
