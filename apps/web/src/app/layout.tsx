import type { Metadata } from "next";
import { ThemeProvider } from "../components/theme-provider";
import { AuthSessionGuard } from "../components/auth-session-guard";
import "./globals.css";

export const metadata: Metadata = {
  title: "Outsauce",
  description: "Hunt jobs, gigs, and candidates from LinkedIn, Upwork, Fiverr, and Reddit. AI-powered profile optimization and networking.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full antialiased" suppressHydrationWarning>
      <body className="min-h-full flex flex-col bg-background text-foreground hide-scrollbar font-sans">
        <ThemeProvider attribute="class" defaultTheme="dark" enableSystem disableTransitionOnChange>
          <AuthSessionGuard />
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}
