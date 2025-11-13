import { useContext } from "react";
import { MapContext } from "../App.jsx";

export default function ProfilePage() {
  const { userName, setUserName } = useContext(MapContext);

  return (
    <div className="p-6 text-white">
      <h2 className="text-2xl font-semibold mb-4">Min profil</h2>

      <label className="block text-gray-300 mb-2">Ditt namn:</label>
      <input
        type="text"
        value={userName}
        onChange={(e) => setUserName(e.target.value)}
        placeholder="Skriv ditt namn..."
        className="p-2 rounded text-black w-full max-w-md"
      />

      <p className="mt-4 text-gray-400">
        Detta namn visas när du delar tips i communityn.
      </p>
    </div>
  );
}


