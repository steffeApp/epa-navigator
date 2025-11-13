import { Outlet, useLocation, NavLink } from "react-router-dom";
import { useContext } from "react";
import { MapContext } from "./App.jsx";

// --- Address Bar ---
function MapAddressBar() {
  const { startAddress, endAddress, setStartAddress, setEndAddress, startNavigation } =
    useContext(MapContext);

  return (
    <div className="flex gap-2 flex-1 min-w-[250px] max-w-[700px]">
      <input
        value={startAddress}
        onChange={(e) => setStartAddress(e.target.value)}
        placeholder="Startadress"
        className="p-2 rounded text-black flex-1"
      />
      <input
        value={endAddress}
        onChange={(e) => setEndAddress(e.target.value)}
        placeholder="Måladress"
        className="p-2 rounded text-black flex-1"
      />
      <button
        onClick={() => startNavigation(startAddress, endAddress)}
        className="bg-orange-500 text-white px-4 py-2 rounded-xl whitespace-nowrap"
      >
        🚗
      </button>
    </div>
  );
}

// --- Navbar ---
function Navbar() {
  return (
    <div className="flex gap-4 flex-shrink-0">
      <NavLink
        to="/map"
        className={({ isActive }) =>
          `hover:text-orange-400 ${isActive ? "text-orange-400" : "text-white"}`
        }
      >
        🗺️
      </NavLink>
      <NavLink
        to="/zones"
        className={({ isActive }) =>
          `hover:text-orange-400 ${isActive ? "text-orange-400" : "text-white"}`
        }
      >
        ⚠️
      </NavLink>
      <NavLink
        to="/community"
        className={({ isActive }) =>
          `hover:text-orange-400 ${isActive ? "text-orange-400" : "text-white"}`
        }
      >
        💬
      </NavLink>
      <NavLink
        to="/profile"
        className={({ isActive }) =>
          `hover:text-orange-400 ${isActive ? "text-orange-400" : "text-white"}`
        }
      >
        👤
      </NavLink>
    </div>
  );
}

// --- Layout ---
export default function Layout() {
  const location = useLocation();

  return (
    <div className="bg-gray-800 h-screen flex flex-col">
      {/* 🔝 Sticky toppbar */}
      <header className="bg-gray-900 border-b border-gray-700 p-3 sticky top-0 z-50">
        <div className="flex flex-wrap md:flex-nowrap justify-between items-center gap-3">
          {/* Vänster: Adressfält endast på kart-sidan */}
          {(location.pathname === "/" || location.pathname === "/map") && <MapAddressBar />}
          {/* Höger: Navigationsikoner */}
          <Navbar />
        </div>
      </header>

      {/* 📍 Sidinnehåll */}
      <main className="flex-1 overflow-y-auto">
        <Outlet />
      </main>
    </div>
  );
}

