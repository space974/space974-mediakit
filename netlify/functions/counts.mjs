// Petit serveur Netlify : va lire tes abonnés TikTok et Snapchat sur tes profils publics.
// Si un réseau bloque, il renvoie null et la page garde le dernier chiffre connu.

const UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0 Safari/537.36";

async function page(url) {
  try {
    // "_r" + no-cache : demande à TikTok/Snap la version à jour, pas une vieille copie
    const sep = url.includes("?") ? "&" : "?";
    const r = await fetch(url + sep + "_r=" + Date.now(), {
      headers: { "User-Agent": UA, "Accept-Language": "fr-FR,fr;q=0.9", "Cache-Control": "no-cache", "Pragma": "no-cache" },
    });
    return r.ok ? await r.text() : "";
  } catch {
    return "";
  }
}
const num = (html, re) => { const m = html.match(re); return m ? Number(m[1]) : null; };

export default async () => {
  const [tt, snap, embed] = await Promise.all([
    page("https://www.tiktok.com/@_space974_"),
    page("https://www.snapchat.com/@space_974"),
    page("https://www.tiktok.com/embed/@_space974_"),
  ]);
  // Dernière vidéo TikTok : les numéros de vidéo grandissent avec le temps, donc le plus grand = la plus récente
  const ids = [...embed.matchAll(/"id":"(7\d{18})"/g)].map((m) => BigInt(m[1]));
  const tiktokLatest = ids.length ? ids.reduce((a, b) => (b > a ? b : a)).toString() : null;
  const v2 = (tt.match(/"statsV2":\{[^}]*\}/) || [""])[0];
  return Response.json(
    {
      tiktok: num(v2, /"followerCount":"(\d+)"/),
      tiktokLikes: num(v2, /"heartCount":"(\d+)"/),
      tiktokVideos: num(v2, /"videoCount":"(\d+)"/),
      snapchat: num(snap, /"subscriberCount":"?(\d+)/),
      tiktokLatest,
      date: new Date().toISOString(),
    },
    {
      headers: {
        // Netlify garde la réponse 2 min en cache : ça économise tes crédits gratuits
        "Cache-Control": "public, max-age=60",
        "Netlify-CDN-Cache-Control": "public, durable, s-maxage=120, stale-while-revalidate=600",
      },
    }
  );
};

export const config = { path: "/api/counts" };
