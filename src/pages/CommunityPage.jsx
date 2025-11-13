import { useState, useEffect, useContext } from "react";
import { MapContext } from "../App.jsx";

export default function CommunityPage() {
  const { userName } = useContext(MapContext);
  const [input, setInput] = useState("");

  // 🧠 Ladda från localStorage direkt i useState
  const [posts, setPosts] = useState(() => {
    try {
      const saved = localStorage.getItem("epa_posts");
      if (saved) {
        const parsed = JSON.parse(saved);
        const now = Date.now();
        const fresh = parsed.filter((p) => now - p.timestamp < 5 * 60 * 1000);
        console.log("📦 Laddade inlägg direkt vid init:", fresh);
        return fresh;
      }
    } catch (err) {
      console.warn("⚠️ Fel vid laddning av epa_posts:", err);
    }
    return [];
  });

  // 💾 Spara till localStorage när listan ändras
  useEffect(() => {
    console.log("💾 Sparar inlägg till localStorage:", posts);
    localStorage.setItem("epa_posts", JSON.stringify(posts));
  }, [posts]);

  // 🧹 Rensa gamla inlägg var 30:e sekund
  useEffect(() => {
    const interval = setInterval(() => {
      const now = Date.now();
      setPosts((prev) => prev.filter((p) => now - p.timestamp < 5 * 60 * 1000));
    }, 30000);
    return () => clearInterval(interval);
  }, []);

  // ✏️ Skapa nytt inlägg
  const handleSubmit = (e) => {
    e.preventDefault();
    if (!input.trim()) return;

    const newPost = {
      id: Date.now(),
      author: userName || "EPA-förare",
      text: input.trim(),
      timestamp: Date.now(),
    };

    setPosts((prev) => [newPost, ...prev]);
    setInput("");
  };

  // ⏱️ Format för tidsstämpel
  const formatTime = (ts) => {
    const d = new Date(ts);
    return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  };

  return (
    <div className="p-4 text-white flex flex-col h-full">
      <h2 className="text-2xl font-semibold mb-2">💬 Community</h2>
      <p className="text-sm text-gray-400 mb-4">
        Inlägg rensas automatiskt efter 5 minuter ⏳
      </p>

      {/* Inläggsformulär */}
      <form onSubmit={handleSubmit} className="flex gap-2 mb-4">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Dela ett tips eller en observation..."
          className="p-2 rounded text-black flex-1"
          onKeyDown={(e) => e.key === "Enter" && handleSubmit(e)}
        />
        <button
          type="submit"
          className="bg-blue-500 px-4 py-2 rounded-xl hover:bg-blue-600"
        >
          ➕
        </button>
      </form>

      {/* Inläggslista */}
      <div className="flex-1 overflow-y-auto space-y-3">
        {posts.length === 0 ? (
          <p className="text-gray-400 italic">
            Inga tips ännu. Skriv det första!
          </p>
        ) : (
          posts.map((post) => (
            <div
              key={post.id}
              className="bg-gray-900/70 border border-gray-700 rounded-xl p-3"
            >
              <div className="flex justify-between items-center mb-1">
                <span className="font-semibold text-orange-400">
                  {post.author}
                </span>
                <span className="text-xs text-gray-400">
                  {formatTime(post.timestamp)}
                </span>
              </div>
              <p className="text-gray-200">{post.text}</p>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
