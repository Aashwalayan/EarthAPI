// Registry of layers shown on the globe, in drawing order.
//
// A layer definition is a plain object:
//   id, title          identity and display name
//   geometry           "point" today; add a renderer in globe/LayerManager.js for lines/polygons
//   categories         [{ key, label, color }] used by the legend
//   style(feature)     -> { color, size, labelRange }  (for the point renderer)
//   credit             { text, href } shown in the globe's credit bar
//   focusOnLoad        fly the camera to the layer when it loads
//   load({ signal })   -> Promise<{ features, skipped }>   (retrieval + normalization)
//
// To add a dataset: create src/layers/<name>/ with a normalizer that outputs
// Features (see feature.js), a style, and an index.js like the one below, then
// list it here.

import chhattisgarh from "./chhattisgarh/index.js";

export const LAYERS = [chhattisgarh];
