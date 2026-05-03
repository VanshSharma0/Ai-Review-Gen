import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "ReviewQR — Instant Google Review Booster",
  description: "Generate QR codes that guide customers to leave 5-star Google reviews.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
