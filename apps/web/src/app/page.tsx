import Link from 'next/link';

export default function LandingPage() {
  return (
    <div className="flex min-h-screen flex-col">
      {/* Nav */}
      <nav className="border-b border-gray-200 bg-white">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6">
          <span className="text-xl font-bold text-indigo-600">Outsauce</span>
          <div className="flex items-center gap-4">
            <Link
              href="/login"
              className="text-sm font-medium text-gray-700 hover:text-gray-900"
            >
              Sign in
            </Link>
            <Link
              href="/signup"
              className="rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700"
            >
              Get started
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <main className="flex flex-1 flex-col items-center justify-center px-6 py-24">
        <div className="mx-auto max-w-3xl text-center">
          <h1 className="text-5xl font-bold tracking-tight text-gray-900">
            Scrape smarter.
            <br />
            <span className="text-indigo-600">Connect faster.</span>
          </h1>
          <p className="mt-6 text-lg text-gray-600">
            The all-in-one platform for job seekers, freelancers, and employers.
            Scrape LinkedIn, Upwork, Fiverr, and Reddit for opportunities. Save
            leads, connect with matches, and optimize your profiles with AI.
          </p>
          <div className="mt-10 flex items-center justify-center gap-4">
            <Link
              href="/signup"
              className="rounded-md bg-indigo-600 px-6 py-3 text-sm font-medium text-white hover:bg-indigo-700"
            >
              Start for free
            </Link>
            <Link
              href="/login"
              className="rounded-md border border-gray-300 bg-white px-6 py-3 text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              Sign in
            </Link>
          </div>
          <p className="mt-4 text-sm text-gray-500">
            20 free leads per month. No credit card required.
          </p>
        </div>

        {/* Feature grid */}
        <div className="mx-auto mt-20 grid max-w-5xl grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-4">
          <Feature
            title="Multi-Platform Scraping"
            description="Search LinkedIn, Upwork, Fiverr, and Reddit from one place"
          />
          <Feature
            title="Lead Management"
            description="Save, organize, tag, and export leads in CSV, JSON, or PDF"
          />
          <Feature
            title="Smart Networking"
            description="Find and connect with people who share your interests"
          />
          <Feature
            title="AI Profile Optimizer"
            description="Generate platform-optimized bios, resumes, and proposals"
          />
        </div>
      </main>
    </div>
  );
}

function Feature({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <div className="rounded-lg border border-gray-200 bg-white p-6">
      <h3 className="text-sm font-semibold text-gray-900">{title}</h3>
      <p className="mt-2 text-sm text-gray-600">{description}</p>
    </div>
  );
}
