import { ScrapeConfigForm } from '@/components/scrapes/scrape-config-form';
import Link from 'next/link';

export default function NewScrapePage() {
  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <Link
          href="/scrapes"
          className="text-sm text-gray-500 hover:text-gray-700"
        >
          &larr; Back to scrapes
        </Link>
        <h1 className="mt-2 text-2xl font-bold text-gray-900">New Scrape</h1>
        <p className="mt-1 text-sm text-gray-600">
          Configure your scraping criteria and choose which platforms to search
        </p>
      </div>

      <div className="rounded-lg border border-gray-200 bg-white p-6">
        <ScrapeConfigForm />
      </div>
    </div>
  );
}
