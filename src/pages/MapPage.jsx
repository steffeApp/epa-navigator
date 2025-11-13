import { useState, useEffect, useContext } from "react";
import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  Polyline,
  useMap,
} from "react-leaflet";
import "leaflet/dist/leaflet.css";
import polyline from "@mapbox/polyline";
import { getEpaRoute, geocodeAddress } from "../api.js";
import { MapContext } from "../App.jsx";

// 🔹 Håller kartan centrerad på användaren
function RecenterMap({ position }) {
  const map = useMap();
  useEffect(() => {
    if (position) map.setView(position, map.getZoom());
  }, [position, map]);
  return null;
}

// 🔹 Zoomar automatiskt in rutten
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

  // 🔁 När användaren trycker på “🚗”-knappen
  useEffect(() => {
    async function runRoute() {
      if (!endAddress) return; // vi behöver minst ett mål
      await startNavigationFromAddresses(startAddress, endAddress);
    }
    runRoute();
  }, [trigger]);

  // 🚦 Beräknar EPA-rutt mellan start och mål
  async function startNavigationFromAddresses(startAddr, endAddr) {
    let startCoords = null;
    let endCoords = null;

    // 🔹 Om startadressen är tom → använd aktuell position
    if (!startAddr && position) {
      console.log("🚗 Använder aktuell position som startpunkt:", position);
      startCoords = position;
    } else {
      startCoords = await geocodeAddress(startAddr);
    }

    // 🔹 Hämta alltid målets koordinater
    endCoords = await geocodeAddress(endAddr);

    if (!startCoords || !endCoords) {
      alert("Kunde inte hitta start- eller målkoordinater.");
      return;
    }

    // 🔹 Hämta rutt från OpenRouteService
    const data = await getEpaRoute(startCoords, endCoords);

    if (data && data.routes && data.routes.length > 0) {
  const encoded = data.routes[0].geometry;
  const decoded = polyline.decode(encoded).map(([lat, lng]) => [lat, lng]);
  setRoute(decoded);
  setStart(startCoords);
  setEnd(endCoords);

  // 🧩 Extra loggar för att analysera vad ORS faktiskt returnerar
  console.log("🧩 Fullständig ORS-route:", data.routes[0]);
  console.log("🔍 ORS summary:", data.routes[0].summary);
  console.log("🔍 ORS segments:", data.routes[0].segments);
  console.log("🔍 ORS geometry:", data.routes[0].geometry?.slice(0, 120) + "...");

  // 🕒 Beräkna EPA-anpassad körtid (30 km/h)
  const distanceMeters =
    data.routes[0]?.summary?.distance ||
    data.routes[0]?.segments?.[0]?.distance ||
    0;

  const distanceKm = distanceMeters;
  const epaSpeed = 30; // km/h
  const durationHours = distanceKm / epaSpeed;
  const durationMinutes = Math.round(durationHours * 60);

  setDistance(distanceKm);
  setDuration(durationMinutes);

  console.log(
    `📏 Distans från ORS: ${distanceKm.toFixed(2)} km — EPA-tid: ${durationMinutes} min`
  );
  console.log("✅ Rutt beräknad mellan", startCoords, "och", endCoords);
} else {
  alert("Ingen rutt kunde beräknas 😕");
}

  } // 👈❗ Här stänger vi funktionen korrekt!

  // 📍 Hämta användarens plats vid start
  useEffect(() => {
    if (navigator.geolocation) {
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
        (err) => {
          console.warn("Kunde inte hämta position:", err);
          setLoading(false);
        }
      );
    } else {
      console.warn("Geolocation stöds inte.");
      setLoading(false);
    }
  }, []);

  if (loading) {
    return <div className="text-white p-4">Hämtar din position...</div>;
  }

  return (
    <div className="p-2 h-full flex flex-col text-white">
      {/* 🧭 Informationsruta */}
      <div className="bg-gray-900/80 text-white px-4 py-2 mb-3 rounded-xl shadow-md border border-gray-700 flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div className="text-lg">
          ⏱️{" "}
          <span className="font-semibold text-blue-400">
            {duration !== null ? `${duration} min` : "—"}
          </span>{" "}
          körtid
        </div>

        <div className="text-sm text-gray-300 mt-1 sm:mt-0">
          📏 Sträcka:{" "}
          <span className="text-blue-400 font-medium">
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
          attribution='&copy; <a href="https://www.openstreetmap.org/">OpenStreetMap</a> contributors'
          url="https://tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        <RecenterMap position={position} />
        <FitBoundsOnRoute route={route} />

        {/* Markörer */}
        {position && (
          <Marker position={[position.lat, position.lng]}>
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
