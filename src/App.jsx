import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { useState, createContext, useEffect } from "react";
import Layout from "./Layout.jsx";

import MapPage from "./pages/MapPage_Sim.jsx";
import WarningZones from "./pages/WarningZones.jsx";
import CommunityPage from "./pages/CommunityPage.jsx";
import ProfilePage from "./pages/ProfilePage.jsx";
import "./index.css";

// --- Context ---
export const MapContext = createContext({
  startAddress: "",
  endAddress: "",
  setStartAddress: () => {},
  setEndAddress: () => {},
  startNavigation: () => {},
  trigger: 0,
  userName: "",
  setUserName: () => {},
});

export default function App() {
  const [startAddress, setStartAddress] = useState("");
  const [endAddress, setEndAddress] = useState("");
  const [trigger, setTrigger] = useState(0);

  // 🧠 Hantera användarnamn med localStorage
  const [userName, setUserName] = useState(() => {
    const stored = localStorage.getItem("epa_userName");
    console.log("🧠 Laddar userName från localStorage:", stored);
    return stored || "";
  });

  useEffect(() => {
    console.log("💾 Sparar userName till localStorage:", userName);
    if (userName) {
      localStorage.setItem("epa_userName", userName);
    }
  }, [userName]);

  const startNavigation = (start, end) => {
    setStartAddress(start);
    setEndAddress(end);
    setTrigger((t) => t + 1);
  };

  return (
    <Router>
      <MapContext.Provider
        value={{
          startAddress,
          endAddress,
          setStartAddress,
          setEndAddress,
          startNavigation,
          trigger,
          userName,
          setUserName,
        }}
      >
        <Routes>
          <Route element={<Layout />}>
            <Route path="/" element={<MapPage />} />
            <Route path="/map" element={<MapPage />} />
            <Route path="/zones" element={<WarningZones />} />
            <Route path="/community" element={<CommunityPage />} />
            <Route path="/profile" element={<ProfilePage />} />
          </Route>
        </Routes>
      </MapContext.Provider>
    </Router>
  );
}
