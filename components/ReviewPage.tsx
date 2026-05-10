"use client";

import { useState, useCallback } from "react";
import { Business, Review } from "@/lib/data";
import Steps from "./Steps";

interface ReviewPageProps {
  business: Business;
  onBack: () => void;
  /** Shown on the back control (e.g. deep links use “Back to search”). */
  backLabel?: string;
}

function Toast({ message, visible }: { message: string; visible: boolean }) {
  return (
    <div
      style={{
        position: "fixed",
        bottom: 32,
        left: "50%",
        transform: `translateX(-50%) translateY(${visible ? 0 : "80px"})`,
        background: "#1a1a1a",
        border: "1px solid var(--gold)",
        color: "var(--text)",
        padding: "13px 24px",
        borderRadius: 100,
        fontSize: 14,
        fontWeight: 500,
        display: "flex",
        alignItems: "center",
        gap: 8,
        transition: "transform 0.35s cubic-bezier(0.34, 1.56, 0.64, 1)",
        zIndex: 9999,
        maxWidth: "min(90vw, 420px)",
        whiteSpace: "normal",
        textAlign: "center",
        lineHeight: 1.45,
        boxShadow: "0 8px 32px rgba(0,0,0,0.5)",
      }}
    >
      ✓ {message}
    </div>
  );
}

export default function ReviewPage({
  business,
  onBack,
  backLabel = "← Back to QR Code",
}: ReviewPageProps) {
  const partnerListing = Boolean(business.qrSlug);

  const [pager, setPager] = useState<{ pages: Review[][]; index: number }>(() => ({
    pages: [[...business.reviews]],
    index: 0,
  }));

  const [genLoading, setGenLoading] = useState(false);

  const [toastMsg, setToastMsg] = useState("");
  const [toastVisible, setToastVisible] = useState(false);
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);

  const displayedReviews = pager.pages[pager.index] ?? [];

  const showToast = useCallback((msg: string) => {
    setToastMsg(msg);
    setToastVisible(true);
    setTimeout(() => setToastVisible(false), 2800);
  }, []);

  async function copyOne(text: string) {
    try {
      await navigator.clipboard.writeText(text);
      showToast("Copied — paste in Google Reviews.");
    } catch {
      const ta = document.createElement("textarea");
      ta.value = text;
      ta.style.position = "fixed";
      ta.style.opacity = "0";
      document.body.appendChild(ta);
      ta.select();
      document.execCommand("copy");
      document.body.removeChild(ta);
      showToast("Copied — paste in Google Reviews.");
    }
  }

  /** Always calls Claude and replaces the visible reviews with a fresh set. */
  async function handleNewAiReviews() {
    setGenLoading(true);
    try {
      const variationNonce = `${Date.now()}-${Math.random().toString(36).slice(2, 11)}`;
      const res = await fetch("/api/business/more-reviews", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: business.name,
          type: business.type,
          personalize: true,
          ...(business.location ? { location: business.location } : {}),
          variationNonce,
        }),
      });
      const data = (await res.json()) as { reviews?: Review[]; error?: string };
      if (!res.ok) {
        throw new Error(typeof data.error === "string" ? data.error : "Failed");
      }
      const next = data.reviews ?? [];
      if (next.length === 0) throw new Error("Empty response");
      setPager({ pages: [next], index: 0 });
      showToast("New reviews ready — copy any line you like.");
    } catch {
      showToast("Could not generate — check API key or try again.");
    } finally {
      setGenLoading(false);
    }
  }

  function openGoogle() {
    window.open(business.googleUrl, "_blank");
  }

  return (
    <>
      <Toast message={toastMsg} visible={toastVisible} />

      <div className="animate-fade-up">
        <div style={{ maxWidth: 620, margin: "0 auto", padding: "0 20px 80px" }}>
          <button
            type="button"
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
              marginBottom: 20,
              padding: 0,
              transition: "color 0.2s",
            }}
            onMouseEnter={(e) =>
              ((e.currentTarget as HTMLButtonElement).style.color = "var(--text)")
            }
            onMouseLeave={(e) =>
              ((e.currentTarget as HTMLButtonElement).style.color = "var(--muted)")
            }
          >
            {backLabel}
          </button>

          <div
            style={{
              background: "rgba(66,133,244,0.06)",
              border: "1px solid rgba(66,133,244,0.2)",
              borderRadius: 14,
              padding: "16px 20px",
              marginBottom: 24,
              fontSize: 14,
              color: "#aac",
              lineHeight: 1.55,
            }}
          >
            When you&apos;re ready, open{" "}
            <strong style={{ color: "var(--text)" }}>
              {partnerListing ? "Google Reviews" : "Google"}
            </strong>{" "}
            and paste what you copied.
          </div>

          <button
            type="button"
            onClick={openGoogle}
            style={{
              width: "100%",
              background: "#4285F4",
              color: "white",
              border: "none",
              borderRadius: 14,
              padding: "16px 24px",
              fontFamily: "'DM Sans', sans-serif",
              fontWeight: 700,
              fontSize: 16,
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 12,
              marginBottom: 28,
              transition: "background 0.2s, transform 0.15s, box-shadow 0.2s",
            }}
            onMouseEnter={(e) => {
              const el = e.currentTarget as HTMLButtonElement;
              el.style.background = "#3367D6";
              el.style.transform = "translateY(-1px)";
              el.style.boxShadow = "0 10px 28px rgba(66,133,244,0.35)";
            }}
            onMouseLeave={(e) => {
              const el = e.currentTarget as HTMLButtonElement;
              el.style.background = "#4285F4";
              el.style.transform = "none";
              el.style.boxShadow = "none";
            }}
          >
            <span
              style={{
                width: 24,
                height: 24,
                background: "white",
                borderRadius: 4,
                display: "grid",
                placeItems: "center",
                color: "#4285F4",
                fontWeight: 900,
                fontSize: 15,
                flexShrink: 0,
              }}
            >
              G
            </span>
            Open Google Reviews →
          </button>

          <div style={{ display: "flex", flexDirection: "column", gap: 12, marginBottom: 20 }}>
            {displayedReviews.map((review, i) => {
              const isHovered = hoveredIdx === i;
              return (
                <div
                  key={`${pager.index}-${i}-${review.text.slice(0, 24)}`}
                  onMouseEnter={() => setHoveredIdx(i)}
                  onMouseLeave={() => setHoveredIdx(null)}
                  style={{
                    background: "#111",
                    border: `1.5px solid ${isHovered ? "rgba(201,168,76,0.35)" : "#222"}`,
                    borderRadius: 16,
                    padding: "18px 18px 52px 18px",
                    position: "relative",
                    transition: "border-color 0.2s, transform 0.15s",
                    transform: isHovered ? "translateY(-1px)" : "none",
                  }}
                >
                  <p
                    style={{
                      fontSize: 15,
                      lineHeight: 1.7,
                      color: "#ddd",
                      marginBottom: 14,
                      paddingRight: 8,
                    }}
                  >
                    &quot;{review.text}&quot;
                  </p>

                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <div
                      style={{
                        width: 32,
                        height: 32,
                        borderRadius: "50%",
                        background: "linear-gradient(135deg, var(--gold), #8B6914)",
                        display: "grid",
                        placeItems: "center",
                        fontSize: 13,
                        fontWeight: 700,
                        color: "white",
                        flexShrink: 0,
                      }}
                    >
                      {review.avatar}
                    </div>
                    <div style={{ fontSize: 13, fontWeight: 600, color: "#bbb" }}>
                      {review.name}
                    </div>
                  </div>

                  <button
                    type="button"
                    aria-label="Copy this review"
                    title="Copy"
                    onClick={(e) => {
                      e.stopPropagation();
                      void copyOne(review.text);
                    }}
                    style={{
                      position: "absolute",
                      bottom: 14,
                      right: 14,
                      width: 40,
                      height: 40,
                      borderRadius: 12,
                      border: "1px solid rgba(201,168,76,0.45)",
                      background: "rgba(201,168,76,0.12)",
                      cursor: "pointer",
                      display: "grid",
                      placeItems: "center",
                      fontSize: 18,
                      lineHeight: 1,
                      transition: "background 0.15s, transform 0.12s",
                    }}
                    onMouseEnter={(e) => {
                      const el = e.currentTarget as HTMLButtonElement;
                      el.style.background = "rgba(201,168,76,0.22)";
                      el.style.transform = "scale(1.05)";
                    }}
                    onMouseLeave={(e) => {
                      const el = e.currentTarget as HTMLButtonElement;
                      el.style.background = "rgba(201,168,76,0.12)";
                      el.style.transform = "none";
                    }}
                  >
                    📋
                  </button>
                </div>
              );
            })}
          </div>

          {displayedReviews.length === 0 && (
            <div
              style={{
                background: "#111",
                border: "1px solid #222",
                borderRadius: 14,
                padding: "20px",
                marginBottom: 24,
                fontSize: 14,
                color: "var(--muted)",
                lineHeight: 1.65,
                textAlign: "center",
              }}
            >
              No samples here — tap Open Google Reviews above to write your own.
            </div>
          )}

          <button
            type="button"
            onClick={() => void handleNewAiReviews()}
            disabled={genLoading}
            style={{
              width: "100%",
              background: "rgba(201,168,76,0.14)",
              color: "var(--gold)",
              border: "1px solid rgba(201,168,76,0.55)",
              borderRadius: 14,
              padding: "14px 22px",
              fontFamily: "'DM Sans', sans-serif",
              fontWeight: 700,
              fontSize: 15,
              cursor: genLoading ? "wait" : "pointer",
              marginTop: 8,
              marginBottom: 0,
              opacity: genLoading ? 0.75 : 1,
              transition: "background 0.2s, border-color 0.2s, transform 0.12s",
            }}
            onMouseEnter={(e) => {
              if (genLoading) return;
              const el = e.currentTarget as HTMLButtonElement;
              el.style.background = "rgba(201,168,76,0.22)";
              el.style.borderColor = "var(--gold)";
            }}
            onMouseLeave={(e) => {
              const el = e.currentTarget as HTMLButtonElement;
              el.style.background = "rgba(201,168,76,0.14)";
              el.style.borderColor = "rgba(201,168,76,0.55)";
            }}
          >
            {genLoading ? "Generating with Claude…" : "New AI reviews"}
          </button>

        </div>

        <Steps current={3} />
      </div>
    </>
  );
}
