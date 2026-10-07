// Redirected — use /api/passkey/check?telephone=... instead
export async function GET() {
  return Response.json({ registered: false });
}
