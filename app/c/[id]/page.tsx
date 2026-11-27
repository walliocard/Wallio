"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { collection, query, where, getDocs } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { JOUR_LABELS } from "@/lib/horaires";

const PHONE_KEY = "wallio_client_phone";
const FG = "#1C2333", SEC = "#8E9BB5", LINE = "rgba(142,155,181,0.14)";
const JOURS = ["lun", "mar", "mer", "jeu", "ven", "sam", "dim"];

type Statut = { ouvert: boolean; etat: string; label: string } | null;
type MarchandPublic = {
  id: string; nom: string; logo_url: string | null; strip_url: string | null;
  couleur_principale: string | null; categorie: string | null; ville: string | null;
  latitude: number | null; longitude: number | null; horaires: Record<string, { ouverture: string; fermeture: string }[]> | null;
  statut: Statut; telephone: string | null; instagram: string | null;
  objectif_tampons: number | null; nom_recompense: string | null; mode_recompense: string | null;
  paliers: { tampons: number; recompense: string }[] | null;
  palier_intermediaire: number | null; nom_recompense_petit: string | null; nom_recompense_grand: string | null;
  parrainage_actif: boolean; date_inscription: number | null;
};
type Carte = { walletId: string; clientId: string; tampons: number; paliersValides?: boolean[]; recompenseEnAttente: boolean; nfcId?: string; hasWallet: boolean; notifOn: boolean; nom_recompense?: string };
type Notif = { id: string; title: string; body: string; sentAt: string };
type Evt = { type: string; recompense: boolean; at: number | null };

const CAT_LABELS: Record<string, string> = { cafe: "Café", coffee_shop: "Coffee shop", matcha_bar: "Matcha bar", restaurant: "Restaurant", boulangerie: "Boulangerie", patisserie: "Pâtisserie", barbier: "Barbier", coiffure: "Coiffure", beaute: "Beauté", autre: "" };

function isIOS() { return typeof navigator !== "undefined" && /iPad|iPhone|iPod/.test(navigator.userAgent); }

export default function MarchandPage() {
  const { id } = useParams<{ id: string }>();
  const [m, setM] = useState<MarchandPublic | null>(null);
  const [carte, setCarte] = useState<Carte | null>(null);
  const [notifs, setNotifs] = useState<Notif[]>([]);
  const [events, setEvents] = useState<Evt[]>([]);
  const [parrainages, setParrainages] = useState(0);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [showAllHist, setShowAllHist] = useState(false);
  const [quitConfirm, setQuitConfirm] = useState(false);
  const [shareMsg, setShareMsg] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch(`/api/public/marchand/${id}`);
        if (!res.ok) { setNotFound(true); setLoading(false); return; }
        const data: MarchandPublic = await res.json();
        setM(data);

        const phone = localStorage.getItem(PHONE_KEY) || "";
        if (phone) {
          const snap = await getDocs(query(collection(db, "clients"), where("telephone", "==", phone), where("marchand_id", "==", data.id)));
          if (!snap.empty) {
            const c = snap.docs[0].data();
            const walletId = c.wallet_id as string;
            setCarte({
              walletId, clientId: snap.docs[0].id, tampons: (c.tampons as number) || 0,
              paliersValides: c.paliers_valides as boolean[] | undefined,
              recompenseEnAttente: !!c.recompense_en_attente, nfcId: c.nfc_id as string | undefined,
              hasWallet: !!c.wallet_type, notifOn: !!c.fcm_token,
            });
            const raw = (c.notifs as Notif[] | undefined) || [];
            setNotifs([...raw].sort((a, b) => b.sentAt.localeCompare(a.sentAt)).slice(0, 2));
            fetch(`/api/public/carte?walletId=${walletId}`).then(r => r.json()).then(d => {
              setEvents(d.events || []); setParrainages(d.parrainagesReussis || 0);
            }).catch(() => {});
          }
        }
      } catch { setNotFound(true); }
      setLoading(false);
    })();
  }, [id]);

  if (loading) return <Centered>Chargement…</Centered>;
  if (notFound || !m) return <Centered>Ce commerce est introuvable.</Centered>;

  const couleur = m.couleur_principale || "#5B7CFA";
  const membre = !!carte;

  // Progression (mode cyclique / progressif / flex)
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

  // Actions
  const itineraire = m.latitude != null && m.longitude != null
    ? (isIOS() ? `https://maps.apple.com/?daddr=${m.latitude},${m.longitude}` : `https://www.google.com/maps/dir/?api=1&destination=${m.latitude},${m.longitude}`)
    : null;
  const instaHref = m.instagram ? `https://instagram.com/${m.instagram}` : null;
  const telHref = m.telephone ? `tel:${m.telephone}` : null;
  const walletHref = carte ? (isIOS() ? `/api/apple-wallet/generate/${carte.walletId}` : `/api/google-wallet/generate/${carte.walletId}`) : null;

  function partager() {
    if (!carte) return;
    const base = carte.nfcId ? `${window.location.origin}/nfc/${carte.nfcId}?ref=${carte.walletId}` : `${window.location.origin}/ref/${carte.walletId}`;
    const message = `Je suis client chez ${m!.nom} et je t'invite à rejoindre leur programme de fidélité. Quand tu scannes pour la première fois, on gagne chacun 1 tampon :\n${base}`;
    if (navigator.share) navigator.share({ text: message }).catch(() => {});
    else navigator.clipboard.writeText(message).then(() => { setShareMsg(true); setTimeout(() => setShareMsg(false), 2000); }).catch(() => {});
  }
  async function quitter() {
    if (!carte) return;
    try { await fetch("/api/public/quitter", { method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ walletId: carte.walletId }) }); } catch { /* ignore */ }
    window.location.href = "/mes-cartes";
  }

  const todayKey = JOURS[(new Date().getDay() + 6) % 7]; // getDay 0=dim → notre ordre lun..dim

  const evtLabel = (e: Evt) => {
    if (e.type === "auto_validation") return "Récompense délivrée";
    if (e.recompense || e.type === "recompense" || e.type === "choix_gerant") return "Récompense validée";
    if (e.type.includes("parrain")) return "Tampon de parrainage";
    return "Tampon";
  };

  return (
    <main style={{ minHeight: "100dvh", background: "#F7F7FA", color: FG, fontFamily: "Geist, -apple-system, system-ui, sans-serif" }}>
      <div style={{ maxWidth: 480, margin: "0 auto", paddingBottom: 64 }}>

        {/* 1. Bannière + boutons ronds */}
        <div style={{ position: "relative", height: 190, background: m.strip_url ? `center/cover url(${m.strip_url})` : couleur }}>
          <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "flex-start", justifyContent: "space-between", padding: "max(12px, env(safe-area-inset-top, 12px)) 16px 0" }}>
            <RoundBtn onClick={() => history.length > 1 ? history.back() : (window.location.href = "/mes-cartes")} aria="Retour"><path d="M15 18l-6-6 6-6" /></RoundBtn>
            {membre && <RoundBtn onClick={partager} aria="Partager"><circle cx="18" cy="5" r="3" /><circle cx="6" cy="12" r="3" /><circle cx="18" cy="19" r="3" /><line x1="8.59" y1="13.51" x2="15.42" y2="17.49" /><line x1="15.41" y1="6.51" x2="8.59" y2="10.49" /></RoundBtn>}
          </div>
        </div>

        <div style={{ padding: "0 18px" }}>
          {/* 2. Logo + nom + statut */}
          <div style={{ display: "flex", gap: 14, marginTop: -28, alignItems: "flex-end" }}>
            <div style={{ width: 72, height: 72, borderRadius: 18, background: "#fff", border: "3px solid #F7F7FA", flexShrink: 0, backgroundImage: m.logo_url ? `url(${m.logo_url})` : undefined, backgroundSize: "cover", backgroundPosition: "center", display: "flex", alignItems: "center", justifyContent: "center" }}>
              {!m.logo_url && <span style={{ fontSize: 26, fontWeight: 700, color: couleur }}>{m.nom[0]?.toUpperCase()}</span>}
            </div>
          </div>
          <h1 style={{ fontSize: 23, fontWeight: 700, letterSpacing: -0.4, marginTop: 12 }}>{m.nom}</h1>
          {sousTitre && <p style={{ fontSize: 14, color: SEC, marginTop: 2 }}>{sousTitre}</p>}
          {m.statut && <p style={{ fontSize: 13, marginTop: 4, color: m.statut.ouvert ? "#2E9E5B" : SEC }}>{m.statut.label}</p>}

          {/* 3. Actions */}
          <div style={{ display: "flex", gap: 8, marginTop: 16 }}>
            {itineraire && <Action href={itineraire} couleur={couleur} label="Itinéraire"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z" /><circle cx="12" cy="10" r="3" /></Action>}
            {telHref && <Action href={telHref} couleur={couleur} label="Appeler"><path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07 19.5 19.5 0 01-6-6 19.79 19.79 0 01-3.07-8.67A2 2 0 014.11 2h3a2 2 0 012 1.72c.13.96.36 1.9.7 2.81a2 2 0 01-.45 2.11L8.09 9.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45c.9.34 1.85.57 2.81.7A2 2 0 0122 16.92z" /></Action>}
            {instaHref && <Action href={instaHref} couleur={couleur} label="Instagram"><rect x="2" y="2" width="20" height="20" rx="5" /><circle cx="12" cy="12" r="4" /><circle cx="17.5" cy="6.5" r="0.5" fill={couleur} /></Action>}
            {membre && walletHref && <Action href={walletHref} couleur={couleur} label={carte!.hasWallet ? "Dans le Wallet" : "Ajouter"}><rect x="2" y="5" width="20" height="14" rx="3" /><path d="M2 10h20" /></Action>}
          </div>

          {/* 4. Récompense prête */}
          {ready && (
            <div style={{ marginTop: 16, padding: "14px 16px", borderRadius: 16, background: couleur + "14", border: "1px solid " + couleur + "33" }}>
              <p style={{ fontSize: 14, fontWeight: 600, color: couleur }}>{reward} est offert</p>
              <p style={{ fontSize: 13, color: "#5B6676", marginTop: 4, lineHeight: 1.5 }}>À récupérer lors de votre prochaine visite. L&apos;équipe la valide au comptoir, puis votre carte repart à zéro.</p>
            </div>
          )}

          {/* 5. Progression */}
          {membre ? (
            <Section title="Progression">
              <div style={{ display: "flex", alignItems: "baseline", gap: 8 }}>
                <span style={{ fontSize: 40, fontWeight: 700, color: couleur, letterSpacing: -1 }}>{tampons}</span>
                <span style={{ fontSize: 16, color: SEC }}>/ {objectif}</span>
                {!ready && <span style={{ marginLeft: "auto", fontSize: 13, color: SEC }}>Encore {restants}</span>}
              </div>
              <SegBar n={objectif} filled={tampons} couleur={couleur} />
              {m.mode_recompense === "progressif" && m.paliers?.length ? (
                <div style={{ marginTop: 10, display: "flex", flexDirection: "column", gap: 6 }}>
                  {m.paliers.map((p, i) => {
                    const done = (carte!.paliersValides || [])[i] || tampons >= p.tampons;
                    return <div key={i} style={{ display: "flex", justifyContent: "space-between", fontSize: 13, color: done ? couleur : SEC }}><span>{p.recompense}</span><span>{p.tampons} tampons</span></div>;
                  })}
                </div>
              ) : m.mode_recompense === "flex" && m.palier_intermediaire ? (
                <div style={{ marginTop: 10, display: "flex", flexDirection: "column", gap: 6, fontSize: 13, color: SEC }}>
                  <div style={{ display: "flex", justifyContent: "space-between" }}><span>{m.nom_recompense_petit}</span><span>{m.palier_intermediaire} tampons</span></div>
                  <div style={{ display: "flex", justifyContent: "space-between" }}><span>{m.nom_recompense_grand}</span><span>{m.objectif_tampons} tampons</span></div>
                </div>
              ) : (
                <p style={{ marginTop: 10, fontSize: 13, color: SEC }}>À {objectif} tampons · {reward}</p>
              )}
            </Section>
          ) : (
            <Section title="Comment ça marche">
              <p style={{ fontSize: 14, color: FG }}>{m.objectif_tampons} tampons · 1 par visite · Récompense : {m.nom_recompense}</p>
              <SegBar n={m.objectif_tampons || 10} filled={0} couleur={couleur} />
            </Section>
          )}

          {/* 6. Parrainage */}
          {membre && m.parrainage_actif && (
            <div style={{ marginTop: 20, padding: "16px", borderRadius: 18, background: couleur + "0E", border: "1px solid " + couleur + "22" }}>
              <p style={{ fontSize: 15, fontWeight: 600 }}>Parrainez un ami</p>
              <p style={{ fontSize: 13, color: "#5B6676", marginTop: 3, lineHeight: 1.5 }}>Quand il scanne pour la première fois chez {m.nom}, vous gagnez chacun 1 tampon.</p>
              <button onClick={partager} style={{ marginTop: 12, width: "100%", padding: "13px 0", borderRadius: 14, background: couleur, color: "#fff", fontSize: 15, fontWeight: 600, border: "none", cursor: "pointer" }}>
                {shareMsg ? "Lien copié !" : "Inviter un ami"}
              </button>
              {parrainages > 0 && <p style={{ fontSize: 12, color: SEC, textAlign: "center", marginTop: 10 }}>{parrainages} ami{parrainages > 1 ? "s" : ""} parrainé{parrainages > 1 ? "s" : ""} · +{parrainages} tampon{parrainages > 1 ? "s" : ""} gagné{parrainages > 1 ? "s" : ""}</p>}
            </div>
          )}

          {/* 7. Informations */}
          {(m.latitude != null || m.horaires || m.telephone) && (
            <Section title="Informations">
              {m.latitude != null && m.longitude != null && (
                <iframe title="Carte" style={{ width: "100%", height: 150, border: "1px solid " + LINE, borderRadius: 12, marginBottom: 12 }}
                  src={`https://www.openstreetmap.org/export/embed.html?bbox=${m.longitude - 0.004}%2C${m.latitude - 0.003}%2C${m.longitude + 0.004}%2C${m.latitude + 0.003}&layer=mapnik&marker=${m.latitude}%2C${m.longitude}`} />
              )}
              {m.horaires && (
                <div style={{ display: "flex", flexDirection: "column", gap: 4, marginBottom: m.telephone ? 12 : 0 }}>
                  {JOURS.map(j => {
                    const plages = m.horaires![j] || [];
                    const isToday = j === todayKey;
                    return (
                      <div key={j} style={{ display: "flex", justifyContent: "space-between", fontSize: 13, fontWeight: isToday ? 600 : 400, color: isToday ? FG : SEC }}>
                        <span style={{ textTransform: "capitalize" }}>{JOUR_LABELS[j]}</span>
                        <span>{plages.length ? plages.map(p => `${p.ouverture}–${p.fermeture}`).join(", ") : "Fermé"}</span>
                      </div>
                    );
                  })}
                </div>
              )}
              {m.telephone && <a href={telHref!} style={{ fontSize: 14, color: couleur, textDecoration: "none" }}>{m.telephone}</a>}
            </Section>
          )}

          {/* 8. Vos visites */}
          {membre && events.length > 0 && (
            <Section title="Vos visites">
              {(showAllHist ? events : events.slice(0, 4)).map((e, i) => (
                <div key={i} style={{ display: "flex", justifyContent: "space-between", padding: "8px 0", borderBottom: i < events.length - 1 ? "1px solid " + LINE : "none", fontSize: 13 }}>
                  <span style={{ color: FG }}>{evtLabel(e)}</span>
                  <span style={{ color: SEC }}>{e.at ? new Date(e.at * 1000).toLocaleDateString("fr-FR", { day: "numeric", month: "short" }) : ""}</span>
                </div>
              ))}
              {events.length > 4 && <button onClick={() => setShowAllHist(v => !v)} style={{ marginTop: 8, background: "transparent", border: "none", color: couleur, fontSize: 13, cursor: "pointer", padding: 0 }}>{showAllHist ? "Réduire" : "Tout l'historique"}</button>}
            </Section>
          )}

          {/* 9. Derniers messages */}
          {membre && notifs.length > 0 && (
            <Section title="Messages">
              {notifs.map(n => (
                <div key={n.id} style={{ padding: "8px 0", borderBottom: "1px solid " + LINE }}>
                  <p style={{ fontSize: 13, fontWeight: 600 }}>{n.title}</p>
                  <p style={{ fontSize: 13, color: "#6E7A8A", marginTop: 2 }}>{n.body}</p>
                </div>
              ))}
            </Section>
          )}

          {/* 10. Notifications de ce commerce */}
          {membre && (
            <a href={`/preferences/${carte!.walletId}`} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 20, padding: "14px 16px", borderRadius: 14, background: "#fff", border: "1px solid " + LINE, textDecoration: "none", color: FG }}>
              <span style={{ fontSize: 14 }}>Notifications de ce commerce</span>
              <span style={{ fontSize: 13, color: SEC }}>{carte!.notifOn ? "Activées" : "Désactivées"}</span>
            </a>
          )}

          {/* Non-membre : rejoindre */}
          {!membre && (
            <a href="/inscription" style={{ display: "block", textAlign: "center", marginTop: 24, padding: "15px 0", borderRadius: 16, background: couleur, color: "#fff", fontSize: 16, fontWeight: 600, textDecoration: "none" }}>
              Rejoindre {m.nom}
            </a>
          )}

          {/* 11. Quitter le programme */}
          {membre && (
            <div style={{ textAlign: "center", marginTop: 28 }}>
              <button onClick={() => setQuitConfirm(true)} style={{ background: "transparent", border: "none", color: "#C0556A", fontSize: 13, cursor: "pointer" }}>Quitter le programme</button>
            </div>
          )}
        </div>
      </div>

      {quitConfirm && (
        <div style={{ position: "fixed", inset: 0, zIndex: 100, display: "flex", alignItems: "flex-end", justifyContent: "center", background: "rgba(0,0,0,0.35)", backdropFilter: "blur(6px)" }}>
          <div style={{ width: "100%", maxWidth: 480, background: "#fff", borderRadius: "24px 24px 0 0", padding: "28px 24px 48px" }}>
            <div style={{ width: 36, height: 4, background: "rgba(0,0,0,0.1)", borderRadius: 2, margin: "0 auto 24px" }} />
            <p style={{ fontSize: 18, fontWeight: 700, textAlign: "center", marginBottom: 8 }}>Quitter {m.nom} ?</p>
            <p style={{ fontSize: 14, color: SEC, textAlign: "center", lineHeight: 1.6, marginBottom: 28 }}>Votre carte et vos tampons chez ce commerce seront supprimés.</p>
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

// ── Composants ───────────────────────────────────────────────────────────────
function Centered({ children }: { children: React.ReactNode }) {
  return <main style={{ minHeight: "100dvh", display: "flex", alignItems: "center", justifyContent: "center", background: "#F7F7FA", color: SEC, fontFamily: "Geist, system-ui, sans-serif", fontSize: 14 }}>{children}</main>;
}
function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{ marginTop: 22 }}>
      <p style={{ fontSize: 12, fontWeight: 600, color: SEC, textTransform: "uppercase", letterSpacing: 0.4, marginBottom: 8 }}>{title}</p>
      <div style={{ background: "#fff", borderRadius: 16, border: "1px solid " + LINE, padding: "14px 16px" }}>{children}</div>
    </div>
  );
}
function RoundBtn({ children, onClick, aria }: { children: React.ReactNode; onClick: () => void; aria: string }) {
  return (
    <button onClick={onClick} aria-label={aria} style={{ width: 38, height: 38, borderRadius: "50%", background: "rgba(255,255,255,0.9)", backdropFilter: "blur(8px)", border: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 2px 8px rgba(0,0,0,0.12)" }}>
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={FG} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">{children}</svg>
    </button>
  );
}
function Action({ href, couleur, label, children }: { href: string; couleur: string; label: string; children: React.ReactNode }) {
  const external = href.startsWith("http") || href.startsWith("tel:");
  return (
    <a href={href} {...(external ? { target: "_blank", rel: "noopener noreferrer" } : {})} style={{ flex: 1, background: "#fff", border: "1px solid " + LINE, borderRadius: 14, padding: "12px 4px", display: "flex", flexDirection: "column", alignItems: "center", gap: 5, textDecoration: "none" }}>
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={couleur} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">{children}</svg>
      <span style={{ fontSize: 11, color: FG, fontWeight: 500 }}>{label}</span>
    </a>
  );
}
function SegBar({ n, filled, couleur }: { n: number; filled: number; couleur: string }) {
  const segs = Math.min(n, 20);
  return (
    <div style={{ display: "flex", gap: 3, marginTop: 10 }}>
      {Array.from({ length: segs }).map((_, i) => (
        <div key={i} style={{ flex: 1, height: 6, borderRadius: 3, background: i < filled ? couleur : "rgba(142,155,181,0.2)" }} />
      ))}
    </div>
  );
}
