"use client";

import { useState, useRef, useEffect } from "react";
import { Business } from "@/lib/data";
import { murtiJewellers, searchStaticBusinesses } from "@/lib/static-businesses";
import Steps from "./Steps";

interface SearchPageProps {
  onSelect: (business: Business) => void;
}

/** Anthropic calls are slower and cost tokens — debounce user typing. */
const SEARCH_DEBOUNCE_MS = 650;

export default function SearchPage({ onSelect }: SearchPageProps) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Business[]>([]);
  const [open, setOpen] = useState(false);
  const [focused, setFocused] = useState(false);
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const trimmed = query.trim();
    if (trimmed.length === 0) {
      const clearTimer = window.setTimeout(() => {
        setResults([]);
        setOpen(false);
        setSearchError(null);
        setSearchLoading(false);
      }, 0);
      return () => clearTimeout(clearTimer);
    }

    const handle = window.setTimeout(async () => {
      setSearchLoading(true);
      setSearchError(null);
      const staticHits = searchStaticBusinesses(trimmed);

      try {
        const res = await fetch(
          `/api/business/search?q=${encodeURIComponent(trimmed)}`
        );
        const data = (await res.json()) as {
          businesses?: Business[];
          error?: string;
        };

        const apiList = res.ok ? (data.businesses ?? []) : [];
        if (!res.ok && staticHits.length === 0) {
          setSearchError(
            typeof data.error === "string" ? data.error : "Search failed"
          );
        } else {
          setSearchError(null);
        }

        const seen = new Set(staticHits.map((s) => s.id));
        const merged = [
          ...staticHits,
          ...apiList.filter((a) => !seen.has(a.id)),
        ];
        setResults(merged);
        setOpen(merged.length > 0);
      } catch {
        setResults(staticHits);
        setOpen(staticHits.length > 0);
        if (staticHits.length === 0) {
          setSearchError("Could not reach search. Check your connection.");
        } else {
          setSearchError(null);
        }
      } finally {
        setSearchLoading(false);
      }
    }, SEARCH_DEBOUNCE_MS);

    return () => clearTimeout(handle);
  }, [query]);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target as Node) &&
        inputRef.current &&
        !inputRef.current.contains(e.target as Node)
      ) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  function handleSelect(biz: Business) {
    setQuery(biz.name);
    setOpen(false);
    onSelect(biz);
  }

  function trySelectFirstResult() {
    const trimmed = query.trim();
    if (!trimmed || results.length === 0) return;
    handleSelect(results[0]);
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Enter") {
      trySelectFirstResult();
    }
    if (e.key === "Escape") setOpen(false);
  }

  const trimmedQuery = query.trim();
  const showNoResults =
    trimmedQuery.length > 0 && !searchLoading && results.length === 0;

  return (
    <div className="animate-fade-up">
      <div
        style={{
          maxWidth: 700,
          margin: "0 auto",
          padding: "72px 0 48px",
          textAlign: "center",
        }}
      >
        <div
          style={{
            display: "inline-block",
            background: "var(--gold-dim, rgba(201,168,76,0.1))",
            border: "1px solid var(--gold-border, rgba(201,168,76,0.25))",
            color: "var(--gold)",
            fontSize: 11,
            fontWeight: 700,
            letterSpacing: "2px",
            textTransform: "uppercase",
            padding: "7px 18px",
            borderRadius: 100,
            marginBottom: 32,
          }}
        >
          🚀 QR-Powered Review Engine
        </div>

        <h1
          style={{
            fontFamily: "'Playfair Display', serif",
            fontSize: "clamp(38px, 5.5vw, 62px)",
            lineHeight: 1.08,
            letterSpacing: "-1.5px",
            marginBottom: 20,
            fontWeight: 900,
          }}
        >
          Turn Customers Into{" "}
          <em
            style={{
              fontStyle: "normal",
              background:
                "linear-gradient(135deg, var(--gold), #F0D080, var(--gold))",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              backgroundClip: "text",
            }}
          >
            5-Star Reviewers
          </em>
        </h1>

        <p
          style={{
            color: "var(--muted)",
            fontSize: 16,
            lineHeight: 1.75,
            maxWidth: 480,
            margin: "0 auto 56px",
          }}
        >
          Describe your business in plain language — Claude suggests matching
          listings and sample reviews you can tailor. Always verify details before
          printing QR codes.
        </p>

        <div style={{ maxWidth: 560, margin: "0 auto", position: "relative" }}>
          <div
            style={{
              position: "relative",
              background: "#ffffff",
              border: `1.5px solid ${focused ? "var(--gold)" : "var(--border)"}`,
              borderRadius: 16,
              padding: 4,
              transition: "border-color 0.2s",
              boxShadow: focused
                ? "0 0 0 3px rgba(201,168,76,0.08)"
                : "none",
            }}
          >
            <span
              style={{
                position: "absolute",
                left: 18,
                top: "50%",
                transform: "translateY(-50%)",
                fontSize: 18,
                pointerEvents: "none",
                zIndex: 2,
              }}
            >
              🔍
            </span>

            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onFocus={() => {
                setFocused(true);
                if (results.length > 0) setOpen(true);
              }}
              onBlur={() => setFocused(false)}
              onKeyDown={handleKeyDown}
              placeholder="Search your business name..."
              style={{
                width: "100%",
                background: "transparent",
                border: "none",
                outline: "none",
                color: "var(--text)",
                fontFamily: "'DM Sans', sans-serif",
                fontSize: 16,
                padding: "15px 148px 15px 50px",
              }}
              autoComplete="off"
              spellCheck={false}
            />

            <button
              type="button"
              onClick={() => trySelectFirstResult()}
              disabled={trimmedQuery.length === 0 || results.length === 0}
              style={{
                position: "absolute",
                right: 6,
                top: "50%",
                transform: "translateY(-50%)",
                background:
                  trimmedQuery.length === 0 || results.length === 0 ? "#D1D5DB" : "var(--gold)",
                color: "#111827",
                border: "none",
                borderRadius: 10,
                padding: "11px 22px",
                fontFamily: "'DM Sans', sans-serif",
                fontWeight: 700,
                fontSize: 14,
                cursor:
                  trimmedQuery.length === 0 || results.length === 0 ? "not-allowed" : "pointer",
                whiteSpace: "nowrap",
                transition: "background 0.2s, transform 0.15s",
              }}
              onMouseEnter={(e) => {
                if (trimmedQuery.length === 0 || results.length === 0) return;
                (e.currentTarget as HTMLButtonElement).style.background = "#F0D080";
              }}
              onMouseLeave={(e) => {
                if (trimmedQuery.length === 0 || results.length === 0) return;
                (e.currentTarget as HTMLButtonElement).style.background = "var(--gold)";
              }}
            >
              Find Business
            </button>
          </div>

          {searchLoading && trimmedQuery.length > 0 && (
            <div
              style={{
                marginTop: 12,
                padding: "12px 16px",
                fontSize: 14,
                color: "var(--muted)",
                textAlign: "left",
              }}
            >
              Generating suggestions with Claude…
            </div>
          )}

          {searchError && (
            <div
              style={{
                marginTop: 12,
                padding: "12px 16px",
                background: "rgba(180,60,60,0.12)",
                border: "1px solid rgba(220,100,100,0.35)",
                borderRadius: 12,
                fontSize: 14,
                color: "#e8a0a0",
                textAlign: "left",
              }}
            >
              {searchError}
            </div>
          )}

          {open && results.length > 0 && (
            <div
              ref={dropdownRef}
              className="animate-slide-down"
              style={{
                position: "absolute",
                top: "calc(100% + 8px)",
                left: 0,
                right: 0,
                background: "#161616",
                border: "1px solid #2a2a2a",
                borderRadius: 14,
                overflow: "hidden",
                zIndex: 200,
                boxShadow: "0 24px 60px rgba(0,0,0,0.7)",
              }}
            >
              {results.map((biz, idx) => (
                <div
                  key={biz.id}
                  onClick={() => handleSelect(biz)}
                  style={{
                    padding: "13px 18px",
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    gap: 14,
                    borderBottom:
                      idx < results.length - 1 ? "1px solid #222" : "none",
                    transition: "background 0.15s",
                  }}
                  onMouseEnter={(e) => {
                    (e.currentTarget as HTMLDivElement).style.background =
                      "rgba(201,168,76,0.07)";
                  }}
                  onMouseLeave={(e) => {
                    (e.currentTarget as HTMLDivElement).style.background =
                      "transparent";
                  }}
                >
                  <div
                    style={{
                      width: 42,
                      height: 42,
                      borderRadius: 10,
                      background: "rgba(201,168,76,0.1)",
                      display: "grid",
                      placeItems: "center",
                      fontSize: 22,
                      flexShrink: 0,
                    }}
                  >
                    {biz.icon}
                  </div>
                  <div style={{ textAlign: "left", flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 600, fontSize: 15 }}>{biz.name}</div>
                    <div
                      style={{
                        fontSize: 12,
                        color: "var(--muted)",
                        marginTop: 2,
                      }}
                    >
                      {biz.type}
                    </div>
                  </div>
                  <div
                    style={{
                      color: "var(--gold)",
                      fontSize: 13,
                      fontWeight: 600,
                      flexShrink: 0,
                    }}
                  >
                    {biz.rating} ★
                  </div>
                </div>
              ))}
            </div>
          )}

          {showNoResults && !searchError && (
            <div
              style={{
                marginTop: 12,
                padding: "12px 16px",
                background: "#161616",
                border: "1px solid #2a2a2a",
                borderRadius: 12,
                fontSize: 14,
                color: "var(--muted)",
                textAlign: "left",
              }}
            >
              No suggestions returned for &quot;{query}&quot;. Try a clearer name
              plus city or neighborhood (for example, &quot;Joe&apos;s Pizza,
              Brooklyn&quot;).
            </div>
          )}
        </div>

        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            gap: 8,
            justifyContent: "center",
            marginTop: 20,
          }}
        >
          {(
            [
              { label: "Murti Jewellers", pick: murtiJewellers },
              { label: "Coffee shop" },
              { label: "Italian restaurant" },
              { label: "Hair salon" },
            ] satisfies { label: string; pick?: Business }[]
          ).map((chip) => (
            <button
              key={chip.label}
              type="button"
              onClick={() =>
                chip.pick ? handleSelect(chip.pick) : setQuery(chip.label)
              }
              style={{
                background: chip.pick
                  ? "rgba(201,168,76,0.12)"
                  : "transparent",
                border: "1px solid #2a2a2a",
                color: "#666",
                borderRadius: 100,
                padding: "5px 14px",
                fontSize: 12,
                cursor: "pointer",
                fontFamily: "'DM Sans', sans-serif",
                transition: "all 0.15s",
              }}
              onMouseEnter={(e) => {
                const el = e.currentTarget as HTMLButtonElement;
                el.style.borderColor = "var(--gold)";
                el.style.color = "var(--gold)";
              }}
              onMouseLeave={(e) => {
                const el = e.currentTarget as HTMLButtonElement;
                el.style.borderColor = "#2a2a2a";
                el.style.color = "#666";
              }}
            >
              {chip.label}
            </button>
          ))}
        </div>

        <p
          style={{
            marginTop: 24,
            fontSize: 11,
            color: "#555",
            lineHeight: 1.55,
            maxWidth: 520,
            marginLeft: "auto",
            marginRight: "auto",
          }}
        >
          Partner listings (e.g. Murti Jewellers) use curated copy and official
          Google review links. Other matches may come from AI — always verify
          before printing QR codes.
        </p>
      </div>

      <Steps current={1} />

      <div
        style={{
          maxWidth: 760,
          margin: "64px auto 0",
          padding: "0 0 80px",
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
          gap: 16,
        }}
      >
        {[
          {
            icon: "⚡",
            title: "Instant QR",
            desc: "Generated in milliseconds, ready to print",
          },
          {
            icon: "✍️",
            title: "Pre-written Reviews",
            desc: "AI drafts customers can personalize before posting",
          },
          {
            icon: "📋",
            title: "One-tap Copy",
            desc: "Copy & paste to Maps or your review site",
          },
          {
            icon: "🖨️",
            title: "Print Ready",
            desc: "Clean print layout included",
          },
        ].map((f) => (
          <div
            key={f.title}
            style={{
              background: "#111",
              border: "1px solid #1e1e1e",
              borderRadius: 16,
              padding: "20px",
              transition: "border-color 0.2s, transform 0.2s",
            }}
            onMouseEnter={(e) => {
              const el = e.currentTarget as HTMLDivElement;
              el.style.borderColor = "rgba(201,168,76,0.3)";
              el.style.transform = "translateY(-2px)";
            }}
            onMouseLeave={(e) => {
              const el = e.currentTarget as HTMLDivElement;
              el.style.borderColor = "#1e1e1e";
              el.style.transform = "none";
            }}
          >
            <div style={{ fontSize: 26, marginBottom: 10 }}>{f.icon}</div>
            <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 4 }}>
              {f.title}
            </div>
            <div
              style={{ color: "var(--muted)", fontSize: 13, lineHeight: 1.5 }}
            >
              {f.desc}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
