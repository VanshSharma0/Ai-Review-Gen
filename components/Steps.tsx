"use client";

interface StepsProps {
  current: number; // 1, 2, or 3
}

const steps = ["Search", "Generate QR", "Get Reviews"];

export default function Steps({ current }: StepsProps) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        maxWidth: 420,
        margin: "40px auto 0",
        padding: "0 24px",
      }}
    >
      {steps.map((label, i) => {
        const num = i + 1;
        const done = num < current;
        const active = num === current;
        return (
          <div key={label} style={{ display: "flex", alignItems: "center", flex: i < steps.length - 1 ? "1" : undefined }}>
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 6 }}>
              <div
                style={{
                  width: 34,
                  height: 34,
                  borderRadius: "50%",
                  display: "grid",
                  placeItems: "center",
                  fontSize: 13,
                  fontWeight: 700,
                  border: done || active ? "2px solid var(--gold)" : "2px solid #333",
                  background: done ? "var(--gold)" : "var(--dark)",
                  color: done ? "var(--dark)" : active ? "var(--gold)" : "#555",
                  transition: "all 0.3s ease",
                }}
              >
                {done ? "✓" : num}
              </div>
              <div
                style={{
                  fontSize: 10,
                  fontWeight: 600,
                  textTransform: "uppercase",
                  letterSpacing: "0.8px",
                  color: done || active ? "var(--gold)" : "#555",
                  whiteSpace: "nowrap",
                  transition: "color 0.3s ease",
                }}
              >
                {label}
              </div>
            </div>
            {i < steps.length - 1 && (
              <div
                style={{
                  flex: 1,
                  height: 2,
                  background: done ? "var(--gold)" : "#2a2a2a",
                  margin: "0 6px",
                  marginBottom: 22,
                  transition: "background 0.3s ease",
                }}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}
