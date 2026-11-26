/*!
 * WallioStamp v3 — « moment tampon » côté client, rendu natif iOS (police système sur chaque appareil).
 * Module autonome, zéro dépendance. Seuls transform et opacity sont animés.
 *
 *   import { WallioStamp } from './wallio-stamp.js';
 *   const ws = WallioStamp.mount(el, { merchant: { name, logo, color } });   // chargement immédiat
 *   await ws.play({ state: 'stamp', before: 6, after: 7, goal: 10, reward: 'votre matcha' });
 *
 * Modes : 'cyclic' | 'progressive' (milestones: [{ at, reward }]) | 'flex' (flex: { at, small, big, choice: null|'small'|'big' })
 * États : 'stamp' | 'reward' | 'choice' (Flex : le client choisit, onChoose(choice) → Promise) | 'duplicate' | 'error'
 * Options : merchant { name, logo, color } ; theme { bg, white, text, muted } ; texts ; fontFamily ; onRetry ; manual ; reducedMotion
 * Contraintes : zéro dépendance ; transform/opacity uniquement (pas de filter, pas de box-shadow animé) ;
 *   nettoyage automatique 1 s après la fin ; prefers-reduced-motion = état final direct ; couleurs 100 % en paramètre.
 * Mise en page : le moment tampon est centré dans l'espace libre, ws.slot est ancré en bas de l'écran (zone du pouce).
 * Le contenu de l'app se place dans ws.slot : il apparaît en cascade à la fin.
 */
const ICON = {
  clock: '<circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/>',
  gift: '<path d="M12 7v14"/><path d="M20 11v8a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2v-8"/><path d="M7.5 7a1 1 0 0 1 0-5A4.8 8 0 0 1 12 7a4.8 8 0 0 1 4.5-5 1 1 0 0 1 0 5"/><rect x="3" y="7" width="18" height="4" rx="1"/>',
  star: '<path d="M11.525 2.295a.53.53 0 0 1 .95 0l2.31 4.679a2.123 2.123 0 0 0 1.595 1.16l5.166.756a.53.53 0 0 1 .294.904l-3.736 3.638a2.123 2.123 0 0 0-.611 1.878l.882 5.14a.53.53 0 0 1-.771.56l-4.618-2.428a2.122 2.122 0 0 0-1.973 0L6.396 21.01a.53.53 0 0 1-.77-.56l.881-5.139a2.122 2.122 0 0 0-.611-1.879L2.16 9.795a.53.53 0 0 1 .294-.906l5.165-.755a2.122 2.122 0 0 0 1.597-1.16z"/>',
  check: '<path d="M20 6 9 17l-5-5"/>',
  retry: '<path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/>',
};
const svg = (n, s, c, w = 1.7) => `<svg width="${s}" height="${s}" viewBox="0 0 24 24" fill="none" stroke="${c}" stroke-width="${w}" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${ICON[n]}</svg>`;
export const SYSTEM_FONT = '-apple-system, BlinkMacSystemFont, "SF Pro Text", "SF Pro Display", "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif';

const cl = x => Math.max(0, Math.min(1, x));
const W = (t, a, d) => cl((t - a) / d);
const quint = x => 1 - Math.pow(1 - cl(x), 5);
const sine = x => { x = cl(x); return -(Math.cos(Math.PI * x) - 1) / 2; };
const lerp = (a, b, p) => a + (b - a) * p;
const now = () => (typeof performance !== 'undefined' ? performance.now() : Date.now());
function hexToRgb(h) { h = String(h || '#4B4FD6').replace('#', ''); if (h.length === 3) h = h.split('').map(c => c + c).join(''); const n = parseInt(h, 16); return [(n >> 16) & 255, (n >> 8) & 255, n & 255]; }
const lum = ([r, g, b]) => { const f = v => { v /= 255; return v <= .03928 ? v / 12.92 : Math.pow((v + .055) / 1.055, 2.4); }; return .2126 * f(r) + .7152 * f(g) + .0722 * f(b); };
const mix = (a, b, p) => a.map((v, i) => Math.round(v + (b[i] - v) * p));
const rgba = (c, a) => `rgba(${c[0]},${c[1]},${c[2]},${a})`;
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const cleanReward = s => String(s || '').trim().replace(/\s*!+\s*$/, '');
function hsl([r, g, b]) { r /= 255; g /= 255; b /= 255; const mx = Math.max(r, g, b), mn = Math.min(r, g, b), l = (mx + mn) / 2; let h = 0, s = 0;
  if (mx !== mn) { const d = mx - mn; s = l > .5 ? d / (2 - mx - mn) : d / (mx + mn); h = mx === r ? (g - b) / d + (g < b ? 6 : 0) : mx === g ? (b - r) / d + 2 : (r - g) / d + 4; h /= 6; } return [h, s, l]; }
function fromHsl([h, s, l]) { const f = n => { const k = (n + h * 12) % 12, a = s * Math.min(l, 1 - l); return Math.round(255 * (l - a * Math.max(-1, Math.min(k - 3, 9 - k, 1)))); }; return [f(0), f(8), f(4)]; }
// Pastel lumineux et saturé dérivé d'une couleur (évite le gris des couleurs foncées). Couleur sans teinte → accent de repli.
function pastel(c, light, fallback) { const [h, s] = hsl(c); if (s < .08 && fallback) return pastel(fallback, light); return fromHsl([h, Math.max(.42, Math.min(.7, s)), light]); }
const lc = s => s ? s.charAt(0).toLowerCase() + s.slice(1) : s;
const withDot = s => /[.!?]$/.test(String(s).trim()) ? String(s).trim() : String(s).trim() + '.';
const cap = s => s ? s.charAt(0).toUpperCase() + s.slice(1) : s;

const R = 77, SZ = 172, TILE = 98;
function arc(a0, a1) { const p = a => [SZ / 2 + R * Math.cos(a), SZ / 2 + R * Math.sin(a)]; const [x0, y0] = p(a0), [x1, y1] = p(a1); return `M${x0.toFixed(2)} ${y0.toFixed(2)}A${R} ${R} 0 ${a1 - a0 > Math.PI ? 1 : 0} 1 ${x1.toFixed(2)} ${y1.toFixed(2)}`; }

const CSS = `
.ws{box-sizing:border-box;position:relative;width:100%;min-height:100vh;min-height:100dvh;display:flex;flex-direction:column;-webkit-font-smoothing:antialiased;text-align:center;padding:calc(env(safe-area-inset-top) + 16px) 0 calc(env(safe-area-inset-bottom) + 12px);isolation:isolate}
.ws-main{flex:1;display:flex;flex-direction:column;justify-content:center;padding-bottom:8px}
.ws *{box-sizing:border-box}
.ws-bg{position:fixed;inset:0;z-index:-1;pointer-events:none;overflow:hidden}
.ws-bg .wash{position:absolute;left:-20%;right:-20%;top:-30vh;height:85vh;will-change:transform;animation:ws-w 14s ease-in-out infinite alternate}
.ws-bg .lift{position:absolute;inset:0;opacity:0}
@keyframes ws-w{to{transform:translateY(3vh) scale(1.04)}}
@media (prefers-reduced-motion: reduce){.ws-bg .wash{animation:none}}
.ws.ws-idle .ws-bg .wash{animation-play-state:paused}
.ws-head{position:relative;display:flex;flex-direction:column;align-items:center;will-change:transform}
.ws-ringwrap{position:relative;width:${SZ}px;height:${SZ}px}
.ws-ring{position:absolute;inset:0;overflow:visible}
.ws-ring path{fill:none;stroke-linecap:round}
.ws-sweep{position:absolute;inset:0;border-radius:50%;opacity:0;will-change:transform,opacity;
  -webkit-mask:radial-gradient(closest-side,transparent calc(100% - 9px),#000 calc(100% - 8px),#000 calc(100% - 1px),transparent 100%);
  mask:radial-gradient(closest-side,transparent calc(100% - 9px),#000 calc(100% - 8px),#000 calc(100% - 1px),transparent 100%)}
.ws-tile{position:absolute;left:50%;top:50%;width:${TILE}px;height:${TILE}px;margin:-${TILE / 2}px 0 0 -${TILE / 2}px;perspective:900px}
.ws-flip{position:absolute;inset:0;transform-style:preserve-3d;will-change:transform}
.ws-face{position:absolute;inset:0;border-radius:23%;overflow:hidden;-webkit-backface-visibility:hidden;backface-visibility:hidden;display:flex;align-items:center;justify-content:center}
.ws-face img{width:100%;height:100%;object-fit:cover;display:block}
.ws-back{transform:rotateY(180deg)}
.ws-back::before{content:"";position:absolute;inset:4px;border-radius:20%;border:.5px solid currentColor;opacity:.35}
.ws-plus{font-weight:300;font-size:42px;letter-spacing:-1px;line-height:1}
.ws-shine{position:absolute;top:-20%;bottom:-20%;left:0;width:45%;pointer-events:none;opacity:0;will-change:transform,opacity}
.ws-name{font-weight:600;font-size:15px;letter-spacing:-.1px;margin-top:4px}
.ws-wait{font-size:14px;margin-top:6px;opacity:0;height:0}
.ws-title{font-weight:700;font-size:26px;line-height:1.15;letter-spacing:-.7px;margin-top:18px;opacity:0;padding:0 26px}
.ws-sub{font-size:15px;line-height:1.45;letter-spacing:-.1px;margin-top:8px;opacity:0;padding:0 32px}
.ws-prog{margin:22px 16px 0;padding:18px 18px 16px;border-radius:24px;text-align:left;opacity:0;box-shadow:0 6px 20px rgba(30,30,70,.06)}
.ws-ph{display:flex;align-items:baseline;justify-content:space-between;gap:10px}
.ws-big{display:flex;align-items:baseline;gap:4px;font-weight:700;letter-spacing:-1.5px}
.ws-big .ws-roll{font-size:46px;height:1.08em;line-height:1.08em}
.ws-big .ws-roll span{line-height:1.08em}
.ws-of{font-size:22px;font-weight:600;letter-spacing:-.5px}
.ws-left{font-size:14px;font-weight:600;padding:6px 10px;border-radius:10px;white-space:nowrap}
.ws-bar{display:flex;gap:4px;margin-top:14px;height:10px}
.ws-bar i{flex:1;border-radius:5px;position:relative;overflow:hidden}
.ws-bar i b{position:absolute;inset:0;border-radius:5px;opacity:0;transform-origin:left center}
.ws-note{font-size:14.5px;line-height:1.4;margin-top:12px}
.ws-ms{margin-top:14px;display:flex;flex-direction:column;gap:2px}
.ws-msr{display:flex;align-items:center;gap:12px;padding:7px 0;font-size:15px}
.ws-msi{width:24px;height:24px;border-radius:50%;display:flex;align-items:center;justify-content:center;flex:none}
.ws-msn{font-weight:700;width:20px;font-variant-numeric:tabular-nums}
.ws-msr span.r{flex:1;min-width:0;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.ws-msr em{font-style:normal;font-size:13px;font-weight:600;white-space:nowrap}
.ws-choice{margin:12px 16px 0;opacity:0;transition:opacity .3s cubic-bezier(.22,1,.36,1)}
.ws-opts{display:flex;gap:10px}
.ws-opt{flex:1;border:0;border-radius:22px;padding:16px 14px 14px;text-align:left;font:inherit;cursor:pointer;display:flex;flex-direction:column;gap:4px;box-shadow:0 6px 20px rgba(30,30,70,.06);transition:opacity .3s cubic-bezier(.22,1,.36,1),transform .3s cubic-bezier(.22,1,.36,1)}
.ws-opt small{font-size:12px;font-weight:600;letter-spacing:1px;text-transform:uppercase}
.ws-opt b{font-size:19px;font-weight:700;letter-spacing:-.4px;line-height:1.2}
.ws-obtn{margin-top:10px;display:flex;align-items:center;justify-content:center;height:40px;border-radius:12px;font-weight:600;font-size:15px}
.ws-opt:disabled{cursor:default}
.ws-final{text-align:center;font-size:13px;margin-top:10px}
.ws-swap{transition:opacity .25s cubic-bezier(.22,1,.36,1)}
.ws-roll{position:relative;display:inline-block;overflow:hidden;vertical-align:bottom;font-variant-numeric:tabular-nums}
.ws-roll span{display:block}
.ws-retry{display:inline-flex;align-items:center;gap:8px;margin-top:22px;padding:13px 22px;border-radius:13px;border:0;font:inherit;font-weight:600;font-size:16px;cursor:pointer;opacity:0}
.ws-slot{position:relative;margin-top:20px}
.ws-slot>*{will-change:transform,opacity}
`;
let cssDone = false;
function injectCSS() { if (cssDone || typeof document === 'undefined') return; const s = document.createElement('style'); s.setAttribute('data-wallio-stamp', ''); s.textContent = CSS; document.head.appendChild(s); cssDone = true; }

class Stamp {
  constructor(el, opts = {}) {
    injectCSS();
    this.el = el; this.opts = opts;
    this.reduced = opts.reducedMotion ?? (typeof matchMedia !== 'undefined' && matchMedia('(prefers-reduced-motion: reduce)').matches);
    this.theme = Object.assign({ bg: '#F5F6FA', white: '#FFFFFF', text: '#141826', muted: '#8A93A6' }, opts.theme || {});
    this.texts = Object.assign({
      stamped: 'Tampon ajouté',
      progress: (left, reward) => left <= 0 ? '' : left === 1 ? `Plus qu’une visite avant ${lc(cleanReward(reward))}.` : `Plus que ${left} visites avant ${lc(cleanReward(reward))}.`,
      rewardTitle: (reward, milestone) => milestone ? `Palier ${milestone.at} atteint` : 'Récompense débloquée',
      rewardSub: reward => `${withDot(cap(reward))} Montrez cet écran au comptoir.`,
      milestoneDone: 'Validé', milestoneNow: 'Débloqué', milestoneLeft: n => n === 1 ? '1 restant' : `${n} restants`,
      flexPending: (left, small, big) => `${left === 1 ? 'À votre prochaine visite' : `Dans ${left} visites`}, choisissez : ${small} tout de suite, ou ${big} plus tard.`,
      choiceTitle: 'À vous de choisir', choiceSub: n => `Vous avez ${n} tampons.`,
      choiceNow: 'Maintenant', choiceLater: n => `À ${n} tampons`, take: 'Prendre', keep: 'Continuer', final: 'Ce choix est définitif.',
      tookTitle: 'C’est validé', tookSub: small => `${withDot(cap(small))} Montrez cet écran au comptoir.`,
      keptTitle: 'C’est noté', keptSub: (big, goal) => `Cap sur ${big}, à ${goal} tampons.`,
      duplicateTitle: 'Déjà tamponné',
      duplicateSub: delay => `Votre tampon du jour est déjà sur votre carte. Revenez ${delay || 'plus tard'} pour le suivant.`,
      errorTitle: 'Le tampon n’a pas pu être ajouté', errorSub: 'Vérifiez votre connexion et réessayez.',
      retry: 'Réessayer', wait: 'Un instant…', of: goal => `/ ${goal}`, unit: 'tampons', left: n => n <= 0 ? 'Complet' : n === 1 ? 'Encore 1' : `Encore ${n}`,
      stampedSub: '', 
    }, opts.texts || {});
    this._build(opts.merchant || {});
    this.mode = 'loading'; this.t0 = now(); if (!opts.manual) this._loop();
  }

  _build(m) {
    const T = this.theme, c = hexToRgb(m.color), wh = hexToRgb(T.white), L = lum(c);
    this.c = c; this.ink = L > .45 ? T.text : T.white;
    this.ringC = L > .45 ? mix(c, [0, 0, 0], .3) : c;          // assez contrasté sur fond clair
    this.el.classList.add('ws'); this.el.style.color = T.text; this.el.style.fontFamily = this.opts.fontFamily || 'inherit';   // police de l'app (comme le reste de Wallio)
    this.el.innerHTML = `
      <div class="ws-bg" aria-hidden="true" style="background:${T.bg}">${this._bgLayers(c, wh, L)}
        <div class="lift" style="background:radial-gradient(50% 40% at 50% 22%,${rgba(wh, .85)},${rgba(wh, 0)} 100%)"></div></div>
      <div class="ws-main"><div class="ws-head">
        <div class="ws-ringwrap"><svg class="ws-ring" viewBox="0 0 ${SZ} ${SZ}" width="${SZ}" height="${SZ}"></svg>
          <div class="ws-sweep" style="background:conic-gradient(from 0deg,${rgba(wh, 0)} 0deg,${rgba(wh, .9)} 40deg,${rgba(wh, 0)} 80deg,${rgba(wh, 0)} 360deg)"></div>
          <div class="ws-tile"><div class="ws-flip">
            <div class="ws-face ws-front" style="background:${rgba(c, 1)};box-shadow:0 8px 20px ${rgba(c, .22)},0 0 0 .5px rgba(0,0,0,.06)">${m.logo ? `<img src="${esc(m.logo)}" alt="">` : ''}</div>
            <div class="ws-face ws-back" style="background:${rgba(c, 1)};color:${this.ink};box-shadow:0 8px 20px ${rgba(c, .22)}"><span class="ws-ico"></span>
              <i class="ws-shine" style="background:linear-gradient(105deg,${rgba(wh, 0)} 0%,${rgba(wh, .36)} 50%,${rgba(wh, 0)} 100%)"></i></div>
          </div></div>
        </div>
        <div class="ws-name">${esc(m.name)}</div><div class="ws-wait">${esc(this.texts.wait)}</div>
      </div>
      <div class="ws-title" role="status" aria-live="polite"></div><div class="ws-sub"></div>
      <div class="ws-prog"></div><div class="ws-choice"></div><div class="ws-errbox"></div></div>
      <div class="ws-slot"></div>`;
    const q = s => this.el.querySelector(s);
    [q('.ws-wait'), q('.ws-sub')].forEach(e => e.style.color = T.muted);
    Object.assign(this, { head: q('.ws-head'), ringSvg: q('.ws-ring'), sweep: q('.ws-sweep'), flip: q('.ws-flip'), back: q('.ws-back'), ico: q('.ws-ico'), shine: q('.ws-shine'),
      front: q('.ws-front'), wait: q('.ws-wait'), title: q('.ws-title'), sub: q('.ws-sub'), prog: q('.ws-prog'), choice: q('.ws-choice'), errbox: q('.ws-errbox'), slot: q('.ws-slot'), lift: q('.lift') });
    this.ringSvg.style.opacity = 0;
  }

  // Fond : 'glow' (halo diffus derrière la tuile, par défaut), 'flat' (gris uni), 'mist', 'fume', 'tint', 'aura'
  _bgLayers(c, wh, L) {
    const style = this.opts.bgStyle || 'glow', bg = hexToRgb(this.theme.bg);
    const fb = hexToRgb(this.opts.neutralAccent || '#8B5CF6');   // pour les commerces noirs/gris (option)
    const p1 = pastel(c, .86, fb), p2 = pastel(c, .93, fb), p3 = (() => { const [h] = hsl(hsl(c)[1] < .08 && fb ? fb : c); return fromHsl([(h + .08) % 1, .5, .9]); })();
    if (style === 'flat') return '';
    if (style === 'mist') { const m1 = pastel(c, .955, fb), m2 = pastel(c, .975, fb);   // brume : haut à peine teinté
      return `<div class="wash" style="top:0;height:60vh;animation:none;background:linear-gradient(180deg,${rgba(m1, 1)} 0%,${rgba(m2, 1)} 45%,${rgba(bg, 1)} 100%)"></div>`; }
    if (style === 'glow') { const g1 = pastel(c, .90, fb);                                 // halo fixe et diffus derrière la tuile
      return `<div class="wash" style="top:-6vh;height:70vh;animation:ws-w 12s ease-in-out infinite alternate;background:radial-gradient(42% 32% at 50% 30%,${rgba(g1, .75)} 0%,${rgba(g1, 0)} 100%)"></div>`; }
    if (style === 'fume') {                                                                 // fumé Wallio, comme Wallio Pro
      return `<div class="wash" style="top:-20vh;height:75vh;background:radial-gradient(38% 34% at 12% 30%,rgba(47,123,255,.10),rgba(47,123,255,0) 100%),radial-gradient(38% 34% at 90% 22%,rgba(139,92,246,.10),rgba(139,92,246,0) 100%)"></div>`; }
    if (style === 'tint') return `<div class="wash" style="top:-10vh;height:75vh;background:linear-gradient(180deg,${rgba(p1, 1)} 0%,${rgba(p2, 1)} 38%,${rgba(bg, 1)} 100%)"></div>`;
    return `<div class="wash" style="top:-25vh;height:95vh;background:radial-gradient(45% 40% at 22% 32%,${rgba(p1, 1)},${rgba(p1, 0)} 100%),radial-gradient(50% 42% at 82% 26%,${rgba(p3, 1)},${rgba(p3, 0)} 100%),radial-gradient(60% 45% at 50% 58%,${rgba(p2, 1)},${rgba(p2, 0)} 100%)"></div>`;
  }

  play(p = {}) {
    this.p = Object.assign({ mode: 'cyclic', state: 'stamp', before: 0, after: 1, goal: 10, reward: '', delay: '', milestones: [], flex: null }, p);
    this.p.reward = cleanReward(this.p.reward);
    this._prepare(this.p.state);
    this.mode = 'play'; this.t0 = now();
    const s = this.p.state; this.dur = s === 'reward' ? 2.8 : s === 'stamp' || s === 'choice' ? 2.3 : 1.7;
    if ((s === 'stamp' || s === 'reward' || s === 'choice') && typeof navigator !== 'undefined' && navigator.vibrate && !this.reduced && !this.opts.manual) setTimeout(() => navigator.vibrate(12), 1350);
    if (this.reduced) { this.seek(this.dur); this.mode = 'done'; this._cleanup(); return Promise.resolve(); }
    if (this.opts.manual) return Promise.resolve();
    return new Promise(res => { this._done = res; });
  }

  _prepare(s) {
    const P = this.p, { before, after, goal, reward, delay, mode } = P, T = this.texts, th = this.theme;
    const cur = s === 'duplicate' ? before : after;
    const ms = (P.milestones || []).slice().sort((x, y) => x.at - y.at), fx = P.flex;
    const hit = mode === 'progressive' ? ms.find(m => m.at === cur) : null;
    const next = mode === 'progressive' ? ms.find(m => m.at > cur) : null;
    let title = T.stamped, sub = T.stampedSub || '';
    if (s === 'reward') { const rw = hit ? hit.reward : (mode === 'flex' && fx ? fx.big : P.rawReward || reward); title = T.rewardTitle(rw, hit); sub = T.rewardSub(rw); }
    if (s === 'choice') { title = T.choiceTitle; sub = T.choiceSub(cur); }
    if (s === 'duplicate') { title = T.duplicateTitle; sub = T.duplicateSub(delay); }
    if (s === 'error') { title = T.errorTitle; sub = T.errorSub; }
    this.title.textContent = title; this.sub.textContent = sub; this.sub.style.display = sub ? '' : 'none';
    if (s === 'stamp') this.ico.innerHTML = `<span class="ws-plus">+1</span>`;
    if (s === 'reward') this.ico.innerHTML = svg('gift', 42, this.ink, 1.5);
    if (s === 'choice') this.ico.innerHTML = svg('star', 40, this.ink, 1.5);
    if (s === 'duplicate') { this.back.style.background = th.white; this.back.style.color = th.muted; this.back.style.boxShadow = '0 8px 20px rgba(0,0,0,.08),0 0 0 .5px rgba(0,0,0,.06)'; this.ico.innerHTML = svg('clock', 40, th.muted, 1.5); }
    // ce qu'il reste, selon le mode
    let left = goal - cur, note = T.progress(left, reward);
    if (mode === 'progressive') { left = next ? next.at - cur : 0; note = next ? T.progress(left, next.reward) : ''; }
    if (mode === 'flex' && fx && !fx.choice && cur < fx.at) { left = fx.at - cur; note = T.flexPending(left, fx.small, fx.big); }
    if (mode === 'flex' && fx && fx.choice === 'big') note = T.progress(goal - cur, fx.big);
    if (s === 'reward' || s === 'choice' || s === 'duplicate') note = s === 'reward' && mode === 'progressive' && next ? T.progress(left, next.reward) : '';
    this._ctx = { cur, ms, hit, next, left, note, fx };
    this.rollAnim = s === 'stamp' || s === 'reward' || s === 'choice';
    this.flips = s !== 'error';
    // anneau segmenté (jusqu'à 30 tampons ; au-delà, anneau continu proportionnel)
    const n = Math.max(1, goal), seg = n <= 30, gap = seg ? (n <= 12 ? .11 : .06) : 0;
    const rc = this.ringC, empty = rgba(rc, .18), full = rgba(rc, 1);
    let html = '';
    if (s !== 'error') {
      if (seg) for (let i = 0; i < n; i++) { const a0 = -Math.PI / 2 + i * 2 * Math.PI / n + gap / 2, a1 = a0 + 2 * Math.PI / n - gap, d = arc(a0, a1);
        html += `<g data-i="${i}"><path d="${d}" stroke="${empty}" stroke-width="4"/><path class="f" d="${d}" stroke="${full}" stroke-width="4" opacity="0"/><path class="g" d="${d}" stroke="${rgba(hexToRgb(th.white), 1)}" stroke-width="4" opacity="0"/></g>`; }
      else { const a = cur / n; html = `<g data-i="0"><path d="${arc(-Math.PI / 2, -Math.PI / 2 + 2 * Math.PI * .9999)}" stroke="${empty}" stroke-width="4"/>${a > 0 ? `<path class="f" d="${arc(-Math.PI / 2, -Math.PI / 2 + 2 * Math.PI * Math.min(a, .9999))}" stroke="${full}" stroke-width="4" opacity="0"/>` : ''}</g>`; }
    }
    this.ringSvg.innerHTML = html; this.segs = [...this.ringSvg.querySelectorAll('g')]; this.segMode = seg;
    this.sweep.style.display = s === 'reward' ? '' : 'none';
    if (s === 'choice') this.slot.style.display = 'none';
    this.prog.style.display = s === 'error' ? 'none' : '';
    this.prog.style.background = th.white;
    this.rollAnim = s === 'stamp' || s === 'reward' || s === 'choice';
    const barN = Math.min(goal, 20), fillAt = k => Math.round((k / goal) * barN);
    this.prog.innerHTML = `<div class="ws-ph"><div class="ws-big" style="color:${th.text}"><span class="ws-roll">${this.rollAnim ? `<span>${before}</span>` : ''}<span>${cur}</span></span><span class="ws-of" style="color:${th.muted}">${esc(T.of(goal))}</span></div>
      <span class="ws-left" style="background:${rgba(mix(this.ringC, hexToRgb(th.white), .88), 1)};color:${rgba(this.ringC, 1)}">${esc(T.left(left))}</span></div>
      <div class="ws-bar">${Array.from({ length: barN }, () => `<i style="background:${rgba(mix(this.ringC, hexToRgb(th.white), .86), 1)}"><b style="background:${rgba(this.ringC, 1)}"></b></i>`).join('')}</div>
      ${this._ctx.ms.length && mode === 'progressive' ? this._milestones(cur, s) : ''}
      ${note ? `<div class="ws-note" style="color:${th.muted}">${esc(note)}</div>` : ''}`;
    this._buildChoice(s);
    this.roll = this.prog.querySelector('.ws-roll'); this.bars = [...this.prog.querySelectorAll('.ws-bar b')];
    this.barBefore = fillAt(before); this.barAfter = fillAt(cur);
    this.errbox.innerHTML = s === 'error' ? `<button class="ws-retry" type="button" style="background:${th.text};color:${th.white}">${svg('retry', 18, th.white, 2)}${esc(T.retry)}</button>` : '';
    const btn = this.errbox.querySelector('button'); if (btn) btn.onclick = () => this.opts.onRetry && this.opts.onRetry();
    this.slotKids = [...this.slot.children];
    this.head.style.transform = 'none';
    const vh = typeof innerHeight !== 'undefined' ? innerHeight : 800, r = this.head.getBoundingClientRect();
    this.dy = vh * .42 - (r.top + SZ / 2);
  }

  _milestones(cur, s) {
    const th = this.theme, rc = this.ringC, wh = hexToRgb(th.white), T = this.texts;
    return `<div class="ws-ms">${this._ctx.ms.map(m => {
      const done = cur >= m.at, now = s === 'reward' && m.at === cur, left = m.at - cur;
      const icon = done ? `<div class="ws-msi" style="background:${rgba(rc, now ? 1 : .12)}">${svg('check', 14, now ? th.white : rgba(rc, 1), 2.6)}</div>`
                        : `<div class="ws-msi" style="box-shadow:inset 0 0 0 1.5px ${rgba(rc, .25)}"></div>`;
      const st = now ? T.milestoneNow : done ? T.milestoneDone : T.milestoneLeft(left);
      return `<div class="ws-msr">${icon}<span class="ws-msn" style="color:${rgba(rc, 1)}">${m.at}</span><span class="r" style="${done && !now ? `color:${th.muted}` : ''}">${esc(cleanReward(m.reward))}</span><em style="color:${now ? rgba(rc, 1) : th.muted}">${esc(st)}</em></div>`;
    }).join('')}</div>`;
  }

  _buildChoice(s) {
    const c = this.choice, fx = this._ctx.fx, th = this.theme, T = this.texts, rc = this.ringC, wh = hexToRgb(th.white);
    if (s !== 'choice' || !fx) { c.innerHTML = ''; c.style.display = 'none'; return; }
    c.style.display = '';
    const soft = rgba(mix(rc, wh, .88), 1);
    c.innerHTML = `<div class="ws-opts">
      <button class="ws-opt" type="button" data-c="small" style="background:${th.white};color:${th.text}"><small style="color:${th.muted}">${esc(T.choiceNow)}</small><b>${esc(fx.small)}</b><span class="ws-obtn" style="background:${rgba(rc, 1)};color:${this.ink === th.text && lum(rc) > .45 ? th.text : th.white}">${esc(T.take)}</span></button>
      <button class="ws-opt" type="button" data-c="big" style="background:${th.white};color:${th.text}"><small style="color:${th.muted}">${esc(T.choiceLater(this.p.goal))}</small><b>${esc(fx.big)}</b><span class="ws-obtn" style="background:${soft};color:${rgba(rc, 1)}">${esc(T.keep)}</span></button>
    </div><div class="ws-final" style="color:${th.muted}">${esc(T.final)}</div>`;
    c.querySelectorAll('.ws-opt').forEach(b => b.onclick = () => this._choose(b.dataset.c));
  }

  async _choose(choice) {
    const c = this.choice, T = this.texts, fx = this._ctx.fx, th = this.theme;
    const btns = [...c.querySelectorAll('.ws-opt')]; btns.forEach(b => b.disabled = true);
    btns.forEach(b => { if (b.dataset.c !== choice) { b.style.opacity = .35; b.style.transform = 'scale(.97)'; } });
    let ok = true;
    try { if (this.opts.onChoose) ok = (await this.opts.onChoose(choice)) !== false; } catch (e) { ok = false; }
    if (!ok) { btns.forEach(b => { b.disabled = false; b.style.opacity = 1; b.style.transform = ''; }); return; }
    // confirmation : textes et tuile changent en fondu, le choix laisse place à la suite
    const swap = (el, fn) => { el.classList.add('ws-swap'); el.style.opacity = 0; setTimeout(() => { fn(); el.style.opacity = 1; }, 260); };
    swap(this.title, () => this.title.textContent = choice === 'small' ? T.tookTitle : T.keptTitle);
    swap(this.sub, () => { this.sub.textContent = choice === 'small' ? T.tookSub(fx.small) : T.keptSub(fx.big, this.p.goal); this.sub.style.display = ''; });
    swap(this.ico, () => this.ico.innerHTML = choice === 'small' ? svg('gift', 42, this.ink, 1.5) : svg('check', 40, this.ink, 1.6));
    c.style.opacity = 0;
    setTimeout(() => { c.style.display = 'none';
      this.slot.style.display = ''; [...this.slot.children].forEach((k, i) => { k.style.transition = `opacity .5s cubic-bezier(.22,1,.36,1) ${i * .08}s,transform .5s cubic-bezier(.22,1,.36,1) ${i * .08}s`; k.style.opacity = 0; k.style.transform = 'translateY(14px)'; requestAnimationFrame(() => requestAnimationFrame(() => { k.style.opacity = 1; k.style.transform = 'none'; })); });
    }, 300);
  }

  seekLoading(t) { this._loading(Math.max(0, t)); }
  seek(t) { this._render(Math.max(0, t)); }

  _loop() {
    const tick = () => {
      if (this.destroyed) return;
      const t = (now() - this.t0) / 1000;
      if (this.mode === 'loading') this._loading(t);
      else if (this.mode === 'play') { this._render(t); if (t >= this.dur) { this.mode = 'done'; this._render(this.dur); this._done && this._done(); this._scheduleCleanup(); } }
      if (this.mode !== 'done') this.raf = requestAnimationFrame(tick);
    };
    this.raf = requestAnimationFrame(tick);
  }

  _loading(t) {
    if (this.dy === undefined) { const r = this.head.getBoundingClientRect(); this.dy = innerHeight * .42 - (r.top + SZ / 2); }
    const br = this.reduced ? 0 : .5 - .5 * Math.cos(t / 2.4 * 2 * Math.PI);
    this.head.style.transform = `translateY(${this.dy}px)`;
    this.flip.style.transform = `scale(${1.1 + .03 * br})`;
    this.wait.style.opacity = this.reduced ? (t > 2 ? 1 : 0) : quint(W(t, 2, .6));
    this.slot.style.opacity = 0;
  }

  _render(t) {
    const s = this.p.state, { before, after } = this.p;
    const up = quint(W(t, 0, .7));
    this.head.style.transform = `translateY(${this.dy * (1 - up)}px)`;
    this.wait.style.opacity = 0; this.slot.style.opacity = 1;
    // anneau : apparaît en tournant (segments un par un, sens horaire)
    this.ringSvg.style.opacity = s === 'error' ? 0 : 1;
    const base = s === 'duplicate' ? before : before, nS = this.segs.length;
    this.segs.forEach((g, i) => {
      const a = quint(W(t, .3 + i * (.45 / nS), .3));
      g.style.opacity = a;
      const f = g.querySelector('.f'), gl = g.querySelector('.g');
      if (!this.segMode) { if (f) f.setAttribute('opacity', a); return; }
      let fo = i < base ? 1 : 0;
      if ((s === 'stamp' || s === 'reward' || s === 'choice') && i >= before && i < after) { fo = sine(W(t, 1.3, .45)); const q = W(t, 1.3, .7); gl.setAttribute('opacity', q > 0 && q < 1 ? .75 * Math.sin(Math.PI * q) * (1 - q) : 0); }
      f.setAttribute('opacity', fo);
    });
    // retournement de la tuile
    let fl = 0, z = 1;
    if (this.flips) { const f = W(t, .7, .6); fl = sine(f); z = 1 + .06 * Math.sin(Math.PI * f); }
    this.flip.style.transform = `scale(${lerp(1.1, 1, up) * z}) rotateY(${fl * 180}deg)`;
    // reflet unique
    const sh = W(t, 1.35, .7);
    this.shine.style.opacity = sh > 0 && sh < 1 ? Math.sin(Math.PI * sh) : 0;
    this.shine.style.transform = `translateX(${lerp(-110, 260, sine(sh))}%) skewX(-12deg)`;
    // récompense : un éclat fait le tour de l'anneau, une fois
    if (s === 'reward') { const q = W(t, 1.55, 1.0); this.sweep.style.opacity = q > 0 && q < 1 ? Math.sin(Math.PI * q) : 0; this.sweep.style.transform = `rotate(${sine(q) * 360}deg)`; }
    // le fond s'éclaire une fois
    const lf = W(t, 1.2, 1.3); if (this.lift) this.lift.style.opacity = s === 'error' || (this.opts.bgStyle || 'glow') !== 'tint' && (this.opts.bgStyle || 'glow') !== 'aura' ? 0 : Math.sin(Math.PI * lf) * (s === 'reward' ? .9 : .55);
    // textes
    const ta = this.flips ? 1.15 : .45;
    const ti = quint(W(t, ta, .6)); this.title.style.opacity = ti; this.title.style.transform = `translateY(${(1 - ti) * 8}px)`;
    const si = quint(W(t, ta + .12, .6)); this.sub.style.opacity = si; this.sub.style.transform = `translateY(${(1 - si) * 8}px)`;
    const pi = quint(W(t, ta + .15, .55)); this.prog.style.opacity = pi;
    if (s === 'choice') { const q = quint(W(t, ta + .35, .6)); this.choice.style.transition = 'none'; this.choice.style.opacity = q; this.choice.style.transform = `translateY(${(1 - q) * 14}px)`; } this.prog.style.transform = `translateY(${(1 - pi) * 12}px)`;
    this.bars.forEach((b, i) => {
      let o = i < this.barBefore ? 1 : 0, sx = 1;
      if (this.rollAnim && i >= this.barBefore && i < this.barAfter) { const q = W(t, 1.4 + (i - this.barBefore) * .06, .5); o = q > 0 ? 1 : 0; sx = quint(q); }
      if (s === 'duplicate' && i < this.barAfter) o = 1;
      b.style.opacity = o; b.style.transform = `scaleX(${sx})`;
    });
    if (this.rollAnim) { const r = sine(W(t, 1.35, .45)); [...this.roll.children].forEach(e => e.style.transform = `translateY(${-r * 100}%)`); }
    const btn = this.errbox.firstChild; if (btn) { const b = quint(W(t, .6, .5)); btn.style.opacity = b; btn.style.transform = `translateY(${(1 - b) * 8}px)`; }
    const st = s === 'reward' ? 2.0 : s === 'stamp' || s === 'choice' ? 1.65 : .95;
    this.slotKids.forEach((k, i) => { const q = quint(W(t, st + i * .09, .6)); k.style.opacity = q; k.style.transform = `translateY(${(1 - q) * 14}px)`; });
  }

  _scheduleCleanup() { clearTimeout(this._ct); this._ct = setTimeout(() => this._cleanup(), 1000); }
  /** Retire les éléments décoratifs (reflet, éclat, voile, traits lumineux), libère will-change, met le fond en pause. */
  _cleanup() {
    [this.shine, this.lift, this.sweep].forEach(e => e && e.remove()); this.shine = this.lift = this.sweep = null;
    this.ringSvg.querySelectorAll('.g').forEach(e => e.remove());
    if (this.flips) this.front.remove();
    this.el.querySelectorAll('.ws-head,.ws-flip,.ws-slot>*').forEach(e => e.style.willChange = 'auto');
    this.el.classList.add('ws-idle');
    this._render = () => {};
    if (this.choice) this.choice.style.transition = '';
  }
  destroy() { this.destroyed = true; cancelAnimationFrame(this.raf); clearTimeout(this._ct); this.el.innerHTML = ''; this.el.classList.remove('ws', 'ws-idle'); }
}

export const WallioStamp = { mount: (el, opts) => new Stamp(el, opts) };
if (typeof window !== 'undefined') window.WallioStamp = WallioStamp;
export default WallioStamp;
