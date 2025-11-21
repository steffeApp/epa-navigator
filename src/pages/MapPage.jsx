import { useState, useEffect, useContext } from "react";
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

// 📌 FIX FÖR VITE – gör att Leaflets standardmarkör fungerar
import iconRetina from "leaflet/dist/images/marker-icon-2x.png";
import iconDefault from "leaflet/dist/images/marker-icon.png";
import shadow from "leaflet/dist/images/marker-shadow.png";

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: iconRetina,
  iconUrl: iconDefault,
  shadowUrl: shadow,
});

// 🔹 Håller kartan centrerad på användaren
function RecenterMap({ position }) {
  const map = useMap();
  useEffect(() => {
    if (position) map.setView(position, map.getZoom());
  }, [position, map]);
  return null;
}

// 🔹 Anpassar zoomnivå baserat på rutten
function FitBoundsOnRoute({ route }) {
  const map = useMap();
  useEffect(() => {
    if (route && route.length > 1) {
      const bounds = route.map(([lat, lng]) => [lat, lng]);
      map.fitBounds(bounds, { padding: [50, 50] });
    }
  }, [route, map]);
  return null;
}

export default function MapPage() {
  const [start, setStart] = useState(null);
  const [end, setEnd] = useState(null);
  const [route, setRoute] = useState([]);
  const [position, setPosition] = useState(null);
  const [loading, setLoading] = useState(true);
  const [duration, setDuration] = useState(null);
  const [distance, setDistance] = useState(null);

  const { startAddress, endAddress, trigger } = useContext(MapContext);

  // 🔁 Starta navigation när användaren trycker på “🚗”
  useEffect(() => {
    async function runRoute() {
      if (!endAddress) return;
      await startNavigationFromAddresses(startAddress, endAddress);
    }
    runRoute();
  }, [trigger]);

  // 🚦 Hämta rutt
  async function startNavigationFromAddresses(startAddr, endAddr) {
    let startCoords = null;

    if (!startAddr && position) {
      startCoords = position;
    } else {
      startCoords = await geocodeAddress(startAddr);
    }

    const endCoords = await geocodeAddress(endAddr);

    if (!startCoords || !endCoords) {
      alert("Kunde inte hitta start- eller målkoordinater.");
      return;
    }

    const data = await getEpaRoute(startCoords, endCoords);

    if (data && data.routes?.[0]) {
      const encoded = data.routes[0].geometry;
      const decoded = polyline.decode(encoded).map(([lat, lng]) => [lat, lng]);
      setRoute(decoded);
      setStart(startCoords);
      setEnd(endCoords);

      // 🧮 Avstånd & tid
      const distanceKm =
        data.routes[0]?.summary?.distance ||
        data.routes[0]?.segments?.[0]?.distance ||
        0;

      const epaSpeed = 30;
      const durationHours = distanceKm / epaSpeed;
      const durationMinutes = Math.round(durationHours * 60);

      setDistance(distanceKm);
      setDuration(durationMinutes);
    } else {
      alert("Ingen rutt kunde beräknas 😕");
    }
  }

  // 📍 Hämta användarens plats vid start
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

  return (
    <div className="p-2 h-full flex flex-col text-white">

      {/* 🧭 Info-ruta */}
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

      {/* 🗺️ Karta */}
      <MapContainer
        center={position || [62.39, 17.3]}
        zoom={13}
        className="flex-1 rounded-2xl overflow-hidden shadow-lg"
        style={{ height: "calc(100vh - 120px)", width: "100%" }}
      >
        <TileLayer
          attribution='&copy; OpenStreetMap'
          url="https://tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        <RecenterMap position={position} />
        <FitBoundsOnRoute route={route} />

        {/* Markörer med standard-ikoner */}
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

        {/* Färdväg */}
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
