import { redirect } from "next/navigation";
import { adminDb, initAdmin } from "@/lib/admin";

const CAT_LABELS: Record<string, string> = { cafe: "Café", coffee_shop: "Coffee shop", matcha_bar: "Matcha bar", restaurant: "Restaurant", boulangerie: "Boulangerie", patisserie: "Pâtisserie", barbier: "Barbier", coiffure: "Coiffure", beaute: "Beauté", autre: "" };

export default async function RefPage({ params }: { params: Promise<{ walletId: string }> }) {
  const { walletId } = await params;
  initAdmin();

  let nom = "", logo = "", strip = "", couleur = "#5B7CFA", cat = "", ville = "";
  let objectif = 10, recompense = "", nfcId: string | undefined, prenomParrain = "";

  try {
    const clientSnap = await adminDb().collection("clients").where("wallet_id", "==", walletId).limit(1).get();
    if (clientSnap.empty) redirect("/");
    const client = clientSnap.docs[0].data();
    prenomParrain = (client.prenom as string) || "";
    const marchandId = client.marchand_id as string;
    const ms = await adminDb().collection("marchands").doc(marchandId).get();
    const m = ms.data() || {};
    nfcId = m.nfc_id as string | undefined;
    const parrainageActif = !!m.parrainage_actif;
    // Sans parrainage actif ou sans tag NFC : on garde l'ancien comportement.
    if (!nfcId) redirect("/");
    if (!parrainageActif) redirect(`/nfc/${nfcId}`);

    nom = (m.nom as string) || "Ce commerce";
    logo = (m.logo_url as string) || "";
    strip = (m.strip_url as string) || (m.strip_raw_url as string) || "";
    couleur = (m.couleur_principale as string) || couleur;
    cat = CAT_LABELS[(m.categorie as string) || ""] || "";
    ville = (m.ville as string) || "";
    objectif = (m.objectif_tampons as number) || 10;
    recompense = (m.nom_recompense as string) || "";
  } catch {
    redirect("/");
  }

  const sousTitre = [cat, ville].filter(Boolean).join(" · ");
  const etapes = [
    "Rejoignez la carte",
    "Passez et scannez au comptoir",
    `Vous gagnez chacun 1 tampon, puis ${objectif} tampons = ${recompense || "récompense"}`,
  ];

  return (
    <main style={{ minHeight: "100dvh", background: "#F7F7FA", color: "#1C2333", fontFamily: "Geist, -apple-system, system-ui, sans-serif" }}>
      <div style={{ maxWidth: 480, margin: "0 auto", paddingBottom: 120 }}>
        <div style={{ height: 180, background: strip ? `center/cover url(${strip})` : couleur }} />
        <div style={{ padding: "0 20px" }}>
          <div style={{ width: 72, height: 72, borderRadius: 18, background: "#fff", border: "3px solid #F7F7FA", marginTop: -28, display: "flex", alignItems: "center", justifyContent: "center", backgroundImage: logo ? `url(${logo})` : undefined, backgroundSize: "cover", backgroundPosition: "center" }}>
            {!logo && <span style={{ fontSize: 26, fontWeight: 700, color: couleur }}>{nom[0]?.toUpperCase()}</span>}
          </div>

          {prenomParrain && (
            <div style={{ display: "inline-block", marginTop: 14, padding: "6px 12px", borderRadius: 100, background: couleur + "14", color: couleur, fontSize: 13, fontWeight: 600 }}>
              {prenomParrain} vous invite
            </div>
          )}
          <h1 style={{ fontSize: 24, fontWeight: 700, letterSpacing: -0.4, marginTop: 12 }}>Rejoignez {nom}</h1>
          {sousTitre && <p style={{ fontSize: 14, color: "#8E9BB5", marginTop: 2 }}>{sousTitre}</p>}

          <div style={{ marginTop: 18, padding: "16px", borderRadius: 16, background: couleur + "0E", border: "1px solid " + couleur + "22" }}>
            <p style={{ fontSize: 15, fontWeight: 600, color: couleur }}>+1 tampon pour vous deux</p>
            <p style={{ fontSize: 13, color: "#5B6676", marginTop: 3 }}>à votre premier passage chez {nom}.</p>
          </div>

          <p style={{ fontSize: 12, fontWeight: 600, color: "#8E9BB5", textTransform: "uppercase", letterSpacing: 0.4, margin: "24px 0 10px" }}>Comment ça marche</p>
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {etapes.map((e, i) => (
              <div key={i} style={{ display: "flex", gap: 12, alignItems: "flex-start" }}>
                <div style={{ width: 24, height: 24, borderRadius: "50%", background: couleur, color: "#fff", fontSize: 13, fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>{i + 1}</div>
                <p style={{ fontSize: 14, color: "#1C2333", lineHeight: 1.45, marginTop: 2 }}>{e}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div style={{ position: "fixed", bottom: 0, left: 0, right: 0, background: "rgba(247,247,250,0.9)", backdropFilter: "blur(12px)", borderTop: "1px solid rgba(142,155,181,0.14)", padding: "14px 20px max(20px, env(safe-area-inset-bottom, 20px))" }}>
        <div style={{ maxWidth: 480, margin: "0 auto" }}>
          <a href={`/nfc/${nfcId}?ref=${walletId}`} style={{ display: "block", textAlign: "center", padding: "15px 0", borderRadius: 16, background: couleur, color: "#fff", fontSize: 16, fontWeight: 600, textDecoration: "none" }}>
            Rejoindre {nom}
          </a>
          <p style={{ textAlign: "center", fontSize: 12, color: "#8E9BB5", marginTop: 8 }}>Gratuit · sans application à télécharger</p>
        </div>
      </div>
    </main>
  );
}
