import * as Cesium from "cesium";

// One named DataSource per data feed, so each API can be shown, hidden,
// or cleared independently.
const layers = new Map();

export function getLayer(viewer, name) {
  if (!layers.has(name)) {
    const ds = new Cesium.CustomDataSource(name);
    viewer.dataSources.add(ds);
    layers.set(name, ds);
  }
  return layers.get(name);
}

// items: [{ lon, lat, label?, color?, size? }]
export function addPoints(viewer, layerName, items) {
  const layer = getLayer(viewer, layerName);
  items.forEach((it) => {
    layer.entities.add({
      position: Cesium.Cartesian3.fromDegrees(it.lon, it.lat),
      point: {
        pixelSize: it.size ?? 8,
        color: Cesium.Color.fromCssColorString(it.color ?? "#ff5a36"),
        outlineColor: Cesium.Color.WHITE,
        outlineWidth: 1,
      },
      label: it.label
        ? {
            text: it.label,
            font: "13px sans-serif",
            pixelOffset: new Cesium.Cartesian2(0, -18),
            fillColor: Cesium.Color.WHITE,
            outlineColor: Cesium.Color.BLACK,
            outlineWidth: 3,
            style: Cesium.LabelStyle.FILL_AND_OUTLINE,
            distanceDisplayCondition: new Cesium.DistanceDisplayCondition(0, 4_000_000),
          }
        : undefined,
    });
  });
}

export function clearLayer(viewer, name) {
  layers.get(name)?.entities.removeAll();
}

export function toggleLayer(name, show) {
  const ds = layers.get(name);
  if (ds) ds.show = show;
}

// Call when the viewer is destroyed so stale layers aren't reused.
export function resetLayers() {
  layers.clear();
}
