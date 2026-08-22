import { NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";

export async function POST(request: Request) {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: "ANTHROPIC_API_KEY manquant — ajoutez-la dans .env.local" },
      { status: 500 }
    );
  }

  const body = await request.json() as { description?: string };
  const description = body.description?.trim();
  if (!description) {
    return NextResponse.json({ error: "description requise" }, { status: 400 });
  }

  const client = new Anthropic({ apiKey });

  const message = await client.messages.create({
    model: "claude-haiku-4-5",
    max_tokens: 512,
    system: `Tu es un expert en design de marque. Le marchand décrit son établissement et tu proposes 3 palettes de couleurs pour sa carte de fidélité Apple Wallet.

Règles strictes :
- backgroundColor : couleur de fond de la carte (hex 6 chiffres)
- foregroundColor : texte principal, DOIT contraster avec backgroundColor (ratio WCAG ≥ 4.5)
- labelColor : texte des labels, légèrement plus discret
- Palette 1 : ton sombre/premium
- Palette 2 : ton moyen/neutre
- Palette 3 : ton clair/épuré
- Réponds UNIQUEMENT avec le JSON, aucun autre texte`,
    messages: [
      {
        role: "user",
        content: `Établissement : ${description}\n\nRéponds avec un tableau JSON de 3 objets : [{"name":"...","backgroundColor":"#hex","foregroundColor":"#hex","labelColor":"#hex"},...]`,
      },
    ],
  });

  const text = message.content[0].type === "text" ? message.content[0].text.trim() : "";

  // Extract JSON from the response
  const jsonMatch = text.match(/\[[\s\S]*\]/);
  if (!jsonMatch) {
    return NextResponse.json({ error: "Réponse invalide de l'IA", raw: text }, { status: 500 });
  }

  const palettes = JSON.parse(jsonMatch[0]) as Array<{
    name: string;
    backgroundColor: string;
    foregroundColor: string;
    labelColor: string;
  }>;

  return NextResponse.json(palettes);
}
