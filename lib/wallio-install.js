/*!
 * WallioInstall v3 — bloc « Ajouter Wallio à l'écran d'accueil » (app client, PWA).
 * Rendu natif selon l'appareil : carte style App Clip sur iPhone, bannière Material sur Android.
 * Zéro dépendance. Seuls transform et opacity sont animés.
 *
 *   import { WallioInstall } from './wallio-install.js';
 *   WallioInstall.mount(container, { icon: '/icons/wallio.png', onEvent: (name, device) => track(name) });
 *
 *  - déjà installée (display-mode: standalone)  → rien n'est affiché
 *  - Android / Chrome (beforeinstallprompt)      → « Installer » ouvre la fenêtre d'installation native
 *  - iPhone / Safari                             → « Obtenir » ouvre une feuille iOS avec les 3 étapes
 *  - navigateur intégré (Instagram, Facebook…)   → invite à ouvrir la page dans Safari / Chrome (copie du lien)
 * Événements onEvent : 'shown', 'click', 'installed', 'dismissed', 'sheet_open', 'link_copied'.
 * Options : icon, texts, theme, fontFamily, force ('ios' | 'android' | 'inapp'), ios26 (true/false), onEvent.
 */
const I = {
  share: '<path d="M12 2v13"/><path d="m16 6-4-4-4 4"/><path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8"/>',
  plus: '<rect width="18" height="18" x="3" y="3" rx="2"/><path d="M8 12h8"/><path d="M12 8v8"/>',
  dots: '<circle cx="12" cy="12" r="1"/><circle cx="19" cy="12" r="1"/><circle cx="5" cy="12" r="1"/>',
  x: '<path d="M18 6 6 18"/><path d="m6 6 12 12"/>',
  copy: '<rect width="14" height="14" x="8" y="8" rx="2" ry="2"/><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"/>',
  check: '<path d="M20 6 9 17l-5-5"/>',
  menu: '<path d="M4 6h16"/><path d="M4 12h16"/><path d="M4 18h12"/>',
};
const ic = (n, s, c, w = 2) => `<svg width="${s}" height="${s}" viewBox="0 0 24 24" fill="none" stroke="${c}" stroke-width="${w}" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${I[n]}</svg>`;
const SYSTEM_FONT = '-apple-system, BlinkMacSystemFont, "SF Pro Text", "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif';
const EASE = 'cubic-bezier(.32,.72,0,1)';   // courbe des feuilles iOS
const CSS = `
.wi{margin:0 16px;text-align:left;-webkit-font-smoothing:antialiased}
.wi-clip{position:relative;border-radius:24px;padding:16px;display:flex;align-items:center;gap:14px;box-shadow:0 6px 20px rgba(30,30,70,.06)}
.wi-clip img{width:52px;height:52px;border-radius:12px;display:block;flex:none}
.wi-name{font-weight:600;font-size:16px;letter-spacing:-.2px}
.wi-desc{font-size:13px;letter-spacing:-.1px;line-height:1.3;margin-top:2px}
.wi-get{margin-left:auto;flex:none;border:0;border-radius:11px;padding:9px 16px;font:inherit;font-weight:600;font-size:14.5px;cursor:pointer}
.wi-close{position:absolute;top:8px;right:8px;width:22px;height:22px;border-radius:50%;border:0;display:flex;align-items:center;justify-content:center;padding:0;cursor:pointer}
.wi-perks{display:flex;gap:6px;flex-wrap:wrap;margin:10px 6px 0;font-size:12.5px}
.wi-perks span{display:flex;align-items:center;gap:4px}
.wi-md{border-radius:24px;padding:16px;display:flex;align-items:center;gap:14px}
.wi-md img{width:48px;height:48px;border-radius:12px;flex:none}
.wi-md b{font-weight:500;font-size:16px;display:block}.wi-md small{font-size:13.5px;display:block;margin-top:2px}
.wi-md button{margin-left:auto;flex:none;border:0;border-radius:11px;padding:10px 18px;font:inherit;font-weight:500;font-size:14px;letter-spacing:.1px;cursor:pointer}
.wi-veil{position:fixed;inset:0;z-index:1000;opacity:0;transition:opacity .4s ${EASE}}
.wi-sheet{position:fixed;left:8px;right:8px;bottom:8px;z-index:1001;border-radius:30px;padding:8px 16px calc(18px + env(safe-area-inset-bottom));transform:translateY(110%);transition:transform .5s ${EASE};text-align:left;-webkit-font-smoothing:antialiased}
.wi-open .wi-veil{opacity:1}.wi-open .wi-sheet{transform:none}
.wi-grab{width:36px;height:5px;border-radius:3px;margin:0 auto 14px}
.wi-sh{display:flex;align-items:center;gap:12px;padding:0 4px}
.wi-sh img{width:44px;height:44px;border-radius:10px}
.wi-h{font-weight:700;font-size:20px;letter-spacing:-.5px}
.wi-p{font-size:14px;letter-spacing:-.1px;margin-top:1px}
.wi-list{margin-top:16px;border-radius:18px;overflow:hidden}
.wi-row{display:flex;align-items:center;gap:12px;padding:12px 14px;position:relative;opacity:0;transform:translateY(8px);transition:opacity .45s ${EASE},transform .45s ${EASE}}
.wi-open .wi-row{opacity:1;transform:none}
.wi-row+.wi-row::before{content:"";position:absolute;left:56px;right:0;top:0;height:.5px}
.wi-sq{width:30px;height:30px;border-radius:9px;display:flex;align-items:center;justify-content:center;flex:none}
.wi-row b{font-weight:500;font-size:15px;letter-spacing:-.1px}.wi-row small{display:block;font-size:13px;margin-top:1px}
.wi-num{margin-left:auto;font-size:15px;font-variant-numeric:tabular-nums}
.wi-ok{display:block;width:100%;margin-top:14px;height:48px;border:0;border-radius:13px;font:inherit;font-weight:600;font-size:16px;cursor:pointer}
.wi-fade{transition:opacity .3s ${EASE},transform .3s ${EASE}}
@media (prefers-reduced-motion: reduce){.wi-veil,.wi-sheet,.wi-row,.wi-fade{transition:none}}
`;
let cssDone = false;
const inject = () => { if (cssDone) return; const s = document.createElement('style'); s.textContent = CSS; document.head.appendChild(s); cssDone = true; };

function detect(force) {
  if (force) return force;
  const ua = navigator.userAgent || '';
  if (matchMedia('(display-mode: standalone)').matches || navigator.standalone === true) return 'installed';
  if (/Instagram|FBAN|FBAV|FB_IAB|Line\/|TikTok|Snapchat|WhatsApp/i.test(ua)) return 'inapp';
  const ios = /iPhone|iPad|iPod/.test(ua) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
  if (ios) return /CriOS|FxiOS|EdgiOS/.test(ua) ? 'inapp' : 'ios';
  return 'android';
}
let deferred = null;
if (typeof window !== 'undefined') window.addEventListener('beforeinstallprompt', e => { e.preventDefault(); deferred = e; });

export const WallioInstall = {
  mount(el, opts = {}) {
    inject();
    const th = Object.assign({ card: '#FFFFFF', text: '#141826', muted: '#8A93A6', line: '#ECEEF3', blue: '#4B4FD6', group: '#F5F6FA', brand: '#4B4FD6', brandSoft: '#EEF0FF' }, opts.theme || {});
    const kind = detect(opts.force);
    const font = opts.fontFamily || 'inherit';
    const emit = n => opts.onEvent && opts.onEvent(n, kind);
    if (kind === 'installed') { el.innerHTML = ''; return { kind }; }
    const T = Object.assign({
      name: 'Wallio', desc: 'Toutes vos cartes de fidélité au même endroit', get: 'Obtenir',
      perks: ['Cadeau d’anniversaire', 'Offres exclusives'],
      mdTitle: 'Installer Wallio', mdSub: 'Toutes vos cartes, sur votre écran d’accueil', mdCta: 'Installer',
      inappDesc: 'Ouvrez ce lien dans Safari pour l’ajouter à votre écran d’accueil', inappCta: 'Copier', copied: 'Copié',
      sheetTitle: 'Ajouter Wallio', sheetSub: 'Sur votre écran d’accueil, en 3 gestes.', ok: 'OK',
    }, opts.texts || {});
    const icon = opts.icon ? `<img src="${opts.icon}" alt="">` : '';
    if (kind === 'android') {
      el.innerHTML = `<div class="wi wi-fade" style="font-family:${font}"><div class="wi-md" style="background:${th.brandSoft};color:${th.text}">${icon}<div><b>${T.mdTitle}</b><small style="color:${th.muted}">${T.mdSub}</small></div>
        <button type="button" style="background:${th.brand};color:#fff">${T.mdCta}</button></div></div>`;
    } else {
      const inapp = kind === 'inapp';
      el.innerHTML = `<div class="wi wi-fade" style="font-family:${font}"><div class="wi-clip" style="background:${th.card};color:${th.text}">${icon}
        <div style="min-width:0;padding-right:4px"><div class="wi-name">${T.name}</div><div class="wi-desc" style="color:${th.muted}">${inapp ? T.inappDesc : T.desc}</div></div>
        <button class="wi-get" type="button" style="background:${th.blue};color:#fff">${inapp ? T.inappCta : T.get}</button></div>
        ${inapp ? '' : `<div class="wi-perks" style="color:${th.muted}">${T.perks.map(p => `<span>${ic('check', 13, th.blue, 2.4)}${p}</span>`).join('<span style="opacity:.4">·</span>')}</div>`}</div>`;
    }
    emit('shown');
    const root = el.querySelector('.wi'), btn = el.querySelector('button');
    const hide = () => { root.style.opacity = 0; root.style.transform = 'translateY(6px)'; setTimeout(() => el.innerHTML = '', 320); };
    btn.onclick = async () => {
      emit('click');
      if (kind === 'inapp') { try { await navigator.clipboard.writeText(location.href); } catch (e) {} emit('link_copied'); btn.textContent = T.copied; return; }
      if (kind === 'android') { if (deferred) { deferred.prompt(); const r = await deferred.userChoice; deferred = null; emit(r.outcome === 'accepted' ? 'installed' : 'dismissed'); if (r.outcome === 'accepted') hide(); } else openSheet('android'); return; }
      openSheet('ios');
    };
    function openSheet(k) {
      emit('sheet_open');
      const ios26 = opts.ios26 ?? (() => { const m = navigator.userAgent.match(/OS (\d+)_/); return m ? +m[1] >= 26 : true; })();
      const rows = k === 'android'
        ? [['dots', 'Menu ⋮ de Chrome', 'En haut à droite'], ['plus', 'Installer l’application', 'Ou « Ajouter à l’écran d’accueil »'], ['check', 'Installer', 'Wallio rejoint vos apps']]
        : ios26
          ? [['menu', 'Touchez ≡', 'En bas à gauche de Safari'], ['share', 'Touchez « Partager »', 'Dans le menu qui s’ouvre'], ['plus', '« Sur l’écran d’accueil »', 'Puis touchez « Ajouter »']]
          : [['share', 'Touchez Partager', 'En bas de l’écran'], ['plus', 'Sur l’écran d’accueil', 'Faites défiler si besoin'], ['check', 'Ajouter', 'En haut à droite']];
      const w = document.createElement('div');
      w.innerHTML = `<div class="wi-veil" style="background:rgba(0,0,0,.25)"></div>
        <div class="wi-sheet" role="dialog" aria-modal="true" style="background:${th.group};color:${th.text};font-family:${font}">
          <div class="wi-grab" style="background:rgba(60,60,67,.3)"></div>
          <div class="wi-sh">${icon.replace('<img', '<img style="width:44px;height:44px;border-radius:10px"')}<div><div class="wi-h">${T.sheetTitle}</div><div class="wi-p" style="color:${th.muted}">${T.sheetSub}</div></div></div>
          <div class="wi-list" style="background:${th.card}">${rows.map(([i, a, b], n) => `<div class="wi-row" style="transition-delay:${.14 + n * .07}s"><div class="wi-sq" style="background:${th.brandSoft}">${ic(i, 17, th.blue, 2)}</div><div><b>${a}</b><small style="color:${th.muted}">${b}</small></div><span class="wi-num" style="color:${th.muted}">${n + 1}</span></div>`).join('')}</div>
          <button class="wi-ok" type="button" style="background:#000;color:#fff">${T.ok}</button>
        </div>`;
      w.querySelectorAll('.wi-row+.wi-row').forEach(r => r.style.setProperty('--l', th.line));
      const st = document.createElement('style'); st.textContent = `.wi-row+.wi-row::before{background:${th.line}}`; w.appendChild(st);
      document.body.appendChild(w);
      requestAnimationFrame(() => requestAnimationFrame(() => w.classList.add('wi-open')));
      const close = () => { w.classList.remove('wi-open'); setTimeout(() => w.remove(), 520); };
      w.querySelector('.wi-veil').onclick = close; w.querySelector('.wi-ok').onclick = close;
      return w;
    }
    return { kind, openSheet };
  },
};
if (typeof window !== 'undefined') window.WallioInstall = WallioInstall;
export default WallioInstall;
