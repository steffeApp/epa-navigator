import { useState, useEffect, useContext, useRef } from "react";
import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  Polyline,
  useMap,
} from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import polyline from "@mapbox/polyline";
import { getEpaRoute, geocodeAddress } from "../api.js";
import { MapContext } from "../App.jsx";

// 📌 Leaflet standardikoner (Vite-fix)
import iconRetina from "leaflet/dist/images/marker-icon-2x.png";
import iconDefault from "leaflet/dist/images/marker-icon.png";
import shadow from "leaflet/dist/images/marker-shadow.png";

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: iconRetina,
  iconUrl: iconDefault,
  shadowUrl: shadow,
});

// 🔹 Håller kartan centrerad
function RecenterMap({ position }) {
  const map = useMap();
  useEffect(() => {
    if (position) map.setView(position, map.getZoom());
  }, [position]);
  return null;
}

// 🔹 Dynamiskt zoom på rutt
function FitBoundsOnRoute({ route }) {
  const map = useMap();
  useEffect(() => {
    if (route && route.length > 1) {
      map.fitBounds(route, { padding: [50, 50] });
    }
  }, [route]);
  return null;
}

export default function MapPage_B() {
  const [start, setStart] = useState(null);
  const [end, setEnd] = useState(null);
  const [route, setRoute] = useState([]);
  const [position, setPosition] = useState(null);
  const [duration, setDuration] = useState(null);
  const [distance, setDistance] = useState(null);
  const [loading, setLoading] = useState(true);

  const watchIdRef = useRef(null);
  const lastUpdateRef = useRef(Date.now());
  const lastRerouteRef = useRef(Date.now());

  const { startAddress, endAddress, trigger } = useContext(MapContext);

  // -------------------------------------------------------
  // 🧭 1. Kör rutt-beräkning när användaren trycker “🚗”
  // -------------------------------------------------------
  useEffect(() => {
    async function runRoute() {
      if (!endAddress) return;
      await startNavigation(startAddress, endAddress);
    }
    runRoute();
  }, [trigger]);

  async function startNavigation(startAddr, endAddr) {
    let startCoords = null;

    if (!startAddr && position) {
      startCoords = position;
    } else {
      startCoords = await geocodeAddress(startAddr);
    }
    const endCoords = await geocodeAddress(endAddr);

    if (!startCoords || !endCoords) {
      alert("Kunde inte hitta position/koordinater.");
      return;
    }

    await buildRoute(startCoords, endCoords);
  }

  // -------------------------------------------------------
  // 🛣️ 2. Bygg rutt + tid + distans
  // -------------------------------------------------------
  async function buildRoute(startCoords, endCoords) {
    const data = await getEpaRoute(startCoords, endCoords);

    if (!data?.routes?.[0]) {
      alert("Ingen rutt kunde hittas");
      return;
    }

    const encoded = data.routes[0].geometry;
    const decoded = polyline.decode(encoded).map(([lat, lng]) => [lat, lng]);

    setRoute(decoded);
    setStart(startCoords);
    setEnd(endCoords);

    const distanceKm =
      data.routes[0]?.summary?.distance ||
      data.routes[0]?.segments?.[0]?.distance ||
      0;

    const epaSpeed = 30;
    const durationHours = distanceKm / epaSpeed;
    const durationMinutes = Math.round(durationHours * 60);

    setDistance(distanceKm);
    setDuration(durationMinutes);
  }

  // -------------------------------------------------------
  // 📍 3. Live-position via watchPosition
  // -------------------------------------------------------
  useEffect(() => {
    watchIdRef.current = navigator.geolocation.watchPosition(
      async (pos) => {
        const newPos = {
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
        };

        setPosition(newPos);

        // Kolla avvikelse var 3:e sekund
        if (Date.now() - lastUpdateRef.current < 3000) return;
        lastUpdateRef.current = Date.now();

        if (route.length > 0) {
          const dist = distanceFromRoute(newPos, route);
          const REROUTE_THRESHOLD = 40; // meter

          if (dist > REROUTE_THRESHOLD) {
            // Undvik spam
            if (Date.now() - lastRerouteRef.current > 5000) {
              lastRerouteRef.current = Date.now();
              await buildRoute(newPos, end);
            }
          }
        }
      },
      () => console.log("Kan inte hämta GPS"),
      { enableHighAccuracy: true, maximumAge: 0, timeout: 20000 }
    );

    return () => {
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current);
      }
    };
  }, [route, end]);

  // -------------------------------------------------------
  // 📐 4. Beräkna avstånd från position → närmaste punkt i rutt
  // -------------------------------------------------------
  function distanceFromRoute(point, routePoints) {
    let minDist = Infinity;

    for (let i = 0; i < routePoints.length; i++) {
      const [lat, lng] = routePoints[i];
      const d = haversine(point.lat, point.lng, lat, lng);
      if (d < minDist) minDist = d;
    }
    return minDist;
  }

  function haversine(lat1, lon1, lat2, lon2) {
    const R = 6371000; // meter
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLon = ((lon2 - lon1) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) ** 2 +
      Math.cos(lat1 * Math.PI / 180) *
        Math.cos(lat2 * Math.PI / 180) *
        Math.sin(dLon / 2) ** 2;
    return 2 * R * Math.asin(Math.sqrt(a));
  }

  // -------------------------------------------------------
  // 🛰️ 5. Hämta initial position
  // -------------------------------------------------------
  useEffect(() => {
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const coords = {
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
        };
        setPosition(coords);
        setStart(coords);
        setLoading(false);
      },
      () => setLoading(false)
    );
  }, []);

  if (loading) return <div className="text-white p-4">Hämtar din position...</div>;

  // -------------------------------------------------------
  // 🌍 UI & Karta
  // -------------------------------------------------------
  return (
    <div className="p-2 h-full flex flex-col text-white">

      {/* HUD */}
      <div className="bg-gray-900/80 px-4 py-2 mb-3 rounded-xl shadow-md border border-gray-700 flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div className="text-lg">
          ⏱️ <span className="font-semibold text-blue-400">
            {duration !== null ? `${duration} min` : "—"}
          </span>
        </div>

        <div className="text-sm text-gray-300 mt-1 sm:mt-0">
          📏 Sträcka: <span className="text-blue-400 font-medium">
            {distance !== null ? `${distance.toFixed(1)} km` : "—"}
          </span>
        </div>
      </div>

      <MapContainer
        center={position || [62.39, 17.3]}
        zoom={14}
        className="flex-1 rounded-2xl overflow-hidden shadow-lg"
        style={{ height: "calc(100vh - 120px)", width: "100%" }}
      >
        <TileLayer
          attribution='&copy; OpenStreetMap'
          url="https://tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        <RecenterMap position={position} />
        <FitBoundsOnRoute route={route} />

        {position && (
          <Marker position={[position.lat, position.lng]}>
            <Popup>Du är här 📍</Popup>
          </Marker>
        )}

        {start && start !== position && (
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
            pathOptions={{ color: "#1E3A8A", weight: 6, opacity: 0.9 }}
          />
        )}
      </MapContainer>
    </div>
  );
}
