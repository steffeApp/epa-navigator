import { useState, useEffect, useContext, useRef } from "react";
import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  Polyline,
} from "react-leaflet";
import L from "leaflet";
import polyline from "@mapbox/polyline";
import "leaflet/dist/leaflet.css";

import { MapContext } from "../App.jsx";
import { geocodeAddress, getEpaRoute } from "../api.js";

// ------------------------------------------------------
// Fix för standard-ikoner i Vite
// ------------------------------------------------------
import iconRetina from "leaflet/dist/images/marker-icon-2x.png";
import iconDefault from "leaflet/dist/images/marker-icon.png";
import shadow from "leaflet/dist/images/marker-shadow.png";

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: iconRetina,
  iconUrl: iconDefault,
  shadowUrl: shadow,
});

// ------------------------------------------------------
// Patch: roterbar karta (L.Map.rotateTo / setRotation)
// ------------------------------------------------------
if (!L.Map.prototype.rotateTo) {
  L.Map.include({
    _rotate: 0,

    setRotation: function (angle) {
      this._rotate = angle;
      this._applyRotation();
      return this;
    },

    getRotation: function () {
      return this._rotate || 0;
    },

    _applyRotation: function () {
      const pane = this._mapPane;
      if (!pane) return;

      const deg = this._rotate || 0;
      // pane.style.transformOrigin = "center center";
     // pane.style.transform = `rotate(${deg}deg)`;
    },

    rotateTo: function (angle, duration = 300) {
      const start = this.getRotation();
      const end = angle;
      const map = this;

      const startTime = performance.now();

      function step() {
        const now = performance.now();
        const t = Math.min(1, (now - startTime) / duration);
        const current = start + (end - start) * t;
        map.setRotation(current);
        if (t < 1) requestAnimationFrame(step);
      }

      requestAnimationFrame(step);
      return this;
    },
  });
}
/*
// ------------------------------------------------------
// Patch: roterbar marker (L.Marker.setRotationAngle)
// ------------------------------------------------------
if (!L.Marker.prototype.setRotationAngle) {
  const protoInitIcon = L.Marker.prototype._initIcon;
  const protoSetPos = L.Marker.prototype._setPos;

  L.Marker.addInitHook(function () {
    if (this.options && this.options.rotationAngle === undefined) {
      this.options.rotationAngle = 0;
    }
    if (this.options && !this.options.rotationOrigin) {
      this.options.rotationOrigin = "center";
    }
  });

  L.Marker.prototype._initIcon = function () {
    protoInitIcon.call(this);
    this._applyRotation();
  };

  L.Marker.prototype._setPos = function (pos) {
    protoSetPos.call(this, pos);
    this._applyRotation();
  };

  L.Marker.prototype.setRotationAngle = function (angle) {
    this.options.rotationAngle = angle;
    this._applyRotation();
  };

  L.Marker.prototype.setRotationOrigin = function (origin) {
    this.options.rotationOrigin = origin;
    this._applyRotation();
  };

  L.Marker.prototype._applyRotation = function () {
    if (!this._icon) return;
    const angle = this.options.rotationAngle || 0;
    const origin = this.options.rotationOrigin || "center";

    this._icon.style.transformOrigin = origin;
    this._icon.style.transform = `rotate(${angle}deg)`;
  };
}
*/
// ------------------------------------------------------
// LGF-ikon
// ------------------------------------------------------
const lgfIcon = L.icon({
  iconUrl: "/icons/lgf_transparent_40x40.png",
  iconSize: [40, 40],
  iconAnchor: [0, 0],
});

// ------------------------------------------------------
// Hjälpfunktioner (bearing + haversine + dist till rutt)
// ------------------------------------------------------
function bearing(lat1, lon1, lat2, lon2) {
  const toRad = (d) => (d * Math.PI) / 180;
  const y = Math.sin(toRad(lon2 - lon1)) * Math.cos(toRad(lat2));
  const x =
    Math.cos(toRad(lat1)) * Math.sin(toRad(lat2)) -
    Math.sin(toRad(lat1)) *
      Math.cos(toRad(lat2)) *
      Math.cos(toRad(lon2 - lon1));

  let ang = (Math.atan2(y, x) * 180) / Math.PI;
  if (ang < 0) ang += 360;
  return ang;
}

function haversine(lat1, lon1, lat2, lon2) {
  const R = 6371000;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;

  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) ** 2;

  return 2 * R * Math.asin(Math.sqrt(a));
}

function distanceFromRoute(point, route) {
  let minDist = Infinity;
  for (let i = 0; i < route.length; i++) {
    const [lat, lng] = route[i];
    const d = haversine(point.lat, point.lng, lat, lng);
    if (d < minDist) minDist = d;
  }
  return minDist;
}

function findNextPointOnRoute(pos, route) {
  if (!route || route.length < 2) return null;

  let closestIndex = 0;
  let minDist = Infinity;

  for (let i = 0; i < route.length; i++) {
    const [lat, lng] = route[i];
    const d = haversine(pos.lat, pos.lng, lat, lng);
    if (d < minDist) {
      minDist = d;
      closestIndex = i;
    }
  }

  const nextIndex =
    closestIndex < route.length - 1 ? closestIndex + 1 : closestIndex;
  return route[nextIndex];
}

// ------------------------------------------------------
// Komponent
// ------------------------------------------------------
export default function MapPage_Sim() {
  const { startAddress, endAddress, trigger } = useContext(MapContext);

  const [start, setStart] = useState(null);
  const [end, setEnd] = useState(null);
  const [route, setRoute] = useState([]);
  const [position, setPosition] = useState(null);
  const [duration, setDuration] = useState(null);
  const [distance, setDistance] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isSimulating, setIsSimulating] = useState(false);
  const [heading, setHeading] = useState(0);

  const simRef = useRef(null);
  const mapRef = useRef(null);
  const lastUpdateRef = useRef(Date.now());
  const lastRerouteRef = useRef(Date.now());
  const watchIdRef = useRef(null);

  // -----------------------
  // Starta rutt när 🚗 trycks
  // -----------------------
  useEffect(() => {
    async function run() {
      if (!endAddress) return;
      await startNavigation(startAddress, endAddress);
    }
    run();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [trigger]);

  async function startNavigation(startAddr, endAddr) {
    let startCoords = position;

    if (!startAddr && position) {
      startCoords = position;
    } else {
      startCoords = await geocodeAddress(startAddr);
    }

    const endCoords = await geocodeAddress(endAddr);

    if (!startCoords || !endCoords) {
      alert("Kunde inte hitta start eller mål.");
      return;
    }

    setStart(startCoords);
    setEnd(endCoords);
    await buildRoute(startCoords, endCoords);
  }

  // -----------------------
  // Bygg rutt + tid + distans
  // -----------------------
  async function buildRoute(startCoords, endCoords) {
    const data = await getEpaRoute(startCoords, endCoords);

    if (!data?.routes?.[0]) {
      alert("Ingen rutt hittades.");
      return;
    }

    const encoded = data.routes[0].geometry;
    const decoded = polyline.decode(encoded).map(([lat, lng]) => [lat, lng]);

    setRoute(decoded);

    const distanceKm =
      data.routes[0]?.summary?.distance ||
      data.routes[0]?.segments?.[0]?.distance ||
      0;

    const epaSpeed = 30;
    const durationMinutes = Math.round((distanceKm / epaSpeed) * 60);

    setDistance(distanceKm);
    setDuration(durationMinutes);

    // Auto-zoomar in på hela rutten
    setTimeout(() => {
      if (mapRef.current) {
        mapRef.current.fitBounds(decoded, { padding: [60, 60] });
      }
    }, 300);
  }

  // -----------------------
  // Initial position
  // -----------------------
  useEffect(() => {
   navigator.geolocation.getCurrentPosition(
  (pos) => {
    const coords = {
      lat: pos.coords.latitude,
      lng: pos.coords.longitude,
    };
    setPosition(coords);   // ← BEHÅLL detta
    // setStart(coords);   // ← TA BORT denna rad
    setLoading(false);
  },
  () => setLoading(false)
);
  }, []);

  // -----------------------
  // Live-GPS (om inte simulerar)
  // -----------------------
  useEffect(() => {
    if (isSimulating) return;
    if (!position) return;

    watchIdRef.current = navigator.geolocation.watchPosition(
      async (pos) => {
        const newPos = {
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
        };

        updatePositionAndRotation(newPos);

        if (route.length > 0) {
          if (Date.now() - lastUpdateRef.current < 3000) return;
          lastUpdateRef.current = Date.now();

          const dist = distanceFromRoute(newPos, route);
          if (dist > 40 && Date.now() - lastRerouteRef.current > 5000) {
            lastRerouteRef.current = Date.now();
            await buildRoute(newPos, end);
          }
        }
      },
      () => {},
      { enableHighAccuracy: true }
    );

    return () => {
      if (watchIdRef.current) {
        navigator.geolocation.clearWatch(watchIdRef.current);
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isSimulating, route, end]);

  // -----------------------
  // Uppdatera position + rotation + follow
  // -----------------------
  function updatePositionAndRotation(newPos) {
    setPosition(newPos);

    // Auto-follow: centrera kartan på bilen
    if (mapRef.current) {
      mapRef.current.setView(
        [newPos.lat, newPos.lng],
        mapRef.current.getZoom(),
        { animate: true }
      );
    }

    if (!route || route.length < 2) return;

    const next = findNextPointOnRoute(newPos, route);
    if (!next) return;

    const ang = bearing(newPos.lat, newPos.lng, next[0], next[1]);
    setHeading(ang);

    if (mapRef.current && typeof mapRef.current.rotateTo === "function") {
      mapRef.current.rotateTo(ang, 300);
    }
  }

  // -----------------------
  // Simulering
  // -----------------------
  function startSimulation() {
    if (route.length === 0) {
      alert("Starta en rutt först!");
      return;
    }

    setIsSimulating(true);

    let index = 0;

    simRef.current = setInterval(() => {
      if (index >= route.length) {
        clearInterval(simRef.current);
        setIsSimulating(false);
        return;
      }

      const [lat, lng] = route[index];
      updatePositionAndRotation({ lat, lng });

      index++;
    }, 1000);
  }

  // -----------------------
  // Render
  // -----------------------
  if (loading)
    return <div className="text-white p-4">Hämtar din position…</div>;

  return (
    <div className="p-2 h-full flex flex-col text-white">
      {/* HUD */}
      <div className="bg-gray-900/80 px-4 py-2 mb-3 rounded-xl shadow-md border border-gray-700 flex flex-row justify-between items-center">
        <div className="text-lg">
          ⏱️{" "}
          <span className="text-blue-400">
            {duration ? `${duration} min` : "—"}
          </span>
        </div>

        <div className="text-sm">
          📏{" "}
          <span className="text-blue-400">
            {distance ? `${distance.toFixed(1)} km` : "—"}
          </span>
        </div>

        <button
          onClick={startSimulation}
          disabled={isSimulating}
          className={`px-3 py-1 rounded-lg ${
            isSimulating ? "bg-gray-600" : "bg-blue-600 hover:bg-blue-700"
          }`}
        >
          {isSimulating ? "⏳ Simulerar…" : "▶️ Simulera"}
        </button>
      </div>

      {/* Karta */}
      <MapContainer
        center={position || [62.39, 17.3]}
        zoom={16}
        style={{ height: "calc(100vh - 120px)", width: "100%" }}
        whenCreated={(map) => {
          mapRef.current = map;
        }}
      >
        <TileLayer
          attribution="&copy; OpenStreetMap"
          url="https://tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {/* Roterbar LGF-ikon */}
        {position && (
          <Marker
            position={[position.lat, position.lng]}
            icon={lgfIcon}
            rotationAngle={heading}
            rotationOrigin="center center"
          >
            <Popup>Du är här 📍</Popup>
          </Marker>
        )}

        {start && (
          <Marker position={[start.lat, start.lng]}>
            <Popup>Start</Popup>
          </Marker>
        )}

        {end && (
          <Marker position={[end.lat, end.lng]}>
            <Popup>Mål</Popup>
          </Marker>
        )}

        {route.length > 0 && (
          <Polyline
            positions={route}
            pathOptions={{ color: "#1E3A8A", weight: 6 }}
          />
        )}
      </MapContainer>
    </div>
  );
}
