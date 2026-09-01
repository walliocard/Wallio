"use client";

import { useEffect, useState } from "react";
import QRCode from "qrcode";

interface WallioQRProps {
  uid: string;          // merchant uid — génère une URL unique
  size?: number;        // px
  bg?: string;
  fg?: string;
}

export default function WallioQR({ uid, size = 56, bg = "#ffffff", fg = "#000000" }: WallioQRProps) {
  const [dataUrl, setDataUrl] = useState<string>("");

  useEffect(() => {
    const url = `https://app.walliocard.com/c/${uid}`;
    QRCode.toDataURL(url, {
      width: size * 3,
      margin: 1,
      color: { dark: fg, light: bg },
      errorCorrectionLevel: "M",
    }).then(setDataUrl).catch(() => {});
  }, [uid, size, fg, bg]);

  if (!dataUrl) return (
    <div style={{ width: size, height: size, background: bg, borderRadius: 4, display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div style={{ width: size * 0.4, height: size * 0.4, border: `2px solid ${fg}`, opacity: 0.3 }}/>
    </div>
  );

  return (
    <img
      src={dataUrl}
      alt="QR Code Wallio"
      style={{ width: size, height: size, borderRadius: 4, display: "block" }}
    />
  );
}
