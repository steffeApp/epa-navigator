(function(factory) {
  if (typeof define === 'function' && define.amd) {
    // AMD
    define(['leaflet'], factory);
  } else if (typeof module !== 'undefined') {
    // Node/CommonJS
    module.exports = factory(require('leaflet'));
  } else {
    // Browser globals
    if (typeof window.L === 'undefined') {
      throw new Error("Leaflet must be loaded first!");
    }
    factory(window.L);
  }
})(function(L) {

  // Save original initialization
  var proto_initIcon = L.Marker.prototype._initIcon;
  var proto_setPos = L.Marker.prototype._setPos;

  // Override marker init
  L.Marker.addInitHook(function () {
    var iconOptions = this.options.icon && this.options.icon.options;
    var rotationEnabled = iconOptions && iconOptions.rotationAngle !== undefined;

    if (rotationEnabled) {
      this.options.rotationAngle = this.options.rotationAngle || 0;
      this.options.rotationOrigin = this.options.rotationOrigin || 'center';
    }
  });

  // Override to set rotation on icon creation
  L.Marker.prototype._initIcon = function () {
    proto_initIcon.call(this);

    if (this.options.rotationAngle) {
      this._applyRotation();
    }
  };

  // Override to rotate marker when it moves
  L.Marker.prototype._setPos = function (pos) {
    proto_setPos.call(this, pos);
    this._applyRotation();
  };

  // Rotation handler
  L.Marker.prototype._applyRotation = function () {
    if (this._icon && this.options.rotationAngle) {
      this._icon.style[L.DomUtil.TRANSFORM + 'Origin'] = this.options.rotationOrigin;
      this._icon.style[L.DomUtil.TRANSFORM] += ' rotate(' + this.options.rotationAngle + 'deg)';
    }
  };

});
