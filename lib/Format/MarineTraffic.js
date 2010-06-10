/**
 * @requires OpenLayers/Format/XML.js
 * @requires OpenLayers/Feature/Vector.js
 * @requires OpenLayers/Geometry/Point.js
 * @requires OpenLayers/Geometry/LineString.js
 * @requires OpenLayers/Projection.js
 */

/**
 * Class: OpenLayers.Format.MarineTraffic
 * Read/write MarineTraffic parser. Create a new instance with the
 *     <OpenLayers.Format.MarineTraffic> constructor.
 *
 * Inherits from:
 *  - <OpenLayers.Format.XML>
 */
OpenLayers.Format.MarineTraffic = OpenLayers.Class(OpenLayers.Format.XML, {
    /**
     * Constructor: OpenLayers.Format.MarineTraffic
     * Create a new parser for MarineTraffic.
     *
     * Parameters:
     * options - {Object} An optional object whose properties will be set on
     *     this instance.
     */
    initialize: function(options) {
        // MarineTraffic coordinates are always in longlat WGS84
        this.externalProjection = new OpenLayers.Projection("EPSG:4326");

        OpenLayers.Format.XML.prototype.initialize.apply(this, [options]);
    },

    /**
     * APIMethod: read
     * Return a list of features from a MarineTraffic doc
     *
     * Parameters:
     * doc - {Element}
     *
     * Returns:
     * An Array of <OpenLayers.Feature.Vector>s
     */
    read: function(doc) {
        if (typeof doc == "string") {
            doc = OpenLayers.Format.XML.prototype.read.apply(this, [doc]);
        }
        var features = [];

        var track = this.extractTrack(doc, "TRACK");
        var attrs = {};
        features.push(new OpenLayers.Feature.Vector(track, attrs, OpenLayers.Feature.Vector.style['default']));

        if (this.internalProjection && this.externalProjection) {
            for (var g = 0, featLength = features.length; g < featLength; g++) {
                features[g].geometry.transform(this.externalProjection,
                                    this.internalProjection);
            }
        }

        return features;
    },

   /**
    * Method: extractTrack
    *
    * Parameters:
    * segment - {<DOMElement>} a trkseg or rte node to parse
    * segmentType - {String} nodeName of waypoints that form the line
    *
    * Returns:
    * {<OpenLayers.Geometry.LineString>} A linestring geometry
    */
    extractTrack: function(segment, segmentType) {
        var track = this.getElementsByTagNameNS(segment, segment.namespaceURI, segmentType);
        var points = this.getElementsByTagNameNS(track[0], track[0].namespaceURI, "POS");
        var point_features = [];
        for (var i = 0, len = points.length; i < len; i++) {
            point_features.push(new OpenLayers.Geometry.Point(points[i].getAttribute("LON"), points[i].getAttribute("LAT")));
        }
        point_features.push(new OpenLayers.Geometry.LineString(point_features));
        return new OpenLayers.Geometry.Collection(point_features);
    },

    CLASS_NAME: "OpenLayers.Format.MarineTraffic"
});
