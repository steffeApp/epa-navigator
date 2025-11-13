import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App.jsx";
import "./index.css";

// 🧠 Rendera appen
ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

// 🌐 Registrera Service Worker (endast i produktion eller localhost)
if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    const isLocalhost =
      window.location.hostname === "localhost" ||
      window.location.hostname === "127.0.0.1";

    const swUrl = "/service-worker.js";

    navigator.serviceWorker
      .register(swUrl)
      .then((registration) => {
        console.log("✅ Service worker registrerad:", registration.scope);

        // 🔄 Hantera uppdateringar
        registration.onupdatefound = () => {
          const newWorker = registration.installing;
          if (newWorker) {
            newWorker.onstatechange = () => {
              if (newWorker.state === "installed") {
                if (navigator.serviceWorker.controller) {
                  console.log("♻️ Ny version tillgänglig! Ladda om för att uppdatera.");
                } else {
                  console.log("📱 Appen är nu cachelagrad för offline-användning.");
                }
              }
            };
          }
        };
      })
      .catch((err) => {
        console.error("❌ Fel vid registrering av service worker:", err);
      });
  });
}
