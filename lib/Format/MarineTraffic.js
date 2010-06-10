/* Copyright (c) 2006-2007 MetaCarta, Inc., published under a modified BSD license.
 * See http://svn.openlayers.org/trunk/openlayers/repository-license.txt
 * for the full text of the license. */

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
    * APIProperty: extractWaypoints
    * {Boolean} Extract waypoints from MarineTraffic. (default: true)
    */
    extractWaypoints: false,

   /**
    * APIProperty: extractTracks
    * {Boolean} Extract tracks from MarineTraffic. (default: true)
    */
    extractTracks: true,

   /**
    * APIProperty: extractRoutes
    * {Boolean} Extract routes from MarineTraffic. (default: true)
    */
    extractRoutes: false,

    /**
     * APIProperty: extractAttributes
     * {Boolean} Extract feature attributes from MarineTraffic. (default: true)
     *     NOTE: Attributes as part of extensions to the MarineTraffic standard
     *     may not be extracted.
     */
    extractAttributes: false,

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

        if(this.extractTracks) {
            var track = this.extractSegment(doc, "TRACK");
            var attrs = {};
            features.push(new OpenLayers.Feature.Vector(track, attrs, OpenLayers.Feature.Vector.style['default']));
        }

        if(this.extractRoutes) {
            var routes = doc.getElementsByTagName("rte");
            for (var k=0, klen=routes.length; k<klen; k++) {
                var attrs = {};
                if(this.extractAttributes) {
                    attrs = this.parseAttributes(routes[k]);
                }
                var route = this.extractSegment(routes[k], "rtept");
                features.push(new OpenLayers.Feature.Vector(route, attrs));
            }
        }

        if(this.extractWaypoints) {
            var waypoints = doc.getElementsByTagName("wpt");
            for (var l = 0, len = waypoints.length; l < len; l++) {
                var attrs = {};
                if(this.extractAttributes) {
                    attrs = this.parseAttributes(waypoints[l]);
                }
                var wpt = new OpenLayers.Geometry.Point(waypoints[l].getAttribute("lon"), waypoints[l].getAttribute("lat"));
                features.push(new OpenLayers.Feature.Vector(wpt, attrs));
            }
        }

        if (this.internalProjection && this.externalProjection) {
            for (var g = 0, featLength = features.length; g < featLength; g++) {
                features[g].geometry.transform(this.externalProjection,
                                    this.internalProjection);
            }
        }

        return features;
    },

   /**
    * Method: extractSegment
    *
    * Parameters:
    * segment - {<DOMElement>} a trkseg or rte node to parse
    * segmentType - {String} nodeName of waypoints that form the line
    *
    * Returns:
    * {<OpenLayers.Geometry.LineString>} A linestring geometry
    */
    extractSegment: function(segment, segmentType) {
        var track = this.getElementsByTagNameNS(segment, segment.namespaceURI, segmentType);
        var points = this.getElementsByTagNameNS(track[0], track[0].namespaceURI, "POS");
        var point_features = [];
        for (var i = 0, len = points.length; i < len; i++) {
            point_features.push(new OpenLayers.Geometry.Point(points[i].getAttribute("LON"), points[i].getAttribute("LAT")));
        }
        point_features.push(new OpenLayers.Geometry.LineString(point_features));
        return new OpenLayers.Geometry.Collection(point_features);
    },

    /**
     * Method: parseAttributes
     *
     * Parameters:
     * node - {<DOMElement>}
     *
     * Returns:
     * {Object} An attributes object.
     */
    parseAttributes: function(node) {
        // node is either a wpt, trk or rte
        // attributes are children of the form <attr>value</attr>
        var attributes = {};
        var attrNode = node.firstChild;
        while(attrNode) {
            if(attrNode.nodeType == 1) {
                var value = attrNode.firstChild;
                if(value.nodeType == 3 || value.nodeType == 4) {
                    name = (attrNode.prefix) ?
                        attrNode.nodeName.split(":")[1] :
                        attrNode.nodeName;
                    if(name != "trkseg" && name != "rtept") {
                        attributes[name] = value.nodeValue;
                    }
                }
            }
            attrNode = attrNode.nextSibling;
        }
        return attributes;
    },

    CLASS_NAME: "OpenLayers.Format.MarineTraffic"
});
