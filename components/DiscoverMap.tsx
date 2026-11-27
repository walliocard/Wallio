"use client";

import { useEffect, useRef, useState } from "react";

/* eslint-disable @typescript-eslint/no-explicit-any */

export type DiscoverMerchant = {
  id: string; nom: string; logoUrl?: string; couleur: string;
  categorie?: string; ville?: string; latitude?: number; longitude?: number;
  banner?: string; objectif?: number; reward?: string; mapsUrl?: string;
};

const CAT: Record<string, string> = { cafe: "Café", coffee_shop: "Coffee shop", matcha_bar: "Matcha bar", restaurant: "Restaurant", boulangerie: "Boulangerie", patisserie: "Pâtisserie", barbier: "Barbier", coiffure: "Coiffure", beaute: "Beauté", autre: "Autre" };

function isIOS() { return typeof navigator !== "undefined" && /iPad|iPhone|iPod/.test(navigator.userAgent); }

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

export default function DiscoverMap({ merchants, registeredIds, onJoin }: {
  merchants: DiscoverMerchant[];
  registeredIds: string[];
  onJoin: (m: DiscoverMerchant) => void;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const mapRef = useRef<any>(null);
  const [selected, setSelected] = useState<DiscoverMerchant | null>(null);
  const [error, setError] = useState(false);

  // Initialisation (une fois)
  useEffect(() => {
    let cancelled = false;
    (async () => {
      let token = "";
      try {
        const r = await fetch("/api/public/mapkit-token");
        if (!r.ok) throw new Error();
        token = (await r.json()).token;
      } catch { setError(true); return; }
      try { await loadMapKit(); } catch { setError(true); return; }
      if (cancelled || !ref.current) return;
      const mapkit = (window as any).mapkit;
      try {
        if (!mapkit.__wallioInit) { mapkit.init({ authorizationCallback: (done: any) => done(token) }); mapkit.__wallioInit = true; }
        const map = new mapkit.Map(ref.current, { showsUserLocationControl: false, showsCompass: mapkit.FeatureVisibility?.Hidden });
        mapRef.current = map;

        // Épingle « compteur » pour les groupes de commerces proches
        map.annotationForCluster = (cluster: any) => {
          const count = cluster.memberAnnotations.length;
          const factory = () => {
            const el = document.createElement("div");
            el.style.cssText = "width:40px;height:40px;border-radius:50%;background:#fff;box-shadow:0 4px 14px rgba(0,0,0,.22);display:flex;align-items:center;justify-content:center;";
            const inner = document.createElement("div");
            inner.style.cssText = "width:34px;height:34px;border-radius:50%;background:#4B4FD6;color:#fff;font:600 15px -apple-system,system-ui,sans-serif;display:flex;align-items:center;justify-content:center;";
            inner.textContent = String(count);
            el.appendChild(inner);
            return el;
          };
          const a = new mapkit.Annotation(cluster.coordinate, factory, {});
          a.clusterMembers = cluster.memberAnnotations;
          return a;
        };

        map.addEventListener("select", (e: any) => {
          const a = e.annotation;
          if (!a) return;
          if (a.clusterMembers?.length) {
            // Groupe : on zoome pour séparer les commerces
            try {
              const sp = map.region.span;
              map.setRegionAnimated(new mapkit.CoordinateRegion(a.coordinate, new mapkit.CoordinateSpan(Math.max(sp.latitudeDelta / 3, 0.002), Math.max(sp.longitudeDelta / 3, 0.002))), true);
              map.selectedAnnotation = null;
            } catch { /* */ }
            return;
          }
          if (a.data) setSelected(a.data);
        });
        map.addEventListener("deselect", () => setSelected(null));
        drawPins();
      } catch { setError(true); }
    })();
    return () => { cancelled = true; try { mapRef.current?.destroy(); } catch { /* */ } mapRef.current = null; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Redessine quand la liste (filtres) change
  useEffect(() => { drawPins(); /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, [merchants]);

  function drawPins() {
    const map = mapRef.current;
    const mapkit = (window as any).mapkit;
    if (!map || !mapkit) return;
    if (map.annotations?.length) map.removeAnnotations(map.annotations);
    const withCoords = merchants.filter(m => m.latitude != null && m.longitude != null);
    const anns = withCoords.map(mm => {
      // Épingle ronde blanche avec le logo du commerçant (comme la maquette)
      const factory = () => {
        const el = document.createElement("div");
        el.style.cssText = "width:42px;height:42px;border-radius:50%;background:#fff;padding:3px;box-sizing:border-box;box-shadow:0 4px 14px rgba(0,0,0,.22);";
        const inner = document.createElement("div");
        inner.style.cssText = `width:100%;height:100%;border-radius:50%;background-size:cover;background-position:center;background-color:${mm.couleur || "#5B7CFA"};`
          + (mm.logoUrl ? `background-image:url("${mm.logoUrl}");` : "");
        el.appendChild(inner);
        return el;
      };
      const a = new mapkit.Annotation(new mapkit.Coordinate(mm.latitude, mm.longitude), factory, {
        clusteringIdentifier: "resto", anchorOffset: new DOMPoint(0, -21), title: mm.nom,
      });
      a.data = mm;
      return a;
    });
    if (anns.length) { map.addAnnotations(anns); map.showItems(anns, { animate: false }); }
  }

  function locate() {
    const map = mapRef.current;
    const mapkit = (window as any).mapkit;
    if (!map || !navigator.geolocation) return;
    map.showsUserLocation = true;
    navigator.geolocation.getCurrentPosition(pos => {
      map.setCenterAnimated(new mapkit.Coordinate(pos.coords.latitude, pos.coords.longitude), true);
    }, () => {}, { enableHighAccuracy: true, timeout: 8000 });
  }

  if (error) {
    return (
      <div style={{ background: "rgba(255,255,255,0.72)", borderRadius: 24, padding: "40px 24px", textAlign: "center" }}>
        <p style={{ fontSize: 15, fontWeight: 600, color: "#1C2333", marginBottom: 6 }}>Carte indisponible</p>
        <p style={{ fontSize: 13, color: "#8E9BB5" }}>Réessayez plus tard.</p>
      </div>
    );
  }

  const membre = selected ? registeredIds.includes(selected.id) : false;
  const itineraire = selected?.mapsUrl
    ? selected.mapsUrl
    : selected && selected.latitude != null && selected.longitude != null
      ? (isIOS() ? `https://maps.apple.com/?daddr=${selected.latitude},${selected.longitude}` : `https://www.google.com/maps/dir/?api=1&destination=${selected.latitude},${selected.longitude}`)
      : null;

  return (
    <div style={{ position: "relative", height: "66vh", borderRadius: 22, overflow: "hidden", border: "1px solid rgba(142,155,181,0.14)" }}>
      <div ref={ref} style={{ width: "100%", height: "100%" }} />

      {/* Me localiser */}
      <button onClick={locate} aria-label="Me localiser" style={{ position: "absolute", top: 12, right: 12, width: 40, height: 40, borderRadius: "50%", background: "rgba(255,255,255,0.95)", border: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 2px 8px rgba(0,0,0,0.12)" }}>
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#1C2333" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3" /><path d="M12 2v3M12 19v3M2 12h3M19 12h3" /></svg>
      </button>

      {/* Fiche au tap */}
      {selected && (
        <div style={{ position: "absolute", left: 10, right: 10, bottom: 10, background: "#fff", borderRadius: 18, overflow: "hidden", boxShadow: "0 8px 30px rgba(0,0,0,0.18)" }}>
          <div style={{ height: 76, background: selected.banner ? `center/cover url(${selected.banner})` : selected.couleur }} />
          <div style={{ padding: "0 14px 14px", position: "relative" }}>
            <div style={{ position: "absolute", top: -20, left: 14, width: 42, height: 42, borderRadius: 11, border: "2px solid white", background: selected.couleur, display: "flex", alignItems: "center", justifyContent: "center", backgroundImage: selected.logoUrl ? `url(${selected.logoUrl})` : undefined, backgroundSize: "cover", backgroundPosition: "center" }}>
              {!selected.logoUrl && <span style={{ fontSize: 16, fontWeight: 700, color: "white" }}>{selected.nom[0]?.toUpperCase()}</span>}
            </div>
            <div style={{ paddingTop: 28 }}>
              <p style={{ fontSize: 15, fontWeight: 600, color: "#1C2333" }}>{selected.nom}</p>
              <p style={{ fontSize: 12, color: "#8E9BB5", marginTop: 1 }}>{[selected.categorie ? CAT[selected.categorie] : "", selected.ville].filter(Boolean).join(" · ")}</p>
              {selected.objectif && <p style={{ fontSize: 13, color: "#6E7A8A", marginTop: 6 }}>{selected.objectif} tampons → {selected.reward || "récompense"}</p>}
            </div>
            <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
              {itineraire && <a href={itineraire} target="_blank" rel="noopener noreferrer" style={{ flex: 1, textAlign: "center", padding: "11px 0", borderRadius: 12, background: "rgba(142,155,181,0.12)", color: "#1C2333", fontSize: 13, fontWeight: 600, textDecoration: "none" }}>Itinéraire</a>}
              {membre ? (
                <a href={`/c/${selected.id}`} style={{ flex: 1, textAlign: "center", padding: "11px 0", borderRadius: 12, background: selected.couleur, color: "#fff", fontSize: 13, fontWeight: 600, textDecoration: "none" }}>Voir la carte</a>
              ) : (
                <button onClick={() => onJoin(selected)} style={{ flex: 1, padding: "11px 0", borderRadius: 12, background: selected.couleur, color: "#fff", fontSize: 13, fontWeight: 600, border: "none", cursor: "pointer" }}>Rejoindre</button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
