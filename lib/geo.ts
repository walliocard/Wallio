// Extraction de coordonnées GPS depuis un lien Google Maps.
// Serveur uniquement (résolution des liens courts via redirection).

export type LatLng = { lat: number; lng: number };

const valid = (lat: number, lng: number) =>
  Number.isFinite(lat) && Number.isFinite(lng) &&
  Math.abs(lat) <= 90 && Math.abs(lng) <= 180 && !(lat === 0 && lng === 0);

// Formats gérés : !3dlat!4dlng · @lat,lng · ?q=lat,lng · ll=lat,lng (+ query/destination/center)
export function parseLatLng(input: string): LatLng | null {
  if (!input) return null;
  let s = input;
  try { s = decodeURIComponent(input); } catch { /* garde l'original */ }

  const patterns: RegExp[] = [
    /^\s*(-?\d+(?:\.\d+)?)\s*,\s*(-?\d+(?:\.\d+)?)\s*$/, // coordonnées collées directement
    /!3d(-?\d+(?:\.\d+)?)!4d(-?\d+(?:\.\d+)?)/,
    /@(-?\d+(?:\.\d+)?),(-?\d+(?:\.\d+)?)/,
    /[?&](?:q|query|ll|destination|center|sll)=(-?\d+(?:\.\d+)?),\s*(-?\d+(?:\.\d+)?)/i,
  ];
  for (const re of patterns) {
    const m = s.match(re);
    if (m) {
      const lat = parseFloat(m[1]), lng = parseFloat(m[2]);
      if (valid(lat, lng)) return { lat, lng };
    }
  }
  return null;
}

// Cherche des coordonnées dans un texte libre (HTML de page Maps) : !3dlat!4dlng, @lat,lng, ...
function parseFromText(text: string): LatLng | null {
  const res: RegExp[] = [
    /!3d(-?\d+\.\d+)!4d(-?\d+\.\d+)/,
    /@(-?\d+\.\d+),(-?\d+\.\d+)/,
    /[?&](?:q|ll|center|destination)=(-?\d+\.\d+),(-?\d+\.\d+)/i,
    /\[null,null,(-?\d+\.\d+),(-?\d+\.\d+)\]/,
  ];
  for (const re of res) {
    const m = text.match(re);
    if (m) {
      const lat = parseFloat(m[1]), lng = parseFloat(m[2]);
      if (Number.isFinite(lat) && Number.isFinite(lng) && Math.abs(lat) <= 90 && Math.abs(lng) <= 180 && !(lat === 0 && lng === 0)) return { lat, lng };
    }
  }
  return null;
}

const isShort = (url: string) => /maps\.app\.goo\.gl|goo\.gl\/maps|g\.co\/kgs/i.test(url);

// Récupère l'adresse (?q= / ?query= / ?destination=) si ce n'est pas déjà des coordonnées.
function extractAddress(url: string): string | null {
  try {
    const u = new URL(url);
    for (const k of ["q", "query", "destination"]) {
      const v = u.searchParams.get(k);
      if (v && !/^-?\d+(\.\d+)?,\s*-?\d+(\.\d+)?$/.test(v.trim())) return v;
    }
  } catch { /* pas une URL */ }
  return null;
}

// Géocode une adresse via OpenStreetMap Nominatim (essaie quelques variantes, pays en indice).
async function geocode(address: string, country?: string): Promise<LatLng | null> {
  const parts = address.split(",").map(s => s.trim()).filter(Boolean);
  const streetIdx = parts.findIndex(s => /\d/.test(s)); // segment avec un numéro de rue
  const street = streetIdx >= 0 ? parts.slice(streetIdx).join(", ") : parts.join(", ");
  const withCountry = (s: string) => (country ? `${s}, ${country}` : s);
  const variants = [...new Set([
    withCountry(street),               // rue + ville + pays (le plus fiable)
    withCountry(parts.slice(1).join(", ")), // sans le nom du commerce
    withCountry(address),
    street,
    address,
  ])];
  for (const v of variants) {
    if (!v) continue;
    try {
      const r = await fetch(`https://nominatim.openstreetmap.org/search?format=json&limit=1&q=${encodeURIComponent(v)}`, {
        headers: { "User-Agent": "WallioAdmin/1.0 (walliocard.com)", "Accept-Language": "fr" },
      });
      const j = await r.json();
      if (Array.isArray(j) && j[0]) {
        const lat = parseFloat(j[0].lat), lng = parseFloat(j[0].lon);
        if (valid(lat, lng)) return { lat, lng };
      }
    } catch { /* variante suivante */ }
  }
  return null;
}

// Suit la redirection des liens courts pour récupérer l'URL complète.
export async function resolveMapsUrl(url: string): Promise<string> {
  if (!isShort(url)) return url;
  try {
    const res = await fetch(url, { redirect: "follow", headers: { "User-Agent": "Mozilla/5.0" } });
    return res.url || url;
  } catch {
    return url;
  }
}

// Extraction complète : URL directe → URL résolue → contenu de la page → géocodage de l'adresse.
export async function extractLatLng(url: string, countryHint?: string): Promise<LatLng | null> {
  if (!url) return null;
  const direct = parseLatLng(url);
  if (direct) return direct;

  let resolvedUrl = url;
  try {
    const res = await fetch(url, { redirect: "follow", headers: { "User-Agent": "Mozilla/5.0", "Accept-Language": "fr" } });
    resolvedUrl = res.url || url;
    const fromUrl = parseLatLng(resolvedUrl);
    if (fromUrl) return fromUrl;
    const body = await res.text();
    const fromBody = parseFromText(body);
    if (fromBody) return fromBody;
  } catch { /* on tente les replis ci-dessous */ }

  // Dernier recours : géocoder l'adresse contenue dans le lien.
  const address = extractAddress(resolvedUrl) || extractAddress(url);
  if (address) {
    const geo = await geocode(address, countryHint);
    if (geo) return geo;
  }
  return null;
}
