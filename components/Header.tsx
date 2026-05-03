"use client";

export default function Header() {
  return (
    <header
      style={{
        padding: "24px 48px",
        display: "flex",
        alignItems: "center",
        gap: "12px",
        borderBottom: "1px solid #1e1e1e",
        position: "sticky",
        top: 0,
        background: "rgba(13,13,13,0.92)",
        backdropFilter: "blur(12px)",
        zIndex: 100,
      }}
    >
      <div
        style={{
          width: 38,
          height: 38,
          background: "var(--gold)",
          borderRadius: 10,
          display: "grid",
          placeItems: "center",
          fontSize: 20,
          flexShrink: 0,
        }}
      >
        ⭐
      </div>
      <div
        style={{
          fontFamily: "'Playfair Display', serif",
          fontSize: 22,
          fontWeight: 700,
          letterSpacing: "-0.5px",
        }}
      >
        Review<span style={{ color: "var(--gold)" }}>QR</span>
      </div>
    </header>
  );
}
