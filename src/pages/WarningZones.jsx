import { useState } from "react";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import "leaflet/dist/leaflet.css";

export default function WarningZones() {
  const [zones, setZones] = useState(JSON.parse(localStorage.getItem("zones") || "[]"));

  const addZone = (e) => {
    const newZone = { lat: e.latlng.lat, lng: e.latlng.lng, note: "Ny varningszon" };
    const updated = [...zones, newZone];
    setZones(updated);
    localStorage.setItem("zones", JSON.stringify(updated));
  };

  return (
    <div className="p-2 h-full flex flex-col">
      <MapContainer
        center={[62.39, 17.3]}
        zoom={13}
        className="flex-1 rounded-2xl overflow-hidden"
        style={{ height: "calc(100vh - 100px)", width: "100%" }}
        onClick={addZone}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/">OpenStreetMap</a> contributors'
          url="https://tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        {zones.map((z, i) => (
          <Marker key={i} position={[z.lat, z.lng]}>
            <Popup>{z.note}</Popup>
          </Marker>
        ))}
      </MapContainer>

      <ul className="text-white mt-2 space-y-1">
        {zones.map((z, i) => (
          <li key={i}>
            ⚠️ {z.note} ({z.lat.toFixed(3)}, {z.lng.toFixed(3)})
          </li>
        ))}
      </ul>
    </div>
  );
}
