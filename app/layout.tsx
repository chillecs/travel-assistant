import type { Metadata } from "next";
import { Geist } from "next/font/google";
import { SiteNav } from "@/components/site-nav";
import "./globals.css";

// Get the URL - works for both Vercel production and localhost development
const defaultUrl = process.env.VERCEL_URL
  ? `https://${process.env.VERCEL_URL}`
  : process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";

export const metadata: Metadata = {
  metadataBase: new URL(defaultUrl),
  title: "TravelAI",
  description: "Premium AI itineraries tailored to your trip.",
};

const geistSans = Geist({
  variable: "--font-geist-sans",
  display: "swap",
  subsets: ["latin"],
});

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${geistSans.className} antialiased`}>
        <SiteNav />
        {children}
      </body>
    </html>
  );
}
