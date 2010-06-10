function init() {
  var map, layer;
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
      new OpenLayers.Control.ZoomBox()
    ]
  });


  layer = new OpenLayers.Layer.WMS( "OpenLayers WMS", "http://labs.metacarta.com/wms/vmap0?", {layers: 'basic'});
  map.addLayer(layer);
  layer = new OpenLayers.Layer.MarineTraffic( "Mavi Marmara", "data/D6FU2-20100531.xml");
  map.addLayer(layer);

  layer = new OpenLayers.Layer.MarineTraffic( "Eleftheri Mesogeios A", "data/SW6923-20100531a.xml");
  map.addLayer(layer);
  layer = new OpenLayers.Layer.MarineTraffic( "Eleftheri Mesogeios B", "data/SW6923-20100531.xml");
  map.addLayer(layer);

  layer = new OpenLayers.Layer.MarineTraffic( "Defne Y A", "data/T3SX-20100531a.xml");
  map.addLayer(layer);
  layer = new OpenLayers.Layer.MarineTraffic( "Defne Y B", "data/T3SX-20100531.xml");
  map.addLayer(layer);


  map.setCenter(new OpenLayers.LonLat(34, 32), 0);
  map.zoomTo(9);
};
