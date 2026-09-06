import { User } from "firebase/auth";

export async function saveMarchandFields(user: User, fields: Record<string, unknown>) {
  const idToken = await user.getIdToken();
  const res = await fetch("/api/marchand/save", {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${idToken}` },
    body: JSON.stringify(fields),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || `HTTP ${res.status}`);
  }
}
