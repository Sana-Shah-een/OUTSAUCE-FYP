import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';

export default function LandingPage() {
  return (
    <div className="flex min-h-screen flex-col">
      {/* Nav */}
      <nav className="border-b bg-card">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6">
          <span className="text-xl font-bold text-primary">Outsauce</span>
          <div className="flex items-center gap-2 sm:gap-4">
            <Button variant="ghost" nativeButton={false} render={<Link href="/login" />}>
              Sign in
            </Button>
            <Button nativeButton={false} render={<Link href="/signup" />}>
              Get started
            </Button>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <main className="flex flex-1 flex-col items-center justify-center px-4 sm:px-6 py-16 sm:py-24">
        <div className="mx-auto max-w-3xl text-center">
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight text-foreground">
            Scrape smarter.
            <br />
            <span className="text-primary">Connect faster.</span>
          </h1>
          <p className="mt-6 text-base sm:text-lg text-muted-foreground">
            The all-in-one platform for job seekers, freelancers, and employers.
            Scrape LinkedIn, Upwork, Fiverr, and Reddit for opportunities. Save
            leads, connect with matches, and optimize your profiles with AI.
          </p>
          <div className="mt-8 sm:mt-10 flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4">
            <Button size="lg" className="w-full sm:w-auto" nativeButton={false} render={<Link href="/signup" />}>
              Start for free
            </Button>
            <Button size="lg" variant="outline" className="w-full sm:w-auto" nativeButton={false} render={<Link href="/login" />}>
              Sign in
            </Button>
          </div>
          <p className="mt-4 text-sm text-muted-foreground">
            20 free leads per month. No credit card required.
          </p>
        </div>

        {/* Feature grid */}
        <div className="mx-auto mt-16 sm:mt-20 grid max-w-5xl grid-cols-1 gap-4 sm:gap-6 sm:grid-cols-2 lg:grid-cols-4 px-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Multi-Platform Scraping</CardTitle>
              <CardDescription>Search LinkedIn, Upwork, Fiverr, and Reddit from one place</CardDescription>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Lead Management</CardTitle>
              <CardDescription>Save, organize, tag, and export leads in CSV, JSON, or PDF</CardDescription>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Smart Networking</CardTitle>
              <CardDescription>Find and connect with people who share your interests</CardDescription>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">AI Profile Optimizer</CardTitle>
              <CardDescription>Generate platform-optimized bios, resumes, and proposals</CardDescription>
            </CardHeader>
          </Card>
        </div>
      </main>
    </div>
  );
}
