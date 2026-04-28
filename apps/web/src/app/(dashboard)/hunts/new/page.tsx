import { ScrapeConfigForm } from '@/components/scrapes/scrape-config-form';
import { Card, CardContent } from '@/components/ui/card';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';

export default function NewScrapePage() {
  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <Button variant="ghost" size="sm" className="mb-2" nativeButton={false} render={<Link href="/hunts" />}>
          <ArrowLeft className="h-4 w-4 mr-1" />
          Back to hunts
        </Button>
        <h1 className="text-2xl font-bold text-foreground">New Hunt</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Configure your hunt criteria and choose which platforms to search
        </p>
      </div>

      <Card>
        <CardContent className="pt-6">
          <ScrapeConfigForm />
        </CardContent>
      </Card>
    </div>
  );
}
