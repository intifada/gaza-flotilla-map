/**
 * @requires OpenLayers/Format/XML.js
 * @requires OpenLayers/Feature/Vector.js
 * @requires OpenLayers/Geometry/Point.js
 * @requires OpenLayers/Geometry/LineString.js
 * @requires OpenLayers/Geometry/Polygon.js
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
     * Property: styles
     * {Object} Storage of style objects
     *
     */
    style: null,

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
     * Method: createGeometryFromPosition
     * Return a geometry from a GeoRSS Item.
     *
     * Parameters:
     * item - {DOMElement} A GeoRSS item node.
     *
     * Returns:
     * {<OpenLayers.Geometry>} A geometry representing the node.
     */
    createGeometryFromPosition: function(position) {
        var lat, lon;
        lat = position.getAttribute("LAT");
        lon = position.getAttribute("LON");

        var geometry = new OpenLayers.Geometry.Point(parseFloat(lon), parseFloat(lat));

        if (geometry && this.internalProjection && this.externalProjection) {
            geometry.transform(this.externalProjection,
                               this.internalProjection);
        }

        return geometry;
    },

    /**
     * Method: createFeatureFromPosition
     * Return a feature from a GeoRSS Item.
     *
     * Parameters:
     * item - {DOMElement} A GeoRSS item node.
     *
     * Returns:
     * {<OpenLayers.Feature.Vector>} A feature representing the position.
     */
    createFeatureFromPosition: function(position) {
        var geometry = this.createGeometryFromPosition(position);
        var data = {
            speed: position.getAttribute('SPEED'),
            course: position.getAttribute('COURSE'),
            timestamp: position.getAttribute('TIMESTAMP')
        };
        var feature = new OpenLayers.Feature.Vector(geometry, data, this.style);
        return feature;
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

        var track = this.getElementsByTagNameNS(doc, '*', 'TRACK');

        var numItems = track.length;
        var features = [];
        for(var i=0; i<numItems; i++) {
            var points = [];
            var positions = this.getElementsByTagNameNS(track[i],
                                                        track[i].namespaceURI,
                                                        "POS");
            if (positions.length > 0) {
                points = new Array(positions.length);
                for(var j=0; j<positions.length; j++) {
                    points[j] = this.createGeometryFromPosition(positions[j]);
                    features.push(this.createFeatureFromPosition(positions[j]));
                }
            }

            features.push(new OpenLayers.Geometry.LineString(points));
        }

        return features;
    },

    CLASS_NAME: "OpenLayers.Format.MarineTraffic"
});
