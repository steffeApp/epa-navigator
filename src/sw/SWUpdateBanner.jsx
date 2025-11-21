import React, { useEffect, useState } from "react";

export function SWUpdateBanner() {
  const [updateInfo, setUpdateInfo] = useState(null);

  useEffect(() => {
    const handler = (e) => {
      setUpdateInfo(e.detail); // { version, reg }
    };
    window.addEventListener("sw-update-available", handler);
    return () => window.removeEventListener("sw-update-available", handler);
  }, []);

  if (!updateInfo) return null;

  const applyUpdate = () => {
    updateInfo.reg.waiting.postMessage({ type: "SKIP_WAITING" });
  };

  return (
    <div
      style={{
        position: "fixed",
        bottom: "20px",
        left: "50%",
        transform: "translateX(-50%)",
        background: "#333",
        color: "white",
        padding: "12px 18px",
        borderRadius: "8px",
        boxShadow: "0 4px 10px rgba(0,0,0,0.3)",
        zIndex: 9999,
        fontSize: "15px",
      }}
    >
      <span>Ny version av appen finns!</span>
      <button
        onClick={applyUpdate}
        style={{
          marginLeft: "12px",
          background: "#00c853",
          color: "white",
          border: "none",
          borderRadius: "6px",
          padding: "6px 12px",
          cursor: "pointer",
        }}
      >
        Uppdatera
      </button>
    </div>
  );
}
