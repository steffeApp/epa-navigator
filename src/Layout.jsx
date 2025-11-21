import { Outlet, useLocation, NavLink } from "react-router-dom";
import { useContext } from "react";
import { MapContext } from "./App.jsx";

function MapAddressBar() {
  const { startAddress, endAddress, setStartAddress, setEndAddress, startNavigation } =
    useContext(MapContext);

  return (
    <div className="flex flex-nowrap justify-between items-center gap-3 w-full overflow-hidden">


      <input
        value={startAddress}
        onChange={(e) => setStartAddress(e.target.value)}
        placeholder="Startadress"
        className="p-2 rounded text-black flex-1 min-w-0"
      />

      <input
        value={endAddress}
        onChange={(e) => setEndAddress(e.target.value)}
        placeholder="Måladress"
        className="p-2 rounded text-black flex-1 min-w-0"
      />

      <button
        onClick={() => startNavigation(startAddress, endAddress)}
        className="bg-orange-500 text-white px-4 py-2 rounded-xl flex-shrink-0"
      >
        🚗
      </button>
    </div>
  );
}


function Navbar() {
  return (
    <div className="flex gap-4 flex-shrink-0 bg-gray-600 p-2 rounded">
      <NavLink to="/map">🗺️</NavLink>
      <NavLink to="/zones">⚠️</NavLink>
      <NavLink to="/community">💬</NavLink>
      <NavLink to="/profile">👤</NavLink>
    </div>
  );
}

export default function Layout() {
  const location = useLocation();

  return (
    <div className="h-screen flex flex-col bg-gray-900 text-white">
      <header className="p-2 bg-gray-800">
        <div className="flex flex-nowrap items-center gap-2">
          <div className="flex-1 min-w-0">
            {(location.pathname === "/" || location.pathname === "/map") && <MapAddressBar />}
          </div>

          <Navbar />
        </div>
      </header>

      <main className="flex-1 overflow-y-auto">
        <Outlet />
      </main>
    </div>
  );
}
