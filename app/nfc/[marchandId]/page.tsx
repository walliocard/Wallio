"use client";
export default function NfcPage({ params }: { params: { marchandId: string } }) {
  return (
    <main className="min-h-screen bg-[#0A0A0A] text-white flex items-center justify-center">
      <p>NFC — {params.marchandId}</p>
    </main>
  );
}
