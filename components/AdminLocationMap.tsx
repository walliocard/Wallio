"use client";

import { useEffect, useRef } from "react";

/* eslint-disable @typescript-eslint/no-explicit-any */

function loadMapKit(): Promise<void> {
  return new Promise((resolve, reject) => {
    if ((window as any).mapkit?.Map) return resolve();
    const existing = document.getElementById("mapkit-js") as HTMLScriptElement | null;
    if (existing) { existing.addEventListener("load", () => resolve()); existing.addEventListener("error", () => reject()); return; }
    const s = document.createElement("script");
    s.id = "mapkit-js";
    s.src = "https://cdn.apple-mapkit.com/mk/5.x.x/mapkit.js";
    s.async = true;
    s.onload = () => resolve();
    s.onerror = () => reject();
    document.head.appendChild(s);
  });
}

// Carte interactive : on déplace la carte, l'épingle reste au centre.
// À la fin d'un déplacement, renvoie les coordonnées du centre.
export default function AdminLocationMap({ lat, lng, onChange }: {
  lat: number | null; lng: number | null; onChange: (lat: number, lng: number) => void;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const mapRef = useRef<any>(null);
  const skipFirst = useRef(true);
  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;

  useEffect(() => {
    let cancelled = false;
    (async () => {
      let token = "";
      try { const r = await fetch("/api/public/mapkit-token"); if (!r.ok) return; token = (await r.json()).token; } catch { return; }
      try { await loadMapKit(); } catch { return; }
      if (cancelled || !ref.current) return;
      const mapkit = (window as any).mapkit;
      try {
        if (!mapkit.__wallioInit) { mapkit.init({ authorizationCallback: (d: any) => d(token) }); mapkit.__wallioInit = true; }
        const center = new mapkit.Coordinate(lat ?? 31.63, lng ?? -7.99);
        const map = new mapkit.Map(ref.current, { center, showsCompass: mapkit.FeatureVisibility?.Hidden, showsScale: mapkit.FeatureVisibility?.Hidden });
        map.cameraDistance = lat != null ? 1200 : 400000; // proche si coords connues, large sinon
        mapRef.current = map;
        map.addEventListener("region-change-end", () => {
          if (skipFirst.current) { skipFirst.current = false; return; }
          const c = map.center;
          onChangeRef.current(Number(c.latitude.toFixed(6)), Number(c.longitude.toFixed(6)));
        });
      } catch { /* carte indisponible */ }
    })();
    return () => { cancelled = true; try { mapRef.current?.destroy(); } catch { /* */ } mapRef.current = null; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Recentrage si les coordonnées changent de l'extérieur (ex. après extraction du lien)
  useEffect(() => {
    const map = mapRef.current; const mapkit = (window as any).mapkit;
    if (!map || !mapkit || lat == null || lng == null) return;
    const c = map.center;
    if (Math.abs(c.latitude - lat) > 0.0004 || Math.abs(c.longitude - lng) > 0.0004) {
      skipFirst.current = true;
      map.setCenterAnimated(new mapkit.Coordinate(lat, lng), false);
    }
  }, [lat, lng]);

  return (
    <div style={{ position: "relative", height: 190, borderRadius: 12, overflow: "hidden", border: "1px solid #E5E5EA" }}>
      <div ref={ref} style={{ width: "100%", height: "100%" }} />
      {/* Épingle fixe au centre */}
      <div style={{ position: "absolute", left: "50%", top: "50%", transform: "translate(-50%,-100%)", pointerEvents: "none" }}>
        <svg width="32" height="32" viewBox="0 0 24 24" fill="#E0533D" stroke="#fff" strokeWidth="1.4"><path d="M12 22s-7-6.5-7-12A7 7 0 0 1 19 10c0 5.5-7 12-7 12z" /><circle cx="12" cy="10" r="2.6" fill="#fff" stroke="none" /></svg>
      </div>
      <div style={{ position: "absolute", left: 8, bottom: 8, background: "rgba(255,255,255,.9)", borderRadius: 8, padding: "4px 8px", fontSize: 11, color: "#6E6E73", pointerEvents: "none" }}>Déplacez la carte pour placer l&apos;épingle</div>
    </div>
  );
}
