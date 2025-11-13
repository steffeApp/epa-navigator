// --- Hämta EPA-anpassad rutt från OpenRouteService ---
console.log("✅ Laddar api.js från rätt plats");


export async function getEpaRoute(start, end) {
  const apiKey = import.meta.env.VITE_ORS_API_KEY;
  const url = `https://api.openrouteservice.org/v2/directions/driving-car`;

  console.log("🚗 Anropar ORS med:", start, end);

  const body = {
  coordinates: [
    [start.lng, start.lat],
    [end.lng, end.lat]
  ],
  preference: "shortest",
  instructions: false,
  units: "km",
  attributes: ["avgspeed", "detourfactor", "percentage"], // ersätter extra_info
};




  try {
    const res = await fetch(url, {
      method: "POST",
      headers: {
        "Authorization": apiKey,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });

    const data = await res.json();

    if (!res.ok) {
      console.error("❌ ORS-fel:", data);
      throw new Error(`ORS-fel ${res.status}: ${data.error?.message || "Okänt fel"}`);
    }

    // 👇 Nytt: logga maxspeed-data
    if (data?.extras?.maxspeed) {
      console.group("📊 Hastigheter (maxspeed) från ORS:");
      console.log(data.extras.maxspeed.values);
      console.groupEnd();
    } else {
      console.warn("⚠️ Ingen maxspeed-data i svaret.");
    }

    return data; // ✅ Return inuti funktionen
  } catch (err) {
    console.error("🚨 Kunde inte hämta EPA-rutt:", err);
    return null;
  }
}

// --- Geokodning av adresser via OpenStreetMap Nominatim ---
export async function geocodeAddress(address) {
  try {
    console.log("🔍 Geokodar adress:", address);
    const response = await fetch(
      `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(address)}`
    );
    const data = await response.json();

    if (!data || data.length === 0) {
      console.warn("⚠️ Ingen plats hittades för:", address);
      return null;
    }

    const result = {
      lat: parseFloat(data[0].lat),
      lng: parseFloat(data[0].lon),
    };

    console.log("📍 Resultat från Nominatim:", result);
    return result; // ✅ Return inuti funktionen
  } catch (err) {
    console.error("🚨 Fel vid geokodning:", err);
    return null; // ✅ Return inuti catch-blocket
  }
}
