import type { Metadata } from "next";
import { Plus_Jakarta_Sans } from "next/font/google";
import { ThemeProvider } from "../components/theme-provider";
import { AuthSessionGuard } from "../components/auth-session-guard";
import "./globals.css";

const plusJakartaSans = Plus_Jakarta_Sans({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Outsauce",
  description: "Scrape jobs, gigs, and candidates from LinkedIn, Upwork, Fiverr, and Reddit. AI-powered profile optimization and networking.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`h-full antialiased ${plusJakartaSans.className}`} suppressHydrationWarning>
      <body className="min-h-full flex flex-col bg-background text-foreground hide-scrollbar">
        <ThemeProvider attribute="class" defaultTheme="dark" enableSystem disableTransitionOnChange>
          {/* Global client-side guard: clears stale tokens and redirects to /login */}
          <AuthSessionGuard />
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}

// Force TS Server refresh
