// Leaflet.Map.Rotate – rotate the map container using CSS transforms
// Standalone version adapted for direct browser use (no bundler required)

(function (factory) {
  if (typeof define === 'function' && define.amd) {
    define(['leaflet'], factory);
  } else if (typeof module !== 'undefined') {
    module.exports = factory(require('leaflet'));
  } else {
    if (typeof window.L === 'undefined') {
      throw new Error("Leaflet must be loaded first!");
    }
    factory(window.L);
  }
})(function (L) {

  L.Map.include({

    _rotate: 0,

    setRotation: function (angle) {
      this._rotate = angle;
      this._rotateMap();
      return this;
    },

    getRotation: function () {
      return this._rotate;
    },

    _rotateMap: function () {
      if (!this._mapPane) return;

      // Apply CSS transform (rotate around center)
      this._mapPane.style.transform = "rotate(" + this._rotate + "deg)";
      this._mapPane.style.transformOrigin = "center center";

      // Fix interactions (compensate for inverse rotation)
//
// NOTE: Events like drag/end may feel strange without compensation logic.
// For navigation apps this simplified model works fine and is very fast.
//

    },

    rotateTo: function (angle, duration) {
      duration = duration || 300;

      var start = this._rotate;
      var end = angle;
      var map = this;

      var startTime = performance.now();

      function animate() {
        var now = performance.now();
        var progress = Math.min(1, (now - startTime) / duration);
        var current = start + (end - start) * progress;

        map.setRotation(current);

        if (progress < 1) requestAnimationFrame(animate);
      }

      animate();
      return this;
    }

  });

});
