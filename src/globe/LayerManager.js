// Connects layer definitions (src/layers) to the Cesium viewer.
//
//   load() -> normalized Features -> renderer -> entities on the globe
//
// One manager per viewer. It owns everything it adds (data sources, credits,
// input handlers) and removes it all in dispose(), which also makes it safe
// under React StrictMode, where the viewer is created, destroyed and recreated.

import * as Cesium from "cesium";
import { renderPoints } from "./renderPoints.js";

// Add a renderer here (lines, polygons, ...) to support new geometry types.
const RENDERERS = { point: renderPoints };

const FOCUS_PADDING = 0.25; // extra margin around the layer's extent, as a fraction
const MIN_FOCUS_SPAN = Cesium.Math.toRadians(0.5); // never zoom closer than ~55 km across
const FLY_SECONDS = 2.5;

const escapeHtml = (s) =>
  String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);

function extentOf(features) {
  const rect = Cesium.Rectangle.fromCartographicArray(
    features.map((f) => Cesium.Cartographic.fromDegrees(f.lon, f.lat))
  );
  const padLon = Math.max(rect.width * FOCUS_PADDING, MIN_FOCUS_SPAN / 2);
  const padLat = Math.max(rect.height * FOCUS_PADDING, MIN_FOCUS_SPAN / 2);
  return new Cesium.Rectangle(
    Math.max(rect.west - padLon, -Math.PI),
    Math.max(rect.south - padLat, -Cesium.Math.PI_OVER_TWO),
    Math.min(rect.east + padLon, Math.PI),
    Math.min(rect.north + padLat, Cesium.Math.PI_OVER_TWO)
  );
}

/**
 * @param {Cesium.Viewer} viewer
 * @param {{ onSelect?: (selection: object|null) => void,
 *           onLayersChange?: (layers: object[]) => void }} [callbacks]
 */
export function createLayerManager(viewer, { onSelect, onLayersChange } = {}) {
  const loaded = new Map(); // layer id -> { def, features, renderer, credit }
  const abort = new AbortController();
  const handler = new Cesium.ScreenSpaceEventHandler(viewer.canvas);
  let selected = null; // { layerId, featureId }
  let disposed = false;
  let moveFrame = 0;
  const movePosition = new Cesium.Cartesian2();

  // The viewer's default double-click locks the camera onto the clicked entity,
  // which would trap people on a marker. Selecting is handled by single click.
  viewer.screenSpaceEventHandler.removeInputAction(Cesium.ScreenSpaceEventType.LEFT_DOUBLE_CLICK);

  const emitLayers = () => {
    if (disposed) return;
    onLayersChange?.(
      [...loaded.values()].map(({ def, features }) => ({
        id: def.id,
        title: def.title,
        categories: def.categories
          .map((c) => ({ ...c, count: features.filter((f) => f.category === c.key).length }))
          .filter((c) => c.count > 0),
      }))
    );
  };

  function hitTest(windowPosition) {
    const picked = viewer.scene.pick(windowPosition);
    if (!Cesium.defined(picked) || !(picked.id instanceof Cesium.Entity)) return null;
    for (const [layerId, layer] of loaded) {
      const feature = layer.renderer.featureForEntityId(picked.id.id);
      if (feature) return { layerId, feature };
    }
    return null;
  }

  function clearSelection() {
    if (!selected) return;
    loaded.get(selected.layerId)?.renderer.setSelected(null);
    selected = null;
    if (!disposed) onSelect?.(null);
  }

  function select(layerId, feature) {
    const layer = loaded.get(layerId);
    if (!layer) return;
    if (selected) loaded.get(selected.layerId)?.renderer.setSelected(null);
    selected = { layerId, featureId: feature.id };
    layer.renderer.setSelected(feature.id);
    onSelect?.({
      layerId,
      layerTitle: layer.def.title,
      feature,
      color: layer.def.style(feature).color,
    });
  }

  function focus(layerId, { duration = FLY_SECONDS } = {}) {
    const layer = loaded.get(layerId);
    if (!layer || layer.features.length === 0 || viewer.isDestroyed()) return;
    viewer.camera.flyTo({ destination: extentOf(layer.features), duration });
  }

  handler.setInputAction(({ position }) => {
    const hit = hitTest(position);
    if (hit) select(hit.layerId, hit.feature);
    else clearSelection();
  }, Cesium.ScreenSpaceEventType.LEFT_CLICK);

  // Pointer cursor over markers; at most one pick per animation frame.
  handler.setInputAction(({ endPosition }) => {
    Cesium.Cartesian2.clone(endPosition, movePosition);
    if (moveFrame) return;
    moveFrame = requestAnimationFrame(() => {
      moveFrame = 0;
      if (disposed || viewer.isDestroyed()) return;
      viewer.canvas.style.cursor = hitTest(movePosition) ? "pointer" : "";
    });
  }, Cesium.ScreenSpaceEventType.MOUSE_MOVE);

  async function add(def) {
    const render = RENDERERS[def.geometry];
    if (!render) {
      console.error(`[EarthAPI] Layer "${def.title}": no renderer for geometry "${def.geometry}"`);
      return;
    }

    let result;
    try {
      result = await def.load({ signal: abort.signal });
    } catch (error) {
      if (abort.signal.aborted) return; // disposed while loading: nothing to report
      console.error(`[EarthAPI] Layer "${def.title}" failed to load`, error);
      return;
    }
    if (disposed || viewer.isDestroyed()) return;

    const { features, skipped = [] } = result;
    if (skipped.length) {
      console.warn(
        `[EarthAPI] Layer "${def.title}": skipped ${skipped.length} of ${features.length + skipped.length} records`,
        skipped
      );
    }

    const renderer = render(viewer, def, features);

    let credit = null;
    if (def.credit) {
      credit = new Cesium.Credit(
        `<a href="${escapeHtml(def.credit.href)}" target="_blank" rel="noopener noreferrer">${escapeHtml(def.credit.text)}</a>`,
        true
      );
      viewer.creditDisplay.addStaticCredit(credit);
    }

    loaded.set(def.id, { def, features, renderer, credit });
    emitLayers();
    if (def.focusOnLoad) focus(def.id);
  }

  function unload(layerId) {
    const layer = loaded.get(layerId);
    if (!layer) return;
    if (selected?.layerId === layerId) clearSelection();
    layer.renderer.dispose();
    if (layer.credit && !viewer.isDestroyed()) viewer.creditDisplay.removeStaticCredit(layer.credit);
    loaded.delete(layerId);
  }

  return {
    add,
    focus,
    select,
    clearSelection,

    remove(layerId) {
      unload(layerId);
      emitLayers();
    },

    setVisible(layerId, visible) {
      const layer = loaded.get(layerId);
      if (!layer) return;
      layer.renderer.dataSource.show = visible;
      if (!visible && selected?.layerId === layerId) clearSelection();
    },

    dispose() {
      if (disposed) return;
      abort.abort();
      disposed = true;
      cancelAnimationFrame(moveFrame);
      handler.destroy();
      for (const layerId of [...loaded.keys()]) unload(layerId);
      if (!viewer.isDestroyed()) viewer.canvas.style.cursor = "";
    },
  };
}
