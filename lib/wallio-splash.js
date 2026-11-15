/*
 * Wallio Pro — splash screen animé
 * Module ES autonome, sans dépendance. Animations en Web Animations API,
 * uniquement transform + opacity (exécutées par le compositeur, fluides
 * même pendant que l'app démarre). Aucun filter: blur().
 *
 * Utilisation :
 *   import { WallioSplash } from './wallio-splash.js';
 *   const splash = WallioSplash.mount({ iconSrc: '/assets/app-icon.png' });
 *   await splash.ready;                       // 1re image peinte
 *   await SplashScreen.hide({ fadeOutDuration: 0 }); // Capacitor : masque le splash natif
 *   ...vérification de la session...
 *   splash.finish({ to: 'login', target: document.querySelector('#login-logo') });
 *   splash.finish({ to: 'home' });
 *   splash.finish({ to: 'scanner' });
 */

const BG = '#F7F7FA';
const EASE_OUT = 'cubic-bezier(.16,1,.3,1)';
const EASE_SPRING = 'cubic-bezier(.3,1.18,.4,1)';
const EASE_IN_OUT = 'cubic-bezier(.45,0,.55,1)';

const iconSVG = (u = Math.random().toString(36).slice(2, 8)) => `
<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg" width="100%" height="100%" aria-hidden="true">
  <defs>
    <linearGradient id="wsBg-${u}" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#FAF8FF"/><stop offset="1" stop-color="#E2DBFF"/>
    </linearGradient>
    <linearGradient id="wsW-${u}" gradientUnits="userSpaceOnUse" x1="20" y1="22" x2="80" y2="74">
      <stop offset="0" stop-color="#2F7BFF"/><stop offset="1" stop-color="#8B5CF6"/>
    </linearGradient>
    <clipPath id="wsClip-${u}"><rect x="0" y="25" width="100" height="47"/></clipPath>
  </defs>
  <rect width="100" height="100" fill="url(#wsBg-${u})"/>
  <polyline clip-path="url(#wsClip-${u})" points="19,14 35.5,72 50,33 64.5,72 81,14"
    fill="none" stroke="url(#wsW-${u})" stroke-width="12.5" stroke-linejoin="miter" stroke-miterlimit="10"/>
  <text x="50" y="86" text-anchor="middle" font-family="-apple-system,'SF Pro Text','Inter',system-ui,sans-serif"
    font-size="8.4" font-weight="600" letter-spacing="1.2" fill="#7A6AF0">wallio</text>
</svg>`;

const CSS = `
.ws-root{position:fixed;inset:0;z-index:2147483000;pointer-events:auto;contain:strict}
.ws-bg{position:absolute;inset:0;background:${BG}}
.ws-smoke{position:absolute;inset:0;overflow:hidden;pointer-events:none}
.ws-blob{position:absolute;left:0;top:0;border-radius:50%;will-change:transform,opacity}
.ws-drift{width:100%;height:100%;border-radius:50%;will-change:transform,opacity}
.ws-iconwrap{position:absolute;left:50%;top:50%;will-change:transform,opacity}
.ws-breath{width:100%;height:100%;position:relative;will-change:transform}
.ws-shadow{position:absolute;inset:0;border-radius:23%;box-shadow:0 14px 36px rgba(91,92,240,.26),0 2px 6px rgba(60,40,160,.10);opacity:0;will-change:opacity}
.ws-icon{position:absolute;inset:0;border-radius:23%;overflow:hidden;transform:translateZ(0)}
.ws-icon img,.ws-icon svg{display:block;width:100%;height:100%;object-fit:cover}
.ws-glint{position:absolute;top:-30%;left:0;width:55%;height:160%;
  background:linear-gradient(90deg,rgba(255,255,255,0) 0%,rgba(255,255,255,.45) 40%,rgba(255,255,255,.75) 50%,rgba(255,255,255,.45) 60%,rgba(255,255,255,0) 100%);
  transform:translateX(-160%) rotate(18deg);opacity:0;will-change:transform,opacity}
.ws-rim{position:absolute;inset:0;border-radius:23%;box-shadow:inset 0 0 0 .5px rgba(60,40,160,.10),inset 0 1px 0 rgba(255,255,255,.9);pointer-events:none}
`;

function injectCSS() {
  if (document.getElementById('wallio-splash-css')) return;
  const s = document.createElement('style');
  s.id = 'wallio-splash-css';
  s.textContent = CSS;
  document.head.appendChild(s);
}

function el(cls, parent) {
  const d = document.createElement('div');
  d.className = cls;
  if (parent) parent.appendChild(d);
  return d;
}

const raf2 = () => new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r)));

export const WallioSplash = {
  /** Icône vectorielle Wallio par défaut (identifiants SVG uniques à chaque appel). */
  iconSVG,

  /**
   * @param {object}  o
   * @param {string}  [o.iconSrc]      URL de l'icône de l'app (PNG 1024 conseillé). Sans valeur : icône Wallio vectorielle intégrée.
   * @param {number}  [o.iconSize=96]  Taille en pt — identique au splash natif.
   * @param {number}  [o.minDuration=900]  Durée minimale avant la sortie (ms).
   * @param {number}  [o.maxDuration=3000] Sécurité : sortie forcée après ce délai (ms).
   * @param {'login'|'home'|'scanner'} [o.fallback='login'] Sortie utilisée par la sécurité.
   * @param {Function}[o.onTimeout]    Appelé si la sécurité se déclenche.
   * @param {boolean} [o.manual=false] Pour les captures : animations figées, pilotées par seek(ms).
   */
  mount(o = {}) {
    injectCSS();
    const size = o.iconSize ?? 96;
    const minDuration = o.minDuration ?? 900;
    const maxDuration = o.maxDuration ?? 3000;
    const manual = !!o.manual;
    const reduced = !manual && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

    const root = el('ws-root');
    root.setAttribute('aria-hidden', 'true');
    const bg = el('ws-bg', root);
    const smoke = el('ws-smoke', root);

    const W = () => window.innerWidth;
    const H = () => window.innerHeight;
    const iconCX = () => W() / 2;
    const iconCY = () => H() / 2;

    // Nappes : position finale (centre), diamètre, dégradé
    const blobsDef = [
      { key: 'A', d: () => W() * 0.87, cx: () => W() * -0.08, cy: () => -40,
        bgc: 'radial-gradient(circle,rgba(47,123,255,.42) 0%,rgba(47,123,255,.16) 40%,rgba(47,123,255,0) 70%)',
        delay: 80, drift: [[0, 0, 1], [20, 14, 1.06]], driftDur: 22000 },
      { key: 'B', d: () => W() * 0.81, cx: () => W() * 1.08, cy: () => -20,
        bgc: 'radial-gradient(circle,rgba(139,92,246,.38) 0%,rgba(139,92,246,.14) 40%,rgba(139,92,246,0) 70%)',
        delay: 150, drift: [[0, 0, 1], [-18, 18, 1.05]], driftDur: 27000 },
      { key: 'C', d: () => 300, cx: () => iconCX(), cy: () => iconCY(),
        bgc: 'radial-gradient(circle,rgba(185,168,255,.34) 0%,rgba(185,168,255,.12) 40%,rgba(185,168,255,0) 70%)',
        delay: 0, drift: [[0, 0, 1], [-14, -10, 1.04]], driftDur: 18000 },
    ];
    const blobs = {};
    for (const b of blobsDef) {
      const outer = el('ws-blob', smoke);
      const d = b.d();
      Object.assign(outer.style, { width: d + 'px', height: d + 'px',
        transform: `translate(${b.cx() - d / 2}px,${b.cy() - d / 2}px)` });
      const inner = el('ws-drift', outer);
      inner.style.background = b.bgc;
      blobs[b.key] = { outer, inner, def: b, d };
    }

    // Icône
    const wrap = el('ws-iconwrap', root);
    Object.assign(wrap.style, { width: size + 'px', height: size + 'px',
      transform: `translate(-50%,-50%)` });
    const breath = el('ws-breath', wrap);
    const shadow = el('ws-shadow', breath);
    const icon = el('ws-icon', breath);
    if (o.iconSrc) {
      const img = new Image();
      img.src = o.iconSrc; img.alt = ''; img.decoding = 'sync';
      icon.appendChild(img);
    } else {
      icon.innerHTML = iconSVG();
    }
    const glint = el('ws-glint', icon);
    el('ws-rim', breath);

    document.body.appendChild(root);

    // ---- Moteur d'animation (WAAPI) ----
    const anims = []; // {a, t0}
    let clock = 0;    // temps courant en mode manuel
    const t0 = performance.now();
    const now = () => (manual ? clock : performance.now() - t0);
    function play(node, keyframes, opts, startAt = now()) {
      const a = node.animate(keyframes, { fill: 'both', ...opts });
      if (manual) { a.pause(); a.currentTime = clock - startAt; }
      anims.push({ a, t0: startAt });
      return a;
    }

    // ---- Intro ----
    if (reduced) {
      for (const k in blobs) blobs[k].outer.style.opacity = '1';
      shadow.style.opacity = '1';
    } else {
      // La fumée s'échappe de l'icône vers sa place finale
      for (const k in blobs) {
        const { outer, inner, def, d } = blobs[k];
        const fx = def.cx() - d / 2, fy = def.cy() - d / 2;
        const sx = iconCX() - d / 2, sy = iconCY() - d / 2;
        const s0 = k === 'C' ? 0.45 : 0.22;
        play(outer, [
          { transform: `translate(${sx}px,${sy}px) scale(${s0})`, opacity: 0 },
          { transform: `translate(${fx}px,${fy}px) scale(1)`, opacity: 1 },
        ], { duration: k === 'C' ? 750 : 1050, delay: def.delay, easing: EASE_OUT });
        const [p0, p1] = def.drift;
        play(inner, [
          { transform: `translate(${p0[0]}px,${p0[1]}px) scale(${p0[2]})`, opacity: 1 },
          { transform: `translate(${p1[0]}px,${p1[1]}px) scale(${p1[2]})`, opacity: k === 'C' ? 0.8 : 1 },
        ], { duration: def.driftDur, delay: 1100, iterations: Infinity, direction: 'alternate', easing: EASE_IN_OUT });
      }
      // Respiration de l'icône + ombre
      play(breath, [
        { transform: 'scale(1)' }, { transform: 'scale(1.045)', offset: 0.45 }, { transform: 'scale(1)' },
      ], { duration: 1000, delay: 150, easing: EASE_IN_OUT });
      play(shadow, [{ opacity: 0 }, { opacity: 1 }], { duration: 700, delay: 150, easing: EASE_OUT });
      // Reflet « carte Wallet »
      play(glint, [
        { transform: 'translateX(-160%) rotate(18deg)', opacity: 0 },
        { transform: 'translateX(-60%) rotate(18deg)', opacity: 1, offset: 0.25 },
        { transform: 'translateX(140%) rotate(18deg)', opacity: 1, offset: 0.85 },
        { transform: 'translateX(220%) rotate(18deg)', opacity: 0 },
      ], { duration: 750, delay: 380, easing: 'cubic-bezier(.4,0,.2,1)' });
    }

    // ---- API ----
    let finishing = null;
    let resolveDone;
    const done = new Promise(r => (resolveDone = r));
    const ready = raf2();

    function cleanup(target) {
      if (target) target.style.visibility = '';
      root.remove();
      resolveDone();
    }

    function finish({ to = 'home', target = null, onReveal } = {}) {
      if (finishing) return finishing;
      clearTimeout(safety);
      if (manual) { finishing = Promise.resolve(runExit(to, target, onReveal)); return finishing; }
      const wait = Math.max(0, minDuration - now());
      finishing = new Promise(res => setTimeout(res, wait)).then(() => runExit(to, target, onReveal));
      return finishing;
    }

    function runExit(to, target, onReveal) {
      const T = now();
      let total;
      if (to === 'login' && !(target && target.getBoundingClientRect)) to = 'home';

      if (reduced) {
        onReveal?.();
        play(root, [{ opacity: 1 }, { opacity: 0 }], { duration: 300, easing: 'linear' }, T);
        total = 300;
      } else if (to === 'login') {
        const r = target.getBoundingClientRect();
        const dx = r.left + r.width / 2 - iconCX();
        const dy = r.top + r.height / 2 - iconCY();
        const sc = r.width / size;
        target.style.visibility = 'hidden';
        onReveal?.();
        play(wrap, [
          { transform: 'translate(-50%,-50%)' },
          { transform: `translate(calc(-50% + ${dx}px),calc(-50% + ${dy}px)) scale(${sc})` },
        ], { duration: 560, easing: EASE_SPRING }, T);
        play(bg, [{ opacity: 1 }, { opacity: 0 }], { duration: 420, delay: 120, easing: 'linear' }, T);
        moveBlobC(T, r.top + r.height / 2);
        play(smoke, [{ opacity: 1 }, { opacity: 0 }], { duration: 650, delay: 150, easing: 'linear' }, T);
        total = 820;
      } else if (to === 'scanner') {
        onReveal?.();
        play(root, [{ opacity: 1 }, { opacity: 0 }], { duration: 300, easing: 'linear' }, T);
        total = 300;
      } else { // home
        onReveal?.();
        play(wrap, [
          { transform: 'translate(-50%,-50%) scale(1)', opacity: 1 },
          { transform: 'translate(-50%,-50%) scale(.85)', opacity: 0 },
        ], { duration: 260, easing: 'cubic-bezier(.4,0,1,1)' }, T);
        play(bg, [{ opacity: 1 }, { opacity: 0 }], { duration: 420, delay: 100, easing: 'linear' }, T);
        moveBlobC(T, 150);
        play(smoke, [{ opacity: 1 }, { opacity: 0 }], { duration: 650, delay: 150, easing: 'linear' }, T);
        total = 800;
      }

      if (manual) { exitEndsAt = T + total; exitTarget = target; return done; }
      setTimeout(() => cleanup(target), total + 30);
      return done;
    }

    function moveBlobC(T, cy) {
      const { outer, d } = blobs.C;
      const fx = iconCX() - d / 2;
      play(outer, [
        { transform: `translate(${fx}px,${iconCY() - d / 2}px) scale(1)` },
        { transform: `translate(${fx}px,${cy - d / 2}px) scale(1.15)` },
      ], { duration: 600, easing: EASE_OUT }, T);
    }

    let exitEndsAt = Infinity, exitTarget = null;
    const safety = manual ? 0 : setTimeout(() => {
      o.onTimeout?.();
      finish({ to: o.fallback ?? 'login', target: o.fallbackTarget?.() });
    }, maxDuration);

    return {
      ready,
      done,
      finish,
      /** Mode manuel (captures) : place toutes les animations au temps ms. */
      seek(ms) {
        clock = ms;
        for (const { a, t0: s } of anims) { a.pause(); a.currentTime = Math.max(0, ms - s); }
        if (ms >= exitEndsAt && root.isConnected) cleanup(exitTarget);
      },
      element: root,
    };
  },
};

export default WallioSplash;
