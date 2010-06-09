function init() {
  var map, layer;
  map = new OpenLayers.Map('map');

  layer = new OpenLayers.Layer.WMS( "OpenLayers WMS", "http://labs.metacarta.com/wms/vmap0?", {layers: 'basic'});
  map.addLayer(layer);
  layer = new OpenLayers.Layer.MarineTraffic( "Mavi Marmara", "data/D6FU2-20100531.xml");
  map.addLayer(layer);

  map.setCenter(new OpenLayers.LonLat(0, 0), 0);
  map.addControl(new OpenLayers.Control.LayerSwitcher());
};
