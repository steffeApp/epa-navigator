import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App.jsx";
import "./index.css";
import { SWUpdateBanner } from "./sw/SWUpdateBanner.jsx";

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <App />
    <SWUpdateBanner />
  </React.StrictMode>
);

// 📦 Service Worker – auto-update
if ("serviceWorker" in navigator) {
  window.addEventListener("load", async () => {
    try {
      const reg = await navigator.serviceWorker.register("/service-worker.js");
      console.log("✅ Service Worker registrerad:", reg.scope);

      navigator.serviceWorker.addEventListener("message", (event) => {
        if (event.data?.type === "SW_UPDATED") {
          console.log("♻️ Ny version av appen tillgänglig");
          window.dispatchEvent(
            new CustomEvent("sw-update-available", {
              detail: { version: event.data.version, reg }
            })
          );
        }
      });

      navigator.serviceWorker.addEventListener("controllerchange", () => {
        console.log("🔄 Ny SW aktiv → laddar om sidan");
        if (!window.__reloaded) {
          window.__reloaded = true;
          window.location.reload();
        }
      });
    } catch (err) {
      console.error("❌ Fel vid registrering av Service Worker:", err);
    }
  });
}
