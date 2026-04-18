import { useEffect, useRef } from "react";
import "leaflet/dist/leaflet.css";

function getDistance(lat1, lon1, lat2, lon2) {
  const R = 3958.8; // miles
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;

  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) ** 2;

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

export default function ProvidersMap({
  providers = [],
  locations,
  userLocation,
  searchWithin,
}) {
  const mapRef = useRef(null);
  const markersRef = useRef([]);

  const cleanName = (name = "") =>
  name
    // remove leading "03a) ", "10b) ", etc.
    .replace(/^\d+[a-z]\)\s*/i, "")
    // remove schedule suffixes
    .replace(/\s*,?\s*(DTD|Salon)\s*Schedule/i, "");


  useEffect(() => {
    import("leaflet").then((L) => {
      const mapContainer = document.getElementById("map");
      if (!mapContainer) return;

      /* ---------- INIT MAP ---------- */
      if (!mapRef.current) {
        const center = userLocation || [40.1, -75.1];
        mapRef.current = L.map("map", { minZoom: 2 }).setView(center, 8);

        L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
          attribution: "© OpenStreetMap contributors",
        }).addTo(mapRef.current);
      }

      const map = mapRef.current;

      /* ---------- CLEAR OLD MARKERS ---------- */
      markersRef.current.forEach((m) => m.remove());
      markersRef.current = [];

      /* ---------- ICONS ---------- */
      const userIcon = L.icon({
        iconUrl: "https://cdn-icons-png.flaticon.com/512/64/64113.png",
        iconSize: [32, 32],
        iconAnchor: [16, 32],
      });

      const providerIcon = L.icon({
        iconUrl: "https://cdn-icons-png.flaticon.com/512/854/854878.png",
        iconSize: [30, 30],
        iconAnchor: [15, 30],
      });

      /* ---------- USER MARKER ---------- */
      let userMarker = null;
      if (userLocation) {
        userMarker = L.marker(userLocation, { icon: userIcon })
          .addTo(map)
          .bindPopup("<b>You are here</b>");
        markersRef.current.push(userMarker);
      }

      /* ---------- FLATTEN PROVIDER LOCATIONS ---------- */
      const providerLocations = providers.flatMap((p) =>
        (p.providerLocations || [])
          .filter((loc) => loc.lat && loc.lng)
          .map((loc) => ({
            ...loc,
            providerName: p.name,
          }))
      );

      const allMarkers = [];
      if (userMarker) allMarkers.push(userMarker);

      /* ---------- ADD PROVIDER MARKERS WITH EXACT RULE ---------- */
      providerLocations.forEach((loc) => {
        const dist = userLocation
          ? getDistance(
              userLocation[0],
              userLocation[1],
              parseFloat(loc.lat),
              parseFloat(loc.lng)
            )
          : 0;

        /* ------------ PROVIDER RADIUS STRICT RULE ------------ */
        const providerMaxRadius = Number(loc.address2);

        const withinProviderRadius =
          Number.isFinite(providerMaxRadius) && providerMaxRadius > 0
            ? dist <= providerMaxRadius
            : dist === 0; // address2 = 0 → do not show anywhere

        /* ------------ USER SEARCH RADIUS ------------ */
        const withinSearchRadius = !userLocation || dist <= searchWithin;

        const canShow = withinProviderRadius && withinSearchRadius;

        console.log(`Provider: ${loc.providerName}`, {
          dist,
          providerMaxRadius,
          withinProviderRadius,
          withinSearchRadius,
          showOnMap: canShow,
        });

        function extractStateFromTitle(title) {
  if (!title) return '';
  
  const parts = title.split(',');
  if (parts.length > 0) {
    const lastPart = parts[parts.length - 1].trim();
    return lastPart;
  }
  
  return '';
}

        if (canShow) {
          const marker = L.marker(
            [parseFloat(loc.lat), parseFloat(loc.lng)],
            { icon: providerIcon }
          )
            .addTo(map)
            .bindPopup(
              `<b>${loc.providerName ? cleanName(loc.providerName) : ""}</b>` +
               `<br/>📍 ${loc.city}${loc.address2 && loc.address2 !== "0" ? ` ${loc.address2}` : ''}, ${extractStateFromTitle(loc.title)}` +
    (userLocation ? `<br/>${dist.toFixed(1)} miles away` : "")
            );

          markersRef.current.push(marker);
          allMarkers.push(marker);
        }
      });

      /* ---------- AUTO FIT ---------- */
      /* ---------- AUTO FIT ---------- */
/* ---------- AUTO FIT ---------- */
if (allMarkers.length > 0) {
  const group = new L.featureGroup(allMarkers);
  const bounds = group.getBounds();
  
  // Even more padding and lower zoom
  const paddedBounds = bounds.pad(0.1); // 20% padding
  
  map.fitBounds(paddedBounds, {
    padding: [80, 80], // Much larger padding
    maxZoom: 12, // Even more zoomed out
    minZoom: 2,
  });
} else if (userLocation) {
  map.setView(userLocation, 8); // More zoomed out default
}
    });

    return () => {
      if (mapRef.current) {
        // mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, [providers, userLocation, searchWithin]);

  return (
    <div className="w-full h-[500px] rounded-lg shadow-md">
      <div id="map" className="w-full h-full" />
    </div>
  );
}
