import type { Metadata } from "next";
import "./globals.css";
import { SiteFooter } from "@/components/site-footer";

export const metadata: Metadata = {
  title: "Betsy Home | Handmade Pieces for a Meaningful Home",
  description: "A curated marketplace for handmade, custom, and unique home products."
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-cream text-charcoal antialiased">
        {children}
        <SiteFooter />
      </body>
    </html>
  );
}
