"use client";

import type { TamponResult, Client, Marchand } from "@/lib/loyalty";
import ResultPage from "@/components/nfc/ResultPage";

export interface StampMerchant { name: string; logo?: string; color: string; round?: boolean; }
export interface StampResult { result: TamponResult; client: Client; marchand: Marchand; }

interface Props {
  merchant: StampMerchant;
  result: StampResult | null;
  fresh?: boolean;      // conservé pour compat (non utilisé : ResultPage gère loading/result)
  onRetry: () => void;
}

// Passe-plat : ResultPage gère à la fois l'état de chargement (tuile qui respire)
// et l'affichage du résultat, avec la transition à tuile unique.
export default function StampPage({ merchant, result, onRetry }: Props) {
  return <ResultPage merchant={merchant} result={result} onRetry={onRetry} />;
}
