import type { CardTokens } from "../types";
import Stamps from "./Stamps";
import type { StampStyle } from "./Stamps";

interface Props {
  paliers?: { tampons: number; recompense: string }[];
  palier_actuel?: number;
  paliers_valides?: boolean[];
  tampons: number;
  objectif_tampons?: number;
  tokens: CardTokens;
  stampStyle?: StampStyle;
  stampSize?: number;
  thumbnail?: boolean;
}

export default function ProgressiveStamps({
  paliers, palier_actuel = 0, tampons, objectif_tampons,
  tokens, stampStyle, stampSize, thumbnail,
}: Props) {
  const current = paliers?.[palier_actuel];
  const total = current?.tampons ?? objectif_tampons ?? 10;
  const filled = Math.min(tampons, total);

  return (
    <Stamps
      fillWidth={!thumbnail}
      sizeOverride={!thumbnail ? stampSize : undefined}
      total={total}
      filled={filled}
      style={stampStyle ?? "circle"}
      tokens={tokens}
      size={thumbnail ? 7 : 18}
      gap={thumbnail ? 2 : 5}
      perRow={10}
    />
  );
}
