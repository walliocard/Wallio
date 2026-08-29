"use client";
import { useState, useRef, useEffect } from "react";

interface CropEditorProps {
  imageUrl: string;
  targetW: number;
  targetH: number;
  label: string;
  onCrop: (dataUrl: string) => void;
  onClose: () => void;
}

const CROP_W = 520;

export default function CropEditor({ imageUrl, targetW, targetH, label, onCrop, onClose }: CropEditorProps) {
  const CROP_H = Math.round(CROP_W * targetH / targetW);

  const [scale, setScale] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [imgSize, setImgSize] = useState({ w: 0, h: 0 });
  const [cropping, setCropping] = useState(false);

  const isDragging = useRef(false);
  const dragStart = useRef({ x: 0, y: 0, ox: 0, oy: 0 });
  const scaleRef = useRef(1);
  const offsetRef = useRef({ x: 0, y: 0 });

  const fitScale = imgSize.w > 0 ? Math.max(CROP_W / imgSize.w, CROP_H / imgSize.h) : 1;

  function clamp(x: number, y: number, s: number) {
    const dw = imgSize.w * fitScale * s;
    const dh = imgSize.h * fitScale * s;
    return {
      x: Math.min(0, Math.max(x, CROP_W - dw)),
      y: Math.min(0, Math.max(y, CROP_H - dh)),
    };
  }

  useEffect(() => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => setImgSize({ w: img.naturalWidth, h: img.naturalHeight });
    img.src = imageUrl;
  }, [imageUrl]);

  function onPointerDown(e: React.PointerEvent) {
    isDragging.current = true;
    e.currentTarget.setPointerCapture(e.pointerId);
    dragStart.current = { x: e.clientX, y: e.clientY, ox: offset.x, oy: offset.y };
  }

  function onPointerMove(e: React.PointerEvent) {
    if (!isDragging.current) return;
    const dx = e.clientX - dragStart.current.x;
    const dy = e.clientY - dragStart.current.y;
    const clamped = clamp(dragStart.current.ox + dx, dragStart.current.oy + dy, scaleRef.current);
    setOffset(clamped);
    offsetRef.current = clamped;
  }

  function onPointerUp() { isDragging.current = false; }

  function onZoomChange(e: React.ChangeEvent<HTMLInputElement>) {
    const newScale = Number(e.target.value);
    // Keep crop center on same image point
    const cx = (-offsetRef.current.x + CROP_W / 2) / (fitScale * scaleRef.current);
    const cy = (-offsetRef.current.y + CROP_H / 2) / (fitScale * scaleRef.current);
    const clamped = clamp(
      -(cx * fitScale * newScale) + CROP_W / 2,
      -(cy * fitScale * newScale) + CROP_H / 2,
      newScale,
    );
    scaleRef.current = newScale;
    offsetRef.current = clamped;
    setScale(newScale);
    setOffset(clamped);
  }

  async function applyCrop() {
    setCropping(true);
    try {
      const img = new Image();
      img.crossOrigin = "anonymous";
      // Buster cache pour forcer un chargement CORS-aware (évite SecurityError)
      const src = imageUrl.startsWith("data:")
        ? imageUrl
        : `${imageUrl}${imageUrl.includes("?") ? "&" : "?"}_t=${Date.now()}`;
      await new Promise<void>((resolve, reject) => {
        img.onload = () => resolve();
        img.onerror = () => reject(new Error("Image non chargeable"));
        img.src = src;
      });
      const canvas = document.createElement("canvas");
      canvas.width = targetW; canvas.height = targetH;
      const ctx = canvas.getContext("2d")!;
      // Utiliser les refs pour éviter les closures périmées après l'await
      const ox = offsetRef.current.x;
      const oy = offsetRef.current.y;
      const s = scaleRef.current;
      const sx = -ox / (fitScale * s);
      const sy = -oy / (fitScale * s);
      const sw = CROP_W / (fitScale * s);
      const sh = CROP_H / (fitScale * s);
      ctx.drawImage(img, sx, sy, sw, sh, 0, 0, targetW, targetH);
      const dataUrl = canvas.toDataURL("image/jpeg", 0.92);
      onCrop(dataUrl);
    } catch (e) {
      console.error("[CropEditor] Erreur recadrage:", e);
      alert("Erreur lors du recadrage — essaie de re-uploader la photo.");
    } finally {
      setCropping(false);
    }
  }

  const dispW = imgSize.w * fitScale * scale;
  const dispH = imgSize.h * fitScale * scale;

  return (
    <div style={{
      position: "fixed", inset: 0, zIndex: 1000,
      background: "rgba(0,0,0,0.88)", backdropFilter: "blur(12px)",
      display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 20,
    }} onPointerDown={e => { if (e.target === e.currentTarget) onClose(); }}>

      {/* Label */}
      <p style={{ color: "rgba(255,255,255,0.9)", fontSize: 14, fontWeight: 600, margin: 0, letterSpacing: 0.2 }}>
        {label}
      </p>

      {/* Crop window */}
      <div style={{ position: "relative" }}>
        <div
          style={{
            width: CROP_W, height: CROP_H, overflow: "hidden", position: "relative",
            cursor: isDragging.current ? "grabbing" : "grab",
            borderRadius: 6, outline: "2px solid rgba(255,255,255,0.55)",
            outlineOffset: 0,
          }}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onPointerCancel={onPointerUp}
        >
          {imgSize.w > 0 && (
            <img
              src={imageUrl}
              crossOrigin="anonymous"
              draggable={false}
              style={{
                position: "absolute",
                width: dispW, height: dispH,
                left: offset.x, top: offset.y,
                userSelect: "none", pointerEvents: "none",
                objectFit: "fill",
              }}
            />
          )}
          {/* Grille rule-of-thirds */}
          {[33, 66].map(p => (
            <div key={`v${p}`} style={{ position: "absolute", left: `${p}%`, top: 0, bottom: 0, width: 1, background: "rgba(255,255,255,0.18)", pointerEvents: "none" }}/>
          ))}
          {[33, 66].map(p => (
            <div key={`h${p}`} style={{ position: "absolute", top: `${p}%`, left: 0, right: 0, height: 1, background: "rgba(255,255,255,0.18)", pointerEvents: "none" }}/>
          ))}
        </div>
        {/* Coins */}
        {[["0,0","top:0;left:0","0,4px,4px,0"],["100,0","top:0;right:0","0,0,4px,4px"],["0,100","bottom:0;left:0","4px,4px,0,0"],["100,100","bottom:0;right:0","4px,0,0,4px"]].map(([,pos,r]) => (
          <div key={pos} style={{
            position: "absolute", width: 18, height: 18,
            border: "2.5px solid white", borderRadius: r.split(",").map(x => x+"px").join(" "),
            ...(Object.fromEntries(pos.split(";").map(s => { const [k,v] = s.split(":"); return [k, v]; }))),
            pointerEvents: "none",
          }}/>
        ))}
      </div>

      {/* Zoom */}
      <div style={{ display: "flex", alignItems: "center", gap: 10, width: CROP_W }}>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.5)" strokeWidth="2">
          <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/><line x1="8" y1="11" x2="14" y2="11"/>
        </svg>
        <input type="range" min="1" max="4" step="0.01" value={scale}
          className="zoom-slider"
          onChange={onZoomChange}
          style={{ flex: 1 }}
        />
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.5)" strokeWidth="2">
          <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
          <line x1="8" y1="11" x2="14" y2="11"/><line x1="11" y1="8" x2="11" y2="14"/>
        </svg>
        <span style={{ color: "rgba(255,255,255,0.45)", fontSize: 11, fontFamily: "monospace", minWidth: 36 }}>
          {Math.round(scale * 100)}%
        </span>
      </div>

      {/* Actions */}
      <div style={{ display: "flex", gap: 12 }}>
        <button onClick={onClose} style={{
          padding: "10px 28px", borderRadius: 12, fontSize: 14, fontWeight: 500,
          background: "rgba(255,255,255,0.1)", border: "1px solid rgba(255,255,255,0.18)",
          color: "white", cursor: "pointer",
        }}>
          Annuler
        </button>
        <button onClick={applyCrop} disabled={cropping || imgSize.w === 0} style={{
          padding: "10px 28px", borderRadius: 12, fontSize: 14, fontWeight: 600,
          background: "#007AFF", border: "none", color: "white",
          cursor: cropping ? "wait" : "pointer", opacity: imgSize.w === 0 ? 0.5 : 1,
        }}>
          {cropping ? "Application…" : "Appliquer"}
        </button>
      </div>

      <p style={{ color: "rgba(255,255,255,0.3)", fontSize: 11, margin: 0 }}>
        Glissez pour déplacer · Molette ou slider pour zoomer · Clic hors cadre pour fermer
      </p>
    </div>
  );
}
