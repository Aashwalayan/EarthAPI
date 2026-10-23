import { useEffect, useRef } from "react";
import * as Cesium from "cesium";
import { IMAGERY, HOME_VIEW } from "../globe/config.js";
import { resetLayers } from "../globe/layers.js";

// Renders the globe. `onReady(viewer)` fires once the viewer exists,
// which is where you attach data layers from APIs.
export default function Globe({ onReady }) {
  const containerRef = useRef(null);

  useEffect(() => {
    const homeDestination = () =>
      Cesium.Cartesian3.fromDegrees(HOME_VIEW.lon, HOME_VIEW.lat, HOME_VIEW.height);

    const viewer = new Cesium.Viewer(containerRef.current, {
      baseLayer: new Cesium.ImageryLayer(
        new Cesium.UrlTemplateImageryProvider({
          url: IMAGERY.url,
          maximumLevel: IMAGERY.maximumLevel,
          credit: IMAGERY.credit,
        })
      ),
      baseLayerPicker: false, // we supply our own imagery (no Cesium ion needed)
      geocoder: false,        // search needs an ion token; enable later if wanted
      animation: false,
      timeline: false,
      infoBox: false,
      selectionIndicator: false,
      navigationHelpButton: false,
    });

    const { scene } = viewer;
    scene.globe.enableLighting = false;
    scene.globe.showGroundAtmosphere = true;
    scene.skyAtmosphere.show = true;
    scene.globe.baseColor = Cesium.Color.fromCssColorString("#0b1d33");
    scene.screenSpaceCameraController.minimumZoomDistance = 200;

    viewer.camera.setView({ destination: homeDestination() });

    // Home button returns to our starting view.
    viewer.homeButton.viewModel.command.beforeExecute.addEventListener((e) => {
      e.cancel = true;
      viewer.camera.flyTo({ destination: homeDestination() });
    });

    onReady?.(viewer);

    return () => {
      resetLayers();
      if (!viewer.isDestroyed()) viewer.destroy();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return <div ref={containerRef} style={{ width: "100%", height: "100%" }} />;
}
