// Cesium rendering for point layers. Knows nothing about where the data came
// from: it draws normalized Features using the layer's style() function.

import * as Cesium from "cesium";

const SELECTED_GROWTH = 5; // extra pixels for the selected marker
const SELECTED_OUTLINE = 4;
const OUTLINE = 2;

export function renderPoints(viewer, layer, features) {
  const dataSource = new Cesium.CustomDataSource(layer.id);
  const featureByEntityId = new Map();
  const entityByFeatureId = new Map();
  let selectedId = null;

  for (const feature of features) {
    const style = layer.style(feature);
    const entity = dataSource.entities.add({
      id: `${layer.id}:${feature.id}`,
      name: feature.name,
      position: Cesium.Cartesian3.fromDegrees(feature.lon, feature.lat),
      point: {
        pixelSize: style.size,
        color: Cesium.Color.fromCssColorString(style.color),
        outlineColor: Cesium.Color.WHITE,
        outlineWidth: OUTLINE,
        scaleByDistance: new Cesium.NearFarScalar(2e4, 1.25, 2e6, 0.8),
        // Avoid clipping against the ground when the camera is very close.
        disableDepthTestDistance: 5000,
      },
      label: {
        text: feature.name,
        font: "600 13px system-ui, sans-serif",
        fillColor: Cesium.Color.WHITE,
        outlineColor: Cesium.Color.BLACK.withAlpha(0.85),
        outlineWidth: 3,
        style: Cesium.LabelStyle.FILL_AND_OUTLINE,
        verticalOrigin: Cesium.VerticalOrigin.BOTTOM,
        pixelOffset: new Cesium.Cartesian2(0, -(style.size / 2 + 4)),
        // Labels only show up close, so the finite range also keeps them from
        // appearing through the globe from the far side.
        distanceDisplayCondition: new Cesium.DistanceDisplayCondition(0, style.labelRange),
        disableDepthTestDistance: Number.POSITIVE_INFINITY,
      },
    });
    featureByEntityId.set(entity.id, feature);
    entityByFeatureId.set(feature.id, { entity, size: style.size });
  }

  viewer.dataSources.add(dataSource);

  const restore = (featureId) => {
    const item = entityByFeatureId.get(featureId);
    if (!item) return;
    item.entity.point.pixelSize = item.size;
    item.entity.point.outlineWidth = OUTLINE;
  };

  return {
    dataSource,

    featureForEntityId: (entityId) => featureByEntityId.get(entityId) ?? null,

    setSelected(featureId) {
      if (selectedId !== null) restore(selectedId);
      selectedId = null;
      const item = featureId === null ? null : entityByFeatureId.get(featureId);
      if (!item) return;
      item.entity.point.pixelSize = item.size + SELECTED_GROWTH;
      item.entity.point.outlineWidth = SELECTED_OUTLINE;
      selectedId = featureId;
    },

    dispose() {
      if (!viewer.isDestroyed()) viewer.dataSources.remove(dataSource, true);
      featureByEntityId.clear();
      entityByFeatureId.clear();
    },
  };
}
