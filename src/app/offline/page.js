// Served by public/sw.js when a navigation fails with no network. Kept outside
// the (main) group so it renders without a Supabase session or the app chrome.
export const metadata = {
  title: "Offline — ApexHub",
};

export default function OfflinePage() {
  return (
    <div
      style={{
        minHeight: "100dvh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: "12px",
        padding: "24px",
        textAlign: "center",
        background: "#0F172A",
        color: "#E2E8F0",
        fontFamily: "system-ui, sans-serif",
      }}
    >
      <h1 style={{ fontSize: "1.35rem", fontWeight: 700, margin: 0 }}>You&apos;re offline</h1>
      <p style={{ opacity: 0.75, margin: 0, maxWidth: "36ch" }}>
        ApexHub needs a connection to load your data. This page will work again once
        you&apos;re back online.
      </p>
    </div>
  );
}
