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
        return new OpenLayers.Geometry.LineString(point_features);
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


/* Copyright (c) 2006-2008 MetaCarta, Inc., published under the Clear BSD
 * license.  See http://svn.openlayers.org/trunk/openlayers/license.txt for the
 * full text of the license. */


/**
 * @requires OpenLayers/Layer/Vector.js
 * @requires OpenLayers/Request/XMLHttpRequest.js
 * @requires OpenLayers/Console.js
 */

/**
 * Class: OpenLayers.Layer.MarineTraffic
 * Add MarineTraffic Point features to your map.
 *
 * Inherits from:
 *  - <OpenLayers.Layer.Vector>
 */
OpenLayers.Layer.MarineTraffic = OpenLayers.Class(OpenLayers.Layer.Vector, {

    /**
     * Property: location
     * {String} store url of text file
     */
    location: null,

    /**
     * Property: features
     * {Array(<OpenLayers.Feature>)}
     */
    features: null,

    /**
     * APIProperty: formatOptions
     * {Object} Hash of options which should be passed to the format when it is
     * created. Must be passed in the constructor.
     */
    formatOptions: null,

    /**
     * Property: selectedFeature
     * {<OpenLayers.Feature>}
     */
    selectedFeature: null,

    /**
     * APIProperty: icon
     * {<OpenLayers.Icon>}. This determines the Icon to be used on the map
     * for this MarineTraffic layer.
     */
    icon: null,

    /**
     * APIProperty: popupSize
     * {<OpenLayers.Size>} This determines the size of MarineTraffic popups. If
     * not provided, defaults to 250px by 120px.
     */
    popupSize: null,

    /**
     * APIProperty: useFeedTitle
     * {Boolean} Set layer.name to the first <title> element in the feed. Default is true.
     */
    useFeedTitle: true,

    /**
    * Constructor: OpenLayers.Layer.MarineTraffic
    * Create a MarineTraffic Layer.
    *
    * Parameters:
    * name - {String}
    * location - {String}
    * options - {Object}
    */
    initialize: function(name, location, options) {
        var newArguments = [];
        newArguments.push(name, options);
        OpenLayers.Layer.Vector.prototype.initialize.apply(this, newArguments);
        this.location = location;
        this.features = [];
    },

    /**
     * Method: destroy
     */
    destroy: function() {
        // Warning: Layer.Vector.destroy() must be called prior to calling
        // clearFeatures() here, otherwise we leak memory. Indeed, if
        // Layer.Vector.destroy() is called after clearFeatures(), it won't be
        // able to remove the marker image elements from the layer's div since
        // the vectors will have been destroyed by clearFeatures().
        OpenLayers.Layer.Vector.prototype.destroy.apply(this, arguments);
        this.clearFeatures();
        this.features = null;
    },

    /**
     * Method: loadRSS
     * Start the load of the RSS data. Don't do this when we first add the layer,
     * since we may not be visible at any point, and it would therefore be a waste.
     */
    loadRSS: function() {
        if (!this.loaded) {
            this.events.triggerEvent("loadstart");
            OpenLayers.Request.GET({
                url: this.location,
                success: this.parseData,
                scope: this
            });
            this.loaded = true;
        }
    },

    /**
     * Method: moveTo
     * If layer is visible and RSS has not been loaded, load RSS.
     *
     * Parameters:
     * bounds - {Object}
     * zoomChanged - {Object}
     * minor - {Object}
     */
    moveTo:function(bounds, zoomChanged, minor) {
        OpenLayers.Layer.Vector.prototype.moveTo.apply(this, arguments);
        if(this.visibility && !this.loaded){
            this.loadRSS();
        }
    },

    /**
     * Method: parseData
     * Parse the data returned from the Events call.
     *
     * Parameters:
     * ajaxRequest - {<OpenLayers.Request.XMLHttpRequest>}
     */
    parseData: function(ajaxRequest) {
        var doc = ajaxRequest.responseXML;
        if (!doc || !doc.documentElement) {
            doc = OpenLayers.Format.XML.prototype.read(ajaxRequest.responseText);
        }

        var options = {};

        OpenLayers.Util.extend(options, this.formatOptions);

        if (this.map && !this.projection.equals(this.map.getProjectionObject())) {
            options.externalProjection = this.projection;
            options.internalProjection = this.map.getProjectionObject();
        }

        var format = new OpenLayers.Format.MarineTraffic(options);
        var features = format.read(doc);

        for (var i=0, len=features.length; i<len; i++) {
            var data = {};
            var feature = features[i];

            // we don't support features with no geometry in the MarineTraffic
            // layer at this time.
            if (!feature.geometry) {
                continue;
            }
            this.addFeatures(feature);
        }
        this.events.triggerEvent("loadend");
    },

    /**
     * Method: markerClick
     *
     * Parameters:
     * evt - {Event}
     */
    markerClick: function(evt) {
        var sameMarkerClicked = (this == this.layer.selectedFeature);
        this.layer.selectedFeature = (!sameMarkerClicked) ? this : null;
        for(var i=0, len=this.layer.map.popups.length; i<len; i++) {
            this.layer.map.removePopup(this.layer.map.popups[i]);
        }
        if (!sameMarkerClicked) {
            var popup = this.createPopup();
            OpenLayers.Event.observe(popup.div, "click",
                OpenLayers.Function.bind(function() {
                    for(var i=0, len=this.layer.map.popups.length; i<len; i++) {
                        this.layer.map.removePopup(this.layer.map.popups[i]);
                    }
                }, this)
            );
            this.layer.map.addPopup(popup);
        }
        OpenLayers.Event.stop(evt);
    },

    /**
     * Method: clearFeatures
     * Destroy all features in this layer.
     */
    clearFeatures: function() {
        if (this.features != null) {
            while(this.features.length > 0) {
                var feature = this.features[0];
                OpenLayers.Util.removeItem(this.features, feature);
                feature.destroy();
            }
        }
    },

    CLASS_NAME: "OpenLayers.Layer.MarineTraffic"
});
