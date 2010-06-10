function init() {
  var map, layers, selectControl, onFeatureSelect, onFeatureUnselect, selectedFeature;

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
      html += 'Timestamp: ' + feature.data.timestamp + '<br />';
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


  map.addLayer(new OpenLayers.Layer.WMS(
      "OpenLayers WMS", "http://labs.metacarta.com/wms/vmap0?",
      {layers: 'basic'}));

  layers.push(new OpenLayers.Layer.MarineTraffic( "Mavi Marmara", "data/D6FU2-20100531.xml"));
  layers.push(new OpenLayers.Layer.MarineTraffic( "Eleftheri Mesogeios A", "data/SW6923-20100531a.xml"));
  layers.push(new OpenLayers.Layer.MarineTraffic( "Eleftheri Mesogeios B", "data/SW6923-20100531.xml"));
  layers.push(new OpenLayers.Layer.MarineTraffic( "Defne Y A", "data/T3SX-20100531a.xml"));
  layers.push(new OpenLayers.Layer.MarineTraffic( "Defne Y B", "data/T3SX-20100531.xml"));
  map.addLayers(layers);

  selectControl = new OpenLayers.Control.SelectFeature(layers,
      {onSelect: onFeatureSelect, onUnselect: onFeatureUnselect});

  map.addControl(selectControl);
  selectControl.activate();

  map.setCenter(new OpenLayers.LonLat(34, 32), 0);
  map.zoomTo(9);
}
