"use client";

import { useEffect, useRef, useState } from "react";
import { Business } from "@/lib/data";
import { buildCustomerReviewUrl } from "@/lib/qr-url";
import Steps from "./Steps";

interface QRPageProps {
  business: Business;
  onBack: () => void;
  onPreview: () => void;
}

export default function QRPage({ business, onBack, onPreview }: QRPageProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [qrReady, setQrReady] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const url = buildCustomerReviewUrl(window.location.origin, business);

    import("qrcode").then((QRCode) => {
      if (cancelled) return;
      setQrReady(false);
      if (canvasRef.current) {
        QRCode.toCanvas(
          canvasRef.current,
          url,
          {
            width: 264,
            margin: 3,
            color: { dark: "#000000", light: "#ffffff" },
            errorCorrectionLevel: "M",
          },
          (err) => {
            if (!cancelled && !err) setQrReady(true);
          }
        );
      }
    });

    return () => {
      cancelled = true;
    };
  }, [business]);

  function handlePrint() {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const dataUrl = canvas.toDataURL("image/png");
    const w = window.open("", "_blank");
    if (!w) return;
    w.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Print QR — ${business.name}</title>
        <style>
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body {
            background: #fff;
            display: flex;
            align-items: center;
            justify-content: center;
            min-height: 100vh;
            font-family: Georgia, serif;
          }
          .card {
            border: 3px solid #C9A84C;
            border-radius: 24px;
            padding: 48px 56px;
            text-align: center;
            max-width: 420px;
            width: 100%;
          }
          .icon { font-size: 48px; margin-bottom: 12px; }
          h1 { font-size: 28px; color: #0D0D0D; margin-bottom: 4px; }
          .type { color: #888; font-size: 14px; margin-bottom: 28px; font-family: sans-serif; letter-spacing: 0.5px; }
          .qr { background: #fff; padding: 12px; border-radius: 12px; border: 1px solid #eee; display: inline-block; margin-bottom: 28px; }
          .qr img { display: block; width: 264px; height: 264px; }
          .cta { background: #C9A84C; color: #000; border-radius: 10px; padding: 14px 28px; font-size: 16px; font-weight: 700; display: inline-block; font-family: sans-serif; margin-bottom: 12px; }
          .footer { font-size: 12px; color: #aaa; font-family: sans-serif; }
        </style>
      </head>
      <body>
        <div class="card">
          <div class="icon">${business.icon}</div>
          <h1>${business.name}</h1>
          <div class="type">${business.type}</div>
          <div class="qr"><img src="${dataUrl}" alt="QR Code" /></div>
          <br>
          <div class="cta">⭐ Scan to Leave a Review</div>
          <div class="footer" style="margin-top:12px">Your feedback helps us serve you better!</div>
        </div>
        <script>window.onload = () => window.print();<\/script>
      </body>
      </html>
    `);
    w.document.close();
  }

  return (
    <div className="animate-fade-up">
      <div style={{ maxWidth: 720, margin: "0 auto", padding: "40px 0" }}>
        {/* Back button */}
        <button
          onClick={onBack}
          style={{
            background: "transparent",
            border: "none",
            color: "var(--muted)",
            cursor: "pointer",
            fontFamily: "'DM Sans', sans-serif",
            fontSize: 14,
            display: "flex",
            alignItems: "center",
            gap: 6,
            marginBottom: 28,
            padding: 0,
            transition: "color 0.2s",
          }}
          onMouseEnter={(e) => ((e.currentTarget as HTMLButtonElement).style.color = "var(--text)")}
          onMouseLeave={(e) => ((e.currentTarget as HTMLButtonElement).style.color = "var(--muted)")}
        >
          ← Back to Search
        </button>

        {/* Header */}
        <div style={{ textAlign: "center", marginBottom: 40 }}>
          <h2
            style={{
              fontFamily: "'Playfair Display', serif",
              fontSize: "clamp(28px, 4vw, 38px)",
              marginBottom: 8,
              fontWeight: 700,
            }}
          >
            Your QR Code is{" "}
            <span
              style={{
                background: "linear-gradient(135deg, var(--gold), #F0D080)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                backgroundClip: "text",
              }}
            >
              Ready!
            </span>
          </h2>
          <p style={{ color: "var(--muted)", fontSize: 15 }}>
            Print this code and place it at your counter — customers scan &amp; review instantly.
          </p>
        </div>

        {/* QR Card */}
        <div
          style={{
            background: "#ffffff",
            border: "1px solid var(--border)",
            borderRadius: 24,
            padding: "40px",
            display: "flex",
            gap: 40,
            alignItems: "center",
            flexWrap: "wrap",
          }}
        >
          {/* QR visual */}
          <div style={{ position: "relative", flexShrink: 0 }}>
            <div
              style={{
                background: "white",
                borderRadius: 16,
                padding: 16,
                position: "relative",
                boxShadow: "0 0 0 2px var(--gold)",
              }}
            >
              <canvas
                ref={canvasRef}
                key={business.id}
                style={{ display: "block", borderRadius: 8 }}
              />
              {!qrReady && (
                <div
                  style={{
                    position: "absolute",
                    inset: 16,
                    background: "#f5f5f5",
                    borderRadius: 8,
                    display: "grid",
                    placeItems: "center",
                    fontSize: 13,
                    color: "#888",
                  }}
                >
                  Generating...
                </div>
              )}
            </div>
            <div
              style={{
                position: "absolute",
                bottom: -10,
                left: "50%",
                transform: "translateX(-50%)",
                background: "var(--gold)",
                color: "#0D0D0D",
                fontSize: 10,
                fontWeight: 800,
                letterSpacing: "1px",
                textTransform: "uppercase",
                padding: "4px 12px",
                borderRadius: 100,
                whiteSpace: "nowrap",
              }}
            >
              Scan to Review
            </div>
          </div>

          {/* Info */}
          <div style={{ flex: 1, minWidth: 220 }}>
            <div
              style={{
                fontFamily: "'Playfair Display', serif",
                fontSize: "clamp(22px, 3vw, 30px)",
                fontWeight: 700,
                marginBottom: 4,
              }}
            >
              {business.name}
            </div>
            <div
              style={{
                color: "var(--gold)",
                fontSize: 12,
                fontWeight: 700,
                letterSpacing: "1.5px",
                textTransform: "uppercase",
                marginBottom: 18,
              }}
            >
              {business.type}
            </div>
            <p
              style={{
                color: "var(--muted)",
                fontSize: 14,
                lineHeight: 1.7,
                marginBottom: 28,
              }}
            >
              Scanning opens your review page with sample text to copy plus a
              direct button to Google Reviews — fast for customers, better for your
              rating.
            </p>

            {/* Action buttons */}
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              <button
                onClick={handlePrint}
                style={{
                  background: "var(--gold)",
                  color: "#0D0D0D",
                  border: "none",
                  borderRadius: 12,
                  padding: "14px 24px",
                  fontFamily: "'DM Sans', sans-serif",
                  fontWeight: 700,
                  fontSize: 15,
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 8,
                  transition: "background 0.2s, transform 0.15s",
                }}
                onMouseEnter={(e) => {
                  const el = e.currentTarget as HTMLButtonElement;
                  el.style.background = "#F0D080";
                  el.style.transform = "translateY(-1px)";
                }}
                onMouseLeave={(e) => {
                  const el = e.currentTarget as HTMLButtonElement;
                  el.style.background = "var(--gold)";
                  el.style.transform = "none";
                }}
              >
                🖨️ Print QR Code
              </button>
              <button
                onClick={onPreview}
                style={{
                  background: "transparent",
                  color: "var(--text)",
                  border: "1px solid #333",
                  borderRadius: 12,
                  padding: "13px 24px",
                  fontFamily: "'DM Sans', sans-serif",
                  fontWeight: 600,
                  fontSize: 15,
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 8,
                  transition: "border-color 0.2s, color 0.2s",
                }}
                onMouseEnter={(e) => {
                  const el = e.currentTarget as HTMLButtonElement;
                  el.style.borderColor = "var(--gold)";
                  el.style.color = "var(--gold)";
                }}
                onMouseLeave={(e) => {
                  const el = e.currentTarget as HTMLButtonElement;
                  el.style.borderColor = "#333";
                  el.style.color = "var(--text)";
                }}
              >
                👁 Preview Customer Experience
              </button>
            </div>
          </div>
        </div>

        {/* Info row */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(3, 1fr)",
            gap: 12,
            marginTop: 20,
          }}
        >
          {[
            { icon: "📱", text: "Works on any phone camera" },
            { icon: "🔗", text: "Links to your review page" },
            { icon: "♾️", text: "Unlimited scans, forever" },
          ].map((item) => (
            <div
              key={item.text}
              style={{
                background: "#111",
                border: "1px solid #1e1e1e",
                borderRadius: 12,
                padding: "14px 16px",
                display: "flex",
                alignItems: "center",
                gap: 10,
                fontSize: 13,
                color: "var(--muted)",
              }}
            >
              <span>{item.icon}</span>
              <span>{item.text}</span>
            </div>
          ))}
        </div>
      </div>

      <Steps current={2} />
    </div>
  );
}
