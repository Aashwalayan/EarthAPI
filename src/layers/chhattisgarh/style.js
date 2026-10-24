// Presentation only: how each category of Chhattisgarh location looks.
// One outline and label style for everything; hue and size carry the meaning.

export const CATEGORY_COLORS = {
  settlement: "#ffb703", // cities & towns
  administrative: "#00b4d8", // administrative divisions (e.g. adm2)
  area: "#c77dff", // wider areas / regions
  other: "#adb5bd",
};

// Only settlements scale with population. An `area` record's population covers
// the whole region (Surguja is larger than Raipur), so sizing it the same way
// would make regions look like big cities.
function settlementSize(population) {
  if (population === null) return 8;
  const size = 7 + (Math.log10(Math.max(population, 1)) - 3.5) * 3.2;
  return Math.min(15, Math.max(7, size));
}

// Bigger places stay labelled from farther away, so the opening view is not a
// wall of overlapping names (only the largest city is named at that zoom).
// Distances are camera-to-marker, in meters.
function settlementLabelRange(population) {
  if (population !== null && population >= 800_000) return 1_400_000;
  if (population !== null && population >= 100_000) return 500_000;
  return 250_000;
}

/** @returns {{ color: string, size: number, labelRange: number }} */
export function styleFeature(feature) {
  const color = CATEGORY_COLORS[feature.category] ?? CATEGORY_COLORS.other;
  switch (feature.category) {
    case "settlement":
      return {
        color,
        size: settlementSize(feature.population),
        labelRange: settlementLabelRange(feature.population),
      };
    case "administrative":
      return { color, size: 10, labelRange: 500_000 };
    case "area":
      return { color, size: 12, labelRange: 500_000 };
    default:
      return { color, size: 7, labelRange: 250_000 };
  }
}
