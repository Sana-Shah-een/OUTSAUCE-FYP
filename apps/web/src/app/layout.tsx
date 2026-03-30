import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Outsauce - Smart Job & Gig Scraping Platform",
  description: "Scrape jobs, gigs, and candidates from LinkedIn, Upwork, Fiverr, and Reddit. AI-powered profile optimization and networking.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full flex flex-col font-sans">{children}</body>
    </html>
  );
}
