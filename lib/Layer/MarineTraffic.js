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
    loadAISXML: function() {
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
            this.loadAISXML();
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
        this.features = format.read(doc);

        this.addFeatures(this.features);

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
