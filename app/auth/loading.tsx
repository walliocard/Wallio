export default function AuthLoading() {
  return (
    <main
      style={{
        minHeight: "100dvh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "#F2F2F7",
      }}
    >
      <div
        style={{
          width: 32,
          height: 32,
          border: "3px solid rgba(0,122,255,0.15)",
          borderTopColor: "#007AFF",
          borderRadius: "50%",
          animation: "spin 0.75s linear infinite",
        }}
      />
      <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
    </main>
  );
}
