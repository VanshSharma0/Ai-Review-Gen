"use client";

import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import type { Business } from "@/lib/data";
import { resolveBusinessBySlug } from "@/lib/fetch-business-by-slug";
import Header from "@/components/Header";
import ReviewPage from "@/components/ReviewPage";

export default function ReviewDeepLinkPage() {
  const params = useParams();
  const router = useRouter();
  const slug = typeof params.slug === "string" ? params.slug : "";
  const [business, setBusiness] = useState<Business | null>(null);
  const [status, setStatus] = useState<"loading" | "error" | "ready">("loading");

  useEffect(() => {
    let cancelled = false;

    async function run() {
      if (!slug.trim()) {
        setStatus("error");
        return;
      }
      const resolved = await resolveBusinessBySlug(slug);
      if (cancelled) return;
      if (!resolved) {
        setStatus("error");
        return;
      }
      setBusiness(resolved);
      setStatus("ready");
    }

    void run();
    return () => {
      cancelled = true;
    };
  }, [slug]);

  return (
    <main style={{ minHeight: "100vh" }}>
      <Header />
      {status === "loading" && (
        <div
          style={{
            maxWidth: 620,
            margin: "0 auto",
            padding: "48px 20px",
            color: "var(--muted)",
            textAlign: "center",
            fontFamily: "'DM Sans', sans-serif",
          }}
        >
          Loading…
        </div>
      )}
      {status === "error" && (
        <div
          style={{
            maxWidth: 620,
            margin: "0 auto",
            padding: "48px 20px",
            color: "var(--muted)",
            textAlign: "center",
            fontFamily: "'DM Sans', sans-serif",
            lineHeight: 1.6,
          }}
        >
          We couldn&apos;t find this business. Check the link or ask the shop for an
          updated QR code.
        </div>
      )}
      {status === "ready" && business && (
        <ReviewPage
          key={business.id}
          business={business}
          onBack={() => router.push("/")}
          backLabel="← Back to search"
        />
      )}
    </main>
  );
}
