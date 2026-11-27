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

// Suit la redirection des liens courts (maps.app.goo.gl, goo.gl/maps) pour récupérer l'URL complète.
export async function resolveMapsUrl(url: string): Promise<string> {
  if (!/maps\.app\.goo\.gl|goo\.gl\/maps/i.test(url)) return url;
  try {
    const res = await fetch(url, { redirect: "follow", headers: { "User-Agent": "Mozilla/5.0" } });
    return res.url || url;
  } catch {
    return url;
  }
}

// Extraction complète : essaie l'URL directe, puis résout les liens courts.
export async function extractLatLng(url: string): Promise<LatLng | null> {
  if (!url) return null;
  const direct = parseLatLng(url);
  if (direct) return direct;
  const resolved = await resolveMapsUrl(url);
  if (resolved !== url) return parseLatLng(resolved);
  return null;
}
