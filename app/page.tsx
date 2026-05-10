"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { decodeBusinessSnapshot } from "@/lib/business-snapshot";
import { Business } from "@/lib/data";
import { resolveBusinessBySlug } from "@/lib/fetch-business-by-slug";
import Header from "@/components/Header";
import SearchPage from "@/components/SearchPage";
import QRPage from "@/components/QRPage";
import ReviewPage from "@/components/ReviewPage";

type Page = "search" | "qr" | "review";

function HomeContent() {
  const searchParams = useSearchParams();
  const [page, setPage] = useState<Page>("search");
  const [business, setBusiness] = useState<Business | null>(null);

  useEffect(() => {
    const slugOnly = searchParams.get("b")?.trim();
    const bizParam = searchParams.get("biz")?.trim();

    let cancelled = false;

    async function resolve() {
      if (slugOnly) {
        const resolved = await resolveBusinessBySlug(slugOnly);
        if (cancelled) return;
        if (!resolved) {
          console.warn("Unknown review link (?b=).");
          return;
        }
        setBusiness(resolved);
        setPage("review");
        window.scrollTo({ top: 0, behavior: "smooth" });
        return;
      }

      if (bizParam) {
        let resolved = decodeBusinessSnapshot(bizParam);
        if (!resolved) {
          resolved = await resolveBusinessBySlug(bizParam);
        }
        if (cancelled) return;
        if (!resolved) {
          console.warn("Invalid QR payload (?biz=).");
          return;
        }
        setBusiness(resolved);
        setPage("review");
        window.scrollTo({ top: 0, behavior: "smooth" });
      }
    }

    void resolve();
    return () => {
      cancelled = true;
    };
  }, [searchParams]);

  function handleSelectBusiness(biz: Business) {
    setBusiness(biz);
    setPage("qr");
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function handlePreview() {
    setPage("review");
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function handleBack(to: Page) {
    setPage(to);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  return (
    <main style={{ minHeight: "100vh" }}>
      <Header />
      {page === "search" && <SearchPage onSelect={handleSelectBusiness} />}
      {page === "qr" && business && (
        <QRPage
          business={business}
          onBack={() => handleBack("search")}
          onPreview={handlePreview}
        />
      )}
      {page === "review" && business && (
        <ReviewPage key={business.id} business={business} />
      )}
    </main>
  );
}

export default function Home() {
  return (
    <Suspense
      fallback={
        <main style={{ minHeight: "100vh" }}>
          <Header />
        </main>
      }
    >
      <HomeContent />
    </Suspense>
  );
}
