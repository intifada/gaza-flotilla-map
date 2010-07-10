function init() {
  var map,
    layers,
    selectControl,
    onFeatureSelect,
    onFeatureUnselect,
    selectedFeature,
    handleMeasurements,
    toggleControl,
    measureControls;

  map = new OpenLayers.Map('map', {
    controls: [
      new OpenLayers.Control.Graticule({
        numPoints: 2,
        labelled: true,
        visible: true
      }),
      new OpenLayers.Control.LayerSwitcher(),
      new OpenLayers.Control.PanZoomBar(),
      new OpenLayers.Control.Navigation(),
      new OpenLayers.Control.Scale(),
      new OpenLayers.Control.ZoomBox(),
      new OpenLayers.Control.MousePosition()
    ]
  });
  layers = [];

  onPopupClose = function (evt) {
      selectControl.unselect(selectedFeature);
  };

  onFeatureSelect = function (feature) {
      var html = '';
      selectedFeature = feature;
      html += 'Timestamp: ' + feature.data.timestamp + ' UTC<br />';
      html += 'Speed: ' +  (parseInt(feature.data.speed, 10)) / 10 + ' knots<br />';
      html += 'Course: ' + feature.data.course + '&deg;';

      popup = new OpenLayers.Popup.FramedCloud("position",
         feature.geometry.getBounds().getCenterLonLat(),
         null,
         html,
         null, true, onPopupClose);
      feature.popup = popup;
      map.addPopup(popup);
  };

  onFeatureUnselect = function (feature) {
      map.removePopup(feature.popup);
      feature.popup.destroy();
      feature.popup = null;
  };

            // style the sketch fancy
            var sketchSymbolizers = {
                "Point": {
                    pointRadius: 4,
                    graphicName: "square",
                    fillColor: "white",
                    fillOpacity: 1,
                    strokeWidth: 1,
                    strokeOpacity: 1,
                    strokeColor: "#333333"
                },
                "Line": {
                    strokeWidth: 3,
                    strokeOpacity: 1,
                    strokeColor: "#666666",
                    strokeDashstyle: "dash"
                },
                "Polygon": {
                    strokeWidth: 2,
                    strokeOpacity: 1,
                    strokeColor: "#666666",
                    fillColor: "white",
                    fillOpacity: 0.3
                }
            };
            var style = new OpenLayers.Style();
            style.addRules([
                new OpenLayers.Rule({symbolizer: sketchSymbolizers})
            ]);
            var styleMap = new OpenLayers.StyleMap({"default": style});

  handleMeasurements = function (event) {
      var geometry = event.geometry;
      var units = event.units;
      var order = event.order;
      var measure = event.measure;
      var element = document.getElementById('output');
      var out = "";
      if(order == 1) {
          out += "measure: " + measure.toFixed(3) + " " + units;
      } else {
          out += "measure: " + measure.toFixed(3) + " " + units + "<sup>2</" + "sup>";
      }
      element.innerHTML = out;
  };

  measureControl = new OpenLayers.Control.Measure(
      OpenLayers.Handler.Path, {
          persist: true,
          handlerOptions: {
              layerOptions: {styleMap: styleMap}
          }
      }
  );

  measureControl.events.on({
      "measure": handleMeasurements,
      "measurepartial": handleMeasurements
  });
  map.addControl(measureControl);

  map.addLayer(new OpenLayers.Layer.WMS(
      "OpenLayers WMS", "http://labs.metacarta.com/wms/vmap0?",
      {layers: 'basic'}));

  var layer_style = OpenLayers.Util.extend({}, OpenLayers.Feature.Vector.style['default']);

  var blue_style = OpenLayers.Util.extend({}, layer_style);
  blue_style.strokeColor = "blue";
  blue_style.fillColor = "blue";

  layers.push(new OpenLayers.Layer.MarineTraffic("Mavi Marmara",
    "data/D6FU2-20100531.xml",
    { formatOptions: { style: blue_style }, visibility: false }));

  var red_style = OpenLayers.Util.extend({}, OpenLayers.Feature.Vector.style['default']);
  red_style.strokeColor = "red";
  red_style.fillColor = "red";

  layers.push(new OpenLayers.Layer.MarineTraffic("Eleftheri Mesogeios A",
    "data/SW6923-20100531a.xml",
    { formatOptions: { style: red_style }, visibility: false }));
  layers.push(new OpenLayers.Layer.MarineTraffic("Eleftheri Mesogeios B",
    "data/SW6923-20100531.xml",
    { formatOptions: { style: red_style }, visibility: false }));

  var green_style = OpenLayers.Util.extend({}, OpenLayers.Feature.Vector.style['default']);
  green_style.strokeColor = "green";
  green_style.fillColor = "green";

  layers.push(new OpenLayers.Layer.MarineTraffic("Defne Y A",
    "data/T3SX-20100531a.xml",
    { formatOptions: { style: green_style }, visibility: false }));
  layers.push(new OpenLayers.Layer.MarineTraffic("Defne Y B",
    "data/T3SX-20100531.xml",
    { formatOptions: { style: green_style }, visibility: false }));

  map.addLayers(layers);

  selectControl = new OpenLayers.Control.SelectFeature(layers,
      {onSelect: onFeatureSelect, onUnselect: onFeatureUnselect, hover: true});

  map.addControl(selectControl);
  selectControl.activate();

  map.setCenter(new OpenLayers.LonLat(34, 32.5), 0);
  map.zoomTo(8);

  document.getElementById('noneToggle').checked = true;
  document.getElementById('noneToggle').onclick = function () {
    measureControl.deactivate();
  };
  document.getElementById('lineToggle').onclick = function () {
    measureControl.activate();
  };

}
