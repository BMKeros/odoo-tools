odoo.define('web_map.FieldMap', function (require) {
    "use strict";

    var field_registry = require('web.field_registry');
    var AbstractField = require('web.AbstractField');
    var FormController = require('web.FormController');

    FormController.include({
        _update: function () {
            var _super_update = this._super.apply(this, arguments);
            this.trigger('view_updated');
            return _super_update;
        },
    });

    var FieldMap = AbstractField.extend({
        template: 'FieldMap',
        start: function () {
            var self = this;

            this.getParent().getParent().on('view_updated', self, function () {
                self.update_map();
            });
            return this._super();
        },
        update_mode: function () {
            if (this.isMap) {
                if (this.mode === 'readonly') {
                    this.map.setOptions({
                        disableDoubleClickZoom: true,
                        draggable: false,
                        scrollwheel: false,
                    });
                    this.marker.setOptions({
                        draggable: false,
                        cursor: 'default',
                    });
                } else {
                    this.map.setOptions({
                        disableDoubleClickZoom: false,
                        draggable: true,
                        scrollwheel: true,
                    });
                    this.marker.setOptions({
                        draggable: true,
                        cursor: 'pointer',
                    });
                }
            }
        },
        update_map: function () {
            if (!this.isMap) {
                this.init_map();
            }
            this.update_mode();
        },
        init_map: function () {
            var self = this;

            this.defaults = {
                position: { lat: 0, lon: 0 },
                zoom: 2,
            };

            this.map = new google.maps.Map(this.el, {
                center: this.defaults.position,
                zoom: this.defaults.zoom,
                disableDefaultUI: true,
            });

            this.marker = new google.maps.Marker({
                position: this.defaults.position,
            });

            this.marker.setPosition({ 
                lat: this.attrs.latitude || this.defaults.position.lat,
                lon: this.attrs.longitude || this.defaults.position.lon
            });

            this.map.setCenter({ 
                lat: this.attrs.latitude || this.defaults.position.lat,
                lon: this.attrs.longitude || this.defaults.position.lon
            });

            this.map.setZoom(this.attrs.zoom || this.defaults.zoom);
            this.marker.setMap(this.map);

            this.map.addListener('click', function (e) {
                if (self.mode === 'edit' && self.marker.getMap() == null) {
                    self.marker.setPosition(e.latLng);
                    self.marker.setMap(self.map);
                    self._setValue(JSON.stringify({ position: self.marker.getPosition(), zoom: self.map.getZoom() }));
                }
            });

            this.map.addListener('zoom_changed', function () {
                if (self.mode === 'edit' && self.marker.getMap()) {
                    self._setValue(JSON.stringify({ position: self.marker.getPosition(), zoom: self.map.getZoom() }));
                }
            });

            this.marker.addListener('click', function () {
                if (self.mode === 'edit') {
                    self.marker.setMap(null);
                    self._setValue(false);
                }
            });

            this.marker.addListener('dragend', function () {
                self._setValue(JSON.stringify({ position: self.marker.getPosition(), zoom: self.map.getZoom() }));
            });

            this.isMap = true;
        }
    });

    field_registry.add('map', FieldMap);

    return {
        FieldMap: FieldMap,
    };
});