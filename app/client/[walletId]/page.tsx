"use client";
export default function ClientPage({ params }: { params: { walletId: string } }) {
  return (
    <main className="min-h-screen bg-[#0A0A0A] text-white flex items-center justify-center">
      <p>Client — {params.walletId}</p>
    </main>
  );
}
