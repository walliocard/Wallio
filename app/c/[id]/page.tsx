"use client";

import { useEffect, useState, useRef } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { collection, query, where, getDocs } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { JOUR_LABELS } from "@/lib/horaires";

const PHONE_KEY = "wallio_client_phone";
const FG = "#1D1D1F", FG2 = "#6E6E73", FG3 = "#8E8E93", SEP = "#E5E5EA", BG = "#F7F7FA";
const SHADOW = "0 1px 3px rgba(0,0,0,.04),0 2px 8px rgba(0,0,0,.05)";
const JOURS = ["lun", "mar", "mer", "jeu", "ven", "sam", "dim"];
const soft = (hex: string, a: number) => hex + Math.round(a * 255 / 100).toString(16).padStart(2, "0");

type Statut = { ouvert: boolean; etat: string; label: string } | null;
type MarchandPublic = {
  id: string; nom: string; logo_url: string | null; strip_url: string | null;
  couleur_principale: string | null; categorie: string | null; ville: string | null;
  latitude: number | null; longitude: number | null; horaires: Record<string, { ouverture: string; fermeture: string }[]> | null;
  statut: Statut; telephone: string | null; instagram: string | null;
  objectif_tampons: number | null; nom_recompense: string | null; mode_recompense: string | null;
  paliers: { tampons: number; recompense: string }[] | null;
  palier_intermediaire: number | null; nom_recompense_petit: string | null; nom_recompense_grand: string | null;
  parrainage_actif: boolean; date_inscription: number | null; maps_url: string | null;
};
type Carte = { walletId: string; clientId: string; tampons: number; paliersValides?: boolean[]; recompenseEnAttente: boolean; nfcId?: string; apnsToken: boolean; walletType: string | null; notifOn: boolean };
type Notif = { id: string; title: string; body: string; sentAt: string };
type Evt = { type: string; recompense: boolean; tampons_apres: number | null; at: number | null };

const CAT_LABELS: Record<string, string> = { cafe: "Café", coffee_shop: "Coffee shop", matcha_bar: "Matcha bar", restaurant: "Restaurant", boulangerie: "Boulangerie", patisserie: "Pâtisserie", barbier: "Barbier", coiffure: "Coiffure", beaute: "Beauté", autre: "" };

function isIOS() { return typeof navigator !== "undefined" && /iPad|iPhone|iPod/.test(navigator.userAgent); }

// ── Icônes (stroke) ──────────────────────────────────────────────────────────
const ICON: Record<string, React.ReactNode> = {
  back: <path d="M15 18l-6-6 6-6" />,
  share: <><circle cx="18" cy="5" r="3" /><circle cx="6" cy="12" r="3" /><circle cx="18" cy="19" r="3" /><line x1="8.59" y1="13.51" x2="15.42" y2="17.49" /><line x1="15.41" y1="6.51" x2="8.59" y2="10.49" /></>,
  nav: <><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z" /><circle cx="12" cy="10" r="3" /></>,
  phone: <path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07 19.5 19.5 0 01-6-6 19.79 19.79 0 01-3.07-8.67A2 2 0 014.11 2h3a2 2 0 012 1.72c.13.96.36 1.9.7 2.81a2 2 0 01-.45 2.11L8.09 9.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45c.9.34 1.85.57 2.81.7A2 2 0 0122 16.92z" />,
  insta: <><rect x="2" y="2" width="20" height="20" rx="5" /><circle cx="12" cy="12" r="4" /><line x1="17.5" y1="6.5" x2="17.51" y2="6.5" /></>,
  wallet: <><rect x="2" y="5" width="20" height="14" rx="3" /><path d="M2 10h20" /></>,
  gift: <><polyline points="20 12 20 22 4 22 4 12" /><rect x="2" y="7" width="20" height="5" /><line x1="12" y1="22" x2="12" y2="7" /><path d="M12 7H7.5a2.5 2.5 0 0 1 0-5C11 2 12 7 12 7z" /><path d="M12 7h4.5a2.5 2.5 0 0 0 0-5C13 2 12 7 12 7z" /></>,
  users: <><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 00-3-3.87" /><path d="M16 3.13a4 4 0 010 7.75" /></>,
  check: <polyline points="20 6 9 17 4 12" />,
  clock: <><circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" /></>,
  bell: <><path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9" /><path d="M13.73 21a2 2 0 01-3.46 0" /></>,
};
function Icon({ name, size = 18, stroke = 1.8, color = "currentColor" }: { name: string; size?: number; stroke?: number; color?: string }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={stroke} strokeLinecap="round" strokeLinejoin="round">{ICON[name]}</svg>;
}
function Pi({ name, couleur }: { name: string; couleur: string }) {
  return <span style={{ width: 30, height: 30, borderRadius: 9, flex: "none", display: "flex", alignItems: "center", justifyContent: "center", background: soft(couleur, 12) }}><Icon name={name} size={15} stroke={1.8} color={couleur} /></span>;
}
function AnimatedNumber({ value }: { value: number }) {
  const [display, setDisplay] = useState(value);
  const prev = useRef(value);
  useEffect(() => {
    const from = prev.current;
    prev.current = value;
    const reduced = typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (value <= from || reduced) { setDisplay(value); return; }
    const start = performance.now(), dur = 500;
    let raf = 0;
    const tick = (now: number) => {
      const p = Math.min(1, (now - start) / dur);
      const eased = 1 - Math.pow(1 - p, 3);
      setDisplay(Math.round(from + (value - from) * eased));
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [value]);
  return <>{display}</>;
}

export default function MarchandPage() {
  const { id } = useParams<{ id: string }>();
  const [m, setM] = useState<MarchandPublic | null>(null);
  const [carte, setCarte] = useState<Carte | null>(null);
  const [carteChecked, setCarteChecked] = useState(false); // a-t-on fini de vérifier si l'utilisateur est membre ?
  const [notifs, setNotifs] = useState<Notif[]>([]);
  const [events, setEvents] = useState<Evt[]>([]);
  const [parrainages, setParrainages] = useState(0);
  const [notFound, setNotFound] = useState(false);
  const [showAllHist, setShowAllHist] = useState(false);
  const [quitConfirm, setQuitConfirm] = useState(false);
  const [shareMsg, setShareMsg] = useState(false);

  useEffect(() => {
    // Affichage instantané depuis le cache (préchargé par Mes cartes)
    try { const cached = sessionStorage.getItem(`wallio_m_${id}`); if (cached) setM(JSON.parse(cached)); } catch { /* */ }
    (async () => {
      try {
        const res = await fetch(`/api/public/marchand/${id}`);
        if (!res.ok) { setNotFound(true); return; }
        const data: MarchandPublic = await res.json();
        setM(data);
        try { sessionStorage.setItem(`wallio_m_${id}`, JSON.stringify(data)); } catch { /* */ }
        const phone = localStorage.getItem(PHONE_KEY) || "";
        if (phone) {
          const snap = await getDocs(query(collection(db, "clients"), where("telephone", "==", phone), where("marchand_id", "==", data.id)));
          if (!snap.empty) {
            const c = snap.docs[0].data();
            const walletId = c.wallet_id as string;
            setCarte({ walletId, clientId: snap.docs[0].id, tampons: (c.tampons as number) || 0, paliersValides: c.paliers_valides as boolean[] | undefined, recompenseEnAttente: !!c.recompense_en_attente, nfcId: c.nfc_id as string | undefined, apnsToken: !!c.apns_push_token, walletType: (c.wallet_type as string) || null, notifOn: !!c.fcm_token });
            const raw = (c.notifs as Notif[] | undefined) || [];
            setNotifs([...raw].sort((a, b) => b.sentAt.localeCompare(a.sentAt)).slice(0, 2));
            fetch(`/api/public/carte?walletId=${walletId}`).then(r => r.json()).then(d => { setEvents(d.events || []); setParrainages(d.parrainagesReussis || 0); }).catch(() => {});
          }
        }
        setCarteChecked(true);
      } catch { setNotFound(true); setCarteChecked(true); }
    })();
  }, [id]);

  // Rebond iOS natif (même sensation que Mes cartes)
  useEffect(() => {
    document.body.style.overscrollBehavior = "auto";
    document.documentElement.style.overscrollBehavior = "auto";
    return () => { document.body.style.overscrollBehavior = ""; document.documentElement.style.overscrollBehavior = ""; };
  }, []);

  if (!m) return <Centered>{notFound ? "Ce commerce est introuvable." : "Chargement…"}</Centered>;

  const couleur = m.couleur_principale || "#5B7CFA";
  const membre = !!carte;

  let objectif = m.objectif_tampons || 10;
  let reward = m.nom_recompense || "";
  if (m.mode_recompense === "progressif" && m.paliers?.length && carte) {
    const pv = carte.paliersValides || [];
    const prochain = m.paliers.find((p, i) => !pv[i]) ?? m.paliers[m.paliers.length - 1];
    objectif = prochain.tampons; reward = prochain.recompense;
  }
  const tampons = carte?.tampons || 0;
  const restants = Math.max(0, objectif - tampons);
  const ready = membre && (restants <= 0 || carte!.recompenseEnAttente);

  const catLabel = m.categorie ? CAT_LABELS[m.categorie] ?? "" : "";
  const sousTitre = [catLabel, m.ville].filter(Boolean).join(" · ");

  // « Itinéraire » : on privilégie le lien Google Maps exact du commerçant ;
  // on ne retombe sur les coordonnées (approximatives) que s'il n'y a pas de lien.
  const itineraire = m.maps_url
    ? m.maps_url
    : m.latitude != null && m.longitude != null
      ? (isIOS() ? `https://maps.apple.com/?daddr=${m.latitude},${m.longitude}` : `https://www.google.com/maps/dir/?api=1&destination=${m.latitude},${m.longitude}`)
      : null;
  const instaHref = m.instagram ? `https://instagram.com/${m.instagram}` : null;
  const telHref = m.telephone ? `tel:${m.telephone}` : null;
  const walletHref = carte ? (isIOS() ? `/api/apple-wallet/generate/${carte.walletId}` : `/api/google-wallet/generate/${carte.walletId}`) : null;

  const actions: { icon: string; label: string; href: string }[] = [];
  if (itineraire) actions.push({ icon: "nav", label: "Itinéraire", href: itineraire });
  if (telHref) actions.push({ icon: "phone", label: "Appeler", href: telHref });
  if (instaHref) actions.push({ icon: "insta", label: "Instagram", href: instaHref });

  // Carte déjà dans le Wallet ? (signal fiable : apns pour Apple, wallet_type pour Google)
  const inWallet = membre && (isIOS() ? carte!.apnsToken : carte!.walletType === "google");
  const walletLabel = isIOS() ? "Apple Wallet" : "Google Wallet";

  function partager() {
    if (!carte) return;
    const base = carte.nfcId ? `${window.location.origin}/nfc/${carte.nfcId}?ref=${carte.walletId}` : `${window.location.origin}/ref/${carte.walletId}`;
    const message = `Je suis client chez ${m!.nom} et je t'invite à rejoindre leur programme de fidélité. Quand tu scannes pour la première fois, on gagne chacun 1 tampon :\n${base}`;
    if (navigator.share) navigator.share({ text: message }).catch(() => {});
    else navigator.clipboard.writeText(message).then(() => { setShareMsg(true); setTimeout(() => setShareMsg(false), 2000); }).catch(() => {});
  }
  async function quitter() {
    if (!carte) return;
    try { await fetch("/api/public/quitter", { method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ walletId: carte.walletId }) }); } catch { /* */ }
    window.location.href = "/mes-cartes";
  }

  const todayKey = JOURS[(new Date().getDay() + 6) % 7];
  const evtIcon = (e: Evt) => e.type === "auto_validation" || e.recompense || e.type === "recompense" || e.type === "choix_gerant" ? "gift" : e.type.includes("parrain") ? "users" : "check";
  const evtLabel = (e: Evt) => e.type === "auto_validation" ? "Récompense délivrée" : (e.recompense || e.type === "recompense" || e.type === "choix_gerant") ? "Récompense validée" : e.type.includes("parrain") ? "Tampon de parrainage" : "Tampon ajouté";

  return (
    <main className="page-enter" style={{ minHeight: "100dvh", background: BG, color: FG, fontFamily: "-apple-system, 'SF Pro Display', system-ui, sans-serif" }}>
      <div style={{ maxWidth: 480, margin: "0 auto", paddingBottom: membre ? 48 : 110 }}>

        {/* HERO + dégradé + boutons ronds */}
        <div style={{ position: "relative", height: 300 }}>
          <div style={{ position: "absolute", inset: 0, backgroundColor: couleur, backgroundImage: m.strip_url ? `url(${m.strip_url})` : undefined, backgroundSize: "cover", backgroundPosition: "center 30%" }} />
          <div style={{ position: "absolute", inset: 0, background: `linear-gradient(180deg,rgba(0,0,0,.30) 0%,rgba(0,0,0,0) 26%,${BG}00 52%,${BG}cc 80%,${BG} 100%)` }} />
          <button onClick={() => (history.length > 1 ? history.back() : (window.location.href = "/mes-cartes"))} aria-label="Retour" style={gbStyle("left")}><Icon name="back" size={20} color={FG} /></button>
          {membre && <button onClick={partager} aria-label="Partager" style={gbStyle("right")}><Icon name="share" size={17} color={FG} /></button>}
        </div>

        {/* IDENTITÉ (remonte sur le hero) */}
        <div style={{ padding: "0 20px", marginTop: -74, position: "relative" }}>
          <div style={{ width: 64, height: 64, borderRadius: 16, background: "#fff center/cover", boxShadow: "0 0 0 3px #fff," + SHADOW, backgroundImage: m.logo_url ? `url(${m.logo_url})` : undefined, backgroundSize: "cover", backgroundPosition: "center", display: "flex", alignItems: "center", justifyContent: "center" }}>
            {!m.logo_url && <span style={{ fontSize: 24, fontWeight: 700, color: couleur }}>{m.nom[0]?.toUpperCase()}</span>}
          </div>
          <h2 style={{ fontSize: 26, fontWeight: 700, letterSpacing: -0.7, marginTop: 14 }}>{m.nom}</h2>
          {sousTitre && <p style={{ fontSize: 15, color: FG2, marginTop: 4 }}>{sousTitre}</p>}
          {m.statut && (
            <p style={{ fontSize: 15, color: FG2, marginTop: 4, display: "flex", alignItems: "center", gap: 6 }}>
              {m.statut.ouvert && <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#34C759" }} />}
              <span style={{ color: m.statut.ouvert ? FG : FG2, fontWeight: m.statut.ouvert ? 500 : 400 }}>{m.statut.label}</span>
            </p>
          )}
        </div>

        <div style={{ padding: "18px 16px 0", display: "flex", flexDirection: "column", gap: 12 }}>
          {/* Actions */}
          {actions.length > 0 && (
            <div style={{ display: "grid", gap: 8, gridTemplateColumns: `repeat(${actions.length},1fr)` }}>
              {actions.map(a => {
                const ext = a.href.startsWith("http") || a.href.startsWith("tel:");
                return <a key={a.label} href={a.href} {...(ext ? { target: "_blank", rel: "noopener noreferrer" } : {})} style={{ background: "#fff", borderRadius: 14, boxShadow: SHADOW, height: 66, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 6, fontSize: 12, fontWeight: 500, color: FG2, textDecoration: "none" }}><Icon name={a.icon} size={20} stroke={1.6} color={couleur} />{a.label}</a>;
              })}
            </div>
          )}

          {/* Wallet : bouton d'ajout bien visible (membre uniquement) */}
          {membre && walletHref && (
            inWallet ? (
              <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 7, fontSize: 13, color: FG3, padding: "2px 0" }}>
                <Icon name="check" size={15} stroke={2} color="#2E9E5B" />
                <span>Dans {walletLabel}</span>
              </div>
            ) : (
              <a href={walletHref} style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 10, height: 52, borderRadius: 13, background: "#000", textDecoration: "none" }}>
                <Icon name="wallet" size={20} stroke={1.7} color="#fff" />
                <span style={{ color: "#fff", fontSize: 16, fontWeight: 600 }}>Ajouter à {walletLabel}</span>
              </a>
            )
          )}

          {/* Récompense prête */}
          {ready && (
            <div style={{ borderRadius: 16, padding: "16px 18px", display: "flex", gap: 14, alignItems: "flex-start", color: "#fff", background: couleur }}>
              <span style={{ width: 38, height: 38, borderRadius: 11, flex: "none", background: "rgba(255,255,255,.16)", display: "flex", alignItems: "center", justifyContent: "center" }}><Icon name="gift" size={19} stroke={1.7} color="#fff" /></span>
              <div><b style={{ fontSize: 16, fontWeight: 600 }}>{reward} est offert</b><p style={{ fontSize: 13.5, opacity: 0.78, marginTop: 3, lineHeight: 1.4 }}>À récupérer lors de votre prochaine visite. L&apos;équipe la valide au comptoir, puis votre carte repart à zéro.</p></div>
            </div>
          )}

          {/* Progression / Comment ça marche — attend de savoir si l'utilisateur est membre */}
          {(membre || carteChecked) && (
          <div style={cardStyle}>
            {membre ? (<>
              <div style={{ display: "flex", alignItems: "baseline", gap: 4 }}>
                <b style={{ fontSize: 42, fontWeight: 700, lineHeight: 1, letterSpacing: -1.5 }}><AnimatedNumber value={tampons} /></b>
                <span style={{ fontSize: 18, fontWeight: 500, color: FG3 }}>/ {objectif}</span>
                <em style={{ marginLeft: "auto", alignSelf: "center", fontSize: 13, fontWeight: 600, padding: "6px 10px", borderRadius: 10, fontStyle: "normal", background: soft(couleur, 12), color: couleur }}>{restants ? "Encore " + restants : "Complet"}</em>
              </div>
              <div style={{ display: "flex", gap: 4, marginTop: 14, height: 8 }}>
                {Array.from({ length: Math.min(objectif, 20) }).map((_, i) => <i key={i} style={{ flex: 1, borderRadius: 4, background: i < tampons ? couleur : soft(couleur, 16) }} />)}
              </div>
              {m.mode_recompense === "progressif" && m.paliers?.length ? (
                <div style={{ marginTop: 12, display: "flex", flexDirection: "column", gap: 6 }}>
                  {m.paliers.map((p, i) => { const done = (carte!.paliersValides || [])[i] || tampons >= p.tampons; return <div key={i} style={{ display: "flex", justifyContent: "space-between", fontSize: 14, color: done ? couleur : FG2 }}><span>{p.recompense}</span><span>{p.tampons} tampons</span></div>; })}
                </div>
              ) : m.mode_recompense === "flex" && m.palier_intermediaire ? (
                <div style={{ marginTop: 12, display: "flex", flexDirection: "column", gap: 6, fontSize: 14, color: FG2 }}>
                  <div style={{ display: "flex", justifyContent: "space-between" }}><span>{m.nom_recompense_petit}</span><span>{m.palier_intermediaire} tampons</span></div>
                  <div style={{ display: "flex", justifyContent: "space-between" }}><span>{m.nom_recompense_grand}</span><span>{m.objectif_tampons} tampons</span></div>
                </div>
              ) : (
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 12, fontSize: 14, color: FG2 }}><Icon name="gift" size={16} stroke={1.6} color={couleur} /><span>À {objectif} tampons · <b style={{ color: FG, fontWeight: 500 }}>{reward}</b></span></div>
              )}
            </>) : (<>
              <p style={{ fontSize: 15, fontWeight: 600, marginBottom: 4 }}>Comment ça marche</p>
              <p style={{ fontSize: 14, color: FG2 }}>{m.objectif_tampons} tampons · 1 par visite · Récompense : {m.nom_recompense}</p>
              <div style={{ display: "flex", gap: 4, marginTop: 14, height: 8 }}>{Array.from({ length: Math.min(m.objectif_tampons || 10, 20) }).map((_, i) => <i key={i} style={{ flex: 1, borderRadius: 4, background: soft(couleur, 16) }} />)}</div>
            </>)}
          </div>
          )}

          {/* Parrainage */}
          {membre && m.parrainage_actif && (
            <div style={{ ...cardStyle, display: "flex", flexDirection: "column", gap: 12 }}>
              <div style={{ display: "flex", gap: 14, alignItems: "center" }}>
                <Pi name="users" couleur={couleur} />
                <div style={{ flex: 1 }}><b style={{ fontSize: 16, fontWeight: 600 }}>Parrainez un ami</b><small style={{ display: "block", fontSize: 13.5, color: FG2, marginTop: 2, lineHeight: 1.35 }}>Quand il scanne pour la première fois chez {m.nom}, vous gagnez chacun 1 tampon.</small></div>
              </div>
              <button onClick={partager} style={{ height: 46, borderRadius: 13, display: "flex", alignItems: "center", justifyContent: "center", gap: 8, fontWeight: 600, fontSize: 15, background: couleur, color: "#fff", border: "none", cursor: "pointer" }}><Icon name="share" size={17} stroke={1.8} color="#fff" />{shareMsg ? "Lien copié !" : "Inviter un ami"}</button>
              {parrainages > 0 && <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12.5, color: FG3, borderTop: ".5px solid " + SEP, paddingTop: 10 }}><span>{parrainages} ami{parrainages > 1 ? "s" : ""} parrainé{parrainages > 1 ? "s" : ""}</span><span style={{ color: couleur, fontWeight: 500 }}>+{parrainages} tampon{parrainages > 1 ? "s" : ""} gagné{parrainages > 1 ? "s" : ""}</span></div>}
            </div>
          )}

          {/* Informations */}
          {(m.latitude != null || m.horaires) && (
            <div style={cardStyle}>
              {m.latitude != null && m.longitude != null && (
                <Link href="/mes-cartes?tab=map" style={{ display: "block", height: 120, borderRadius: 12, overflow: "hidden", marginBottom: 6, background: soft(couleur, 10) }}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={`/api/public/map-snapshot?lat=${m.latitude}&lng=${m.longitude}&color=${couleur.replace("#", "")}`} alt="Carte" style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
                </Link>
              )}
              {m.horaires && (() => {
                const todayPl = m.horaires![todayKey] || [];
                return (
                  <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 0" }}>
                    <Pi name="clock" couleur={couleur} />
                    <div style={{ flex: 1, fontSize: 14 }}>Aujourd&apos;hui · {todayPl.length ? todayPl.map(p => `${p.ouverture} – ${p.fermeture}`).join(", ") : "Fermé"}</div>
                  </div>
                );
              })()}
              {m.horaires && (
                <div style={{ display: "grid", gridTemplateColumns: "1fr auto", rowGap: 6, fontSize: 13, color: FG3, padding: "0 0 8px 42px" }}>
                  {JOURS.map(j => { const pl = m.horaires![j] || []; const today = j === todayKey; return <div key={j} style={{ display: "contents" }}><span style={{ textTransform: "capitalize", color: today ? FG : FG3, fontWeight: today ? 500 : 400 }}>{JOUR_LABELS[j]}</span><span style={{ color: today ? FG : FG3, fontWeight: today ? 500 : 400, textAlign: "right" }}>{pl.length ? pl.map(p => `${p.ouverture}–${p.fermeture}`).join(", ") : "Fermé"}</span></div>; })}
                </div>
              )}
            </div>
          )}

          {/* Vos visites */}
          {membre && events.length > 0 && (<>
            <div style={{ padding: "12px 4px 0" }}><p style={capsStyle}>Vos visites</p></div>
            <div style={{ ...cardStyle, padding: "6px 16px" }}>
              {(showAllHist ? events : events.slice(0, 4)).map((e, i, arr) => (
                <div key={i} style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 0", fontSize: 14, fontWeight: 500, borderTop: i ? ".5px solid " + SEP : "none" }}>
                  <Pi name={evtIcon(e)} couleur={couleur} />
                  <div style={{ flex: 1 }}>{evtLabel(e)}<small style={{ display: "block", fontSize: 12.5, fontWeight: 400, color: FG3, marginTop: 1 }}>{e.at ? new Date(e.at * 1000).toLocaleDateString("fr-FR", { day: "numeric", month: "short" }) : ""}</small></div>
                  <em style={{ fontStyle: "normal", fontSize: 13, color: FG3 }}>{!e.recompense && e.tampons_apres != null ? `${e.tampons_apres}/${objectif}` : ""}</em>
                  {i === arr.length - 1 && events.length > 4 && null}
                </div>
              ))}
              {events.length > 4 && <div onClick={() => setShowAllHist(v => !v)} style={{ textAlign: "center", color: "#4B4FD6", fontSize: 13.5, padding: "10px 0", cursor: "pointer", borderTop: ".5px solid " + SEP }}>{showAllHist ? "Réduire" : "Tout l'historique"}</div>}
            </div>
          </>)}

          {/* Messages */}
          {membre && notifs.length > 0 && (<>
            <div style={{ padding: "12px 4px 0" }}><p style={capsStyle}>Messages</p></div>
            <div style={{ ...cardStyle, padding: "6px 16px" }}>
              {notifs.map((n, i) => (
                <div key={n.id} style={{ padding: "10px 0", borderTop: i ? ".5px solid " + SEP : "none" }}>
                  <div style={{ display: "flex", fontSize: 14, fontWeight: 500 }}>{n.title}<em style={{ marginLeft: "auto", fontStyle: "normal", fontSize: 12.5, fontWeight: 400, color: FG3 }}>{new Date(n.sentAt).toLocaleDateString("fr-FR", { day: "numeric", month: "short" })}</em></div>
                  <p style={{ fontSize: 13.5, color: FG2, marginTop: 2 }}>{n.body}</p>
                </div>
              ))}
            </div>
          </>)}

          {/* Notifications du commerce */}
          {membre && (
            <a href={`/preferences/${carte!.walletId}`} style={{ ...cardStyle, padding: "6px 16px", textDecoration: "none", color: FG }}>
              <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 0", fontSize: 14, fontWeight: 500 }}><Pi name="bell" couleur={couleur} /><div style={{ flex: 1 }}>Notifications de {m.nom}</div><em style={{ fontStyle: "normal", fontSize: 13, color: FG3 }}>{carte!.notifOn ? "Activées" : "Désactivées"}</em></div>
            </a>
          )}

          {membre && <div onClick={() => setQuitConfirm(true)} style={{ textAlign: "center", color: "#FF3B30", fontSize: 14, fontWeight: 500, opacity: 0.8, padding: "22px 0 40px", cursor: "pointer" }}>Quitter le programme</div>}
        </div>
      </div>

      {/* Non-membre : bouton fixe */}
      {carteChecked && !membre && (
        <div style={{ position: "fixed", left: 0, right: 0, bottom: 0, padding: "12px 16px max(20px, env(safe-area-inset-bottom, 20px))", background: `linear-gradient(180deg,${BG}00,${BG} 30%)` }}>
          <div style={{ maxWidth: 480, margin: "0 auto" }}>
            <a href="/inscription" style={{ display: "block", textAlign: "center", height: 52, lineHeight: "52px", borderRadius: 16, background: couleur, color: "#fff", fontSize: 16, fontWeight: 600, textDecoration: "none" }}>Rejoindre {m.nom}</a>
          </div>
        </div>
      )}

      {quitConfirm && (
        <div style={{ position: "fixed", inset: 0, zIndex: 100, display: "flex", alignItems: "flex-end", justifyContent: "center", background: "rgba(0,0,0,0.35)", backdropFilter: "blur(6px)" }}>
          <div style={{ width: "100%", maxWidth: 480, background: "#fff", borderRadius: "24px 24px 0 0", padding: "28px 24px 48px" }}>
            <div style={{ width: 36, height: 4, background: "rgba(0,0,0,0.1)", borderRadius: 2, margin: "0 auto 24px" }} />
            <p style={{ fontSize: 18, fontWeight: 700, textAlign: "center", marginBottom: 8 }}>Quitter {m.nom} ?</p>
            <p style={{ fontSize: 14, color: FG2, textAlign: "center", lineHeight: 1.6, marginBottom: 28 }}>Votre carte et vos tampons chez ce commerce seront supprimés.</p>
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              <button onClick={quitter} style={{ width: "100%", padding: "15px 0", borderRadius: 14, background: "#FF3B30", color: "#fff", fontSize: 16, fontWeight: 700, border: "none", cursor: "pointer" }}>Quitter le programme</button>
              <button onClick={() => setQuitConfirm(false)} style={{ width: "100%", padding: "15px 0", borderRadius: 14, background: "rgba(0,0,0,0.05)", color: FG, fontSize: 16, fontWeight: 500, border: "none", cursor: "pointer" }}>Annuler</button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}

const cardStyle: React.CSSProperties = { background: "#fff", borderRadius: 16, boxShadow: SHADOW, padding: "16px 18px" };
const capsStyle: React.CSSProperties = { fontSize: 11, fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase", color: FG3 };
function gbStyle(side: "left" | "right"): React.CSSProperties {
  return { position: "absolute", top: "max(16px, env(safe-area-inset-top, 16px))", [side]: 16, width: 36, height: 36, borderRadius: "50%", background: "rgba(255,255,255,.8)", backdropFilter: "blur(14px)", WebkitBackdropFilter: "blur(14px)", border: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" } as React.CSSProperties;
}
function Centered({ children }: { children: React.ReactNode }) {
  return <main style={{ minHeight: "100dvh", display: "flex", alignItems: "center", justifyContent: "center", background: BG, color: FG3, fontFamily: "-apple-system, 'SF Pro Display', system-ui, sans-serif", fontSize: 14 }}>{children}</main>;
}
