'use client';

import {
  Briefcase,
  Building2,
  CalendarClock,
  CheckCircle2,
  Clock,
  DollarSign,
  ExternalLink,
  MapPin,
  MessageSquare,
  Star,
  ThumbsUp,
  Users,
  Zap,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';

export interface LeadCardData {
  id: string;
  source: string | null;
  source_url: string | null;
  title: string;
  description: string | null;
  company: string | null;
  location: string | null;
  salary_range: string | null;
  salary_min?: number | null;
  salary_max?: number | null;
  metadata?: Record<string, unknown> | null;
  created_at?: string;
}

const SOURCE_LABEL: Record<string, string> = {
  linkedin: 'LinkedIn',
  upwork: 'Upwork',
  fiverr: 'Fiverr',
  reddit: 'Reddit',
};

const SOURCE_ACCENT: Record<string, string> = {
  linkedin: 'bg-[#0A66C2]/10 text-[#0A66C2] ring-[#0A66C2]/20',
  upwork: 'bg-[#14A800]/10 text-[#14A800] ring-[#14A800]/20',
  fiverr: 'bg-[#1DBF73]/10 text-[#1DBF73] ring-[#1DBF73]/20',
  reddit: 'bg-[#FF4500]/10 text-[#FF4500] ring-[#FF4500]/20',
};

export function LeadCard({
  lead,
  headerExtra,
  footer,
}: {
  lead: LeadCardData;
  headerExtra?: React.ReactNode;
  footer?: React.ReactNode;
}) {
  const source = (lead.source ?? '').toLowerCase();
  const sourceAccent = SOURCE_ACCENT[source] ?? 'bg-muted text-muted-foreground ring-border';
  const isVerified = lead.metadata?.verified === true;

  return (
    <div className="space-y-6">
      <header className="space-y-3">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              {lead.source && (
                <span
                  className={cn(
                    'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ring-1 ring-inset',
                    sourceAccent,
                  )}
                >
                  {SOURCE_LABEL[source] ?? lead.source}
                </span>
              )}
              {isVerified && (
                <span
                  className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2.5 py-0.5 text-xs font-semibold text-emerald-600 ring-1 ring-inset ring-emerald-500/20 dark:text-emerald-400"
                  title="Verified live listing — pulled directly from the source platform"
                >
                  <CheckCircle2 className="h-3 w-3" />
                  Verified
                </span>
              )}
              {lead.created_at && (
                <span className="text-xs text-muted-foreground">
                  Added {new Date(lead.created_at).toLocaleDateString()}
                </span>
              )}
            </div>
            <h2 className="text-lg font-bold tracking-tight text-foreground break-words sm:text-xl lg:text-2xl">
              {lead.title.replace(/^\s*\[\s*HIRING\s*\]\s*/i, '').replace(/^\s*HIRING:\s*/i, '').trim()}
            </h2>
            {lead.company && (
              <p className="flex items-center gap-1.5 text-sm font-medium text-muted-foreground">
                <Building2 className="h-3.5 w-3.5" />
                {lead.company}
              </p>
            )}
          </div>
          {headerExtra && <div className="flex-shrink-0">{headerExtra}</div>}
        </div>

        {lead.source_url && (
          <Button
            nativeButton={false}
            variant="secondary"
            size="sm"
            render={
              <a href={lead.source_url} target="_blank" rel="noopener noreferrer" />
            }
          >
            <ExternalLink className="h-3.5 w-3.5 mr-1.5" />
            View original listing
          </Button>
        )}
      </header>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <Stat icon={MapPin} label="Location" value={lead.location} />
        <Stat
          icon={DollarSign}
          label="Compensation"
          value={
            lead.salary_range ??
            formatRange(lead.salary_min, lead.salary_max)
          }
        />
      </div>

      {lead.description && (
        <section className="space-y-2">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Description
          </h3>
          <p className="whitespace-pre-wrap text-sm leading-relaxed text-foreground">
            {lead.description}
          </p>
        </section>
      )}

      {lead.metadata && Object.keys(lead.metadata).length > 0 && (
        <>
          <Separator />
          <SourceMetadata source={source} metadata={lead.metadata} />
        </>
      )}

      {footer && (
        <>
          <Separator />
          <div>{footer}</div>
        </>
      )}
    </div>
  );
}

function Stat({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ElementType;
  label: string;
  value: string | null | undefined;
}) {
  return (
    <div className="min-w-0 rounded-lg border bg-muted/40 px-3 py-2.5">
      <div className="flex items-center gap-1.5 text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
        <Icon className="h-3 w-3 flex-shrink-0" />
        <span className="truncate">{label}</span>
      </div>
      <p className="mt-1 break-words text-sm font-semibold text-foreground">
        {value || '—'}
      </p>
    </div>
  );
}

function formatRange(
  min: number | null | undefined,
  max: number | null | undefined,
): string | null {
  if (min == null && max == null) return null;
  if (min != null && max != null) return `${formatNumber(min)} – ${formatNumber(max)}`;
  if (min != null) return `From ${formatNumber(min)}`;
  return `Up to ${formatNumber(max!)}`;
}

function SourceMetadata({
  source,
  metadata,
}: {
  source: string;
  metadata: Record<string, unknown>;
}) {
  if (source === 'linkedin') return <LinkedInMeta metadata={metadata} />;
  if (source === 'upwork') return <UpworkMeta metadata={metadata} />;
  if (source === 'fiverr') return <FiverrMeta metadata={metadata} />;
  if (source === 'reddit') return <RedditMeta metadata={metadata} />;
  return <GenericMeta metadata={metadata} />;
}

function LinkedInMeta({ metadata }: { metadata: Record<string, unknown> }) {
  const applicants = pickNumber(metadata, 'applicants');
  const postedDays = pickNumber(metadata, 'posted_days_ago');
  const easyApply = pickBoolean(metadata, 'easy_apply');

  return (
    <Section title="LinkedIn details">
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-3">
        <MetaTile icon={Users} label="Applicants" value={applicants?.toString() ?? '—'} />
        <MetaTile
          icon={CalendarClock}
          label="Posted"
          value={postedDays != null ? `${postedDays}d ago` : '—'}
        />
        <MetaTile
          icon={Zap}
          label="Easy Apply"
          value={easyApply == null ? '—' : easyApply ? 'Yes' : 'No'}
          highlight={easyApply === true}
        />
      </div>
    </Section>
  );
}

function UpworkMeta({ metadata }: { metadata: Record<string, unknown> }) {
  const rating = pickNumber(metadata, 'client_rating');
  const jobsPosted = pickNumber(metadata, 'jobs_posted');
  const verified = pickBoolean(metadata, 'payment_verified');
  const hours = pickString(metadata, 'hours_per_week');

  return (
    <Section title="Client details">
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <MetaTile
          icon={Star}
          label="Client rating"
          value={rating != null ? rating.toFixed(2) : '—'}
        />
        <MetaTile
          icon={Briefcase}
          label="Jobs posted"
          value={jobsPosted?.toString() ?? '—'}
        />
        <MetaTile
          icon={CheckCircle2}
          label="Payment"
          value={verified == null ? '—' : verified ? 'Verified' : 'Unverified'}
          highlight={verified === true}
        />
        <MetaTile icon={Clock} label="Workload" value={hours ?? '—'} />
      </div>
    </Section>
  );
}

function FiverrMeta({ metadata }: { metadata: Record<string, unknown> }) {
  const sellerLevel = pickString(metadata, 'seller_level');
  const rating = pickNumber(metadata, 'rating');
  const reviews = pickNumber(metadata, 'reviews');
  const deliveryDays = pickNumber(metadata, 'delivery_days');

  return (
    <Section title="Seller details">
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <MetaTile
          icon={CheckCircle2}
          label="Seller level"
          value={sellerLevel ?? '—'}
          highlight={sellerLevel === 'Top Rated'}
        />
        <MetaTile
          icon={Star}
          label="Rating"
          value={rating != null ? rating.toFixed(1) : '—'}
        />
        <MetaTile icon={Users} label="Reviews" value={reviews?.toString() ?? '—'} />
        <MetaTile
          icon={Clock}
          label="Delivery"
          value={deliveryDays != null ? `${deliveryDays} days` : '—'}
        />
      </div>
    </Section>
  );
}

function RedditMeta({ metadata }: { metadata: Record<string, unknown> }) {
  const subreddit = pickString(metadata, 'subreddit');
  const upvotes = pickNumber(metadata, 'upvotes');
  const comments = pickNumber(metadata, 'comments');
  const postedHours = pickNumber(metadata, 'posted_hours_ago');

  return (
    <Section title="Reddit thread">
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <MetaTile
          icon={MessageSquare}
          label="Subreddit"
          value={subreddit ?? '—'}
        />
        <MetaTile icon={ThumbsUp} label="Upvotes" value={upvotes?.toString() ?? '—'} />
        <MetaTile
          icon={MessageSquare}
          label="Comments"
          value={comments?.toString() ?? '—'}
        />
        <MetaTile
          icon={CalendarClock}
          label="Posted"
          value={postedHours != null ? formatHoursAgo(postedHours) : '—'}
        />
      </div>
    </Section>
  );
}

function GenericMeta({ metadata }: { metadata: Record<string, unknown> }) {
  const entries = Object.entries(metadata).filter(
    ([, v]) => v !== null && v !== undefined && v !== '',
  );
  if (entries.length === 0) return null;
  return (
    <Section title="Additional details">
      <dl className="grid grid-cols-1 gap-2 sm:grid-cols-2">
        {entries.map(([k, v]) => (
          <div key={k} className="rounded-md bg-muted/40 px-3 py-2">
            <dt className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
              {humanize(k)}
            </dt>
            <dd className="text-sm font-medium text-foreground">{formatValue(v)}</dd>
          </div>
        ))}
      </dl>
    </Section>
  );
}

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="space-y-2">
      <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
        {title}
      </h3>
      {children}
    </section>
  );
}

function MetaTile({
  icon: Icon,
  label,
  value,
  highlight,
}: {
  icon: React.ElementType;
  label: string;
  value: string;
  highlight?: boolean;
}) {
  return (
    <div
      className={cn(
        'min-w-0 rounded-lg border bg-muted/40 px-3 py-2.5',
        highlight && 'border-primary/40 bg-primary/5',
      )}
    >
      <div
        className={cn(
          'flex items-center gap-1.5 text-[11px] font-medium uppercase tracking-wide text-muted-foreground',
          highlight && 'text-primary',
        )}
      >
        <Icon className="h-3 w-3 flex-shrink-0" />
        <span className="truncate">{label}</span>
      </div>
      <p className="mt-1 break-words text-sm font-semibold text-foreground">
        {value}
      </p>
    </div>
  );
}

function pickNumber(
  obj: Record<string, unknown>,
  key: string,
): number | null {
  const v = obj[key];
  return typeof v === 'number' && !Number.isNaN(v) ? v : null;
}

function pickString(
  obj: Record<string, unknown>,
  key: string,
): string | null {
  const v = obj[key];
  return typeof v === 'string' && v.length > 0 ? v : null;
}

function pickBoolean(
  obj: Record<string, unknown>,
  key: string,
): boolean | null {
  const v = obj[key];
  return typeof v === 'boolean' ? v : null;
}

function formatNumber(n: number): string {
  if (n >= 1000) {
    return `$${(n / 1000).toFixed(n % 1000 === 0 ? 0 : 1)}k`;
  }
  return `$${n}`;
}

function formatHoursAgo(h: number): string {
  if (h < 1) return 'just now';
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  return `${d}d ago`;
}

function humanize(key: string): string {
  return key
    .split('_')
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');
}

function formatValue(v: unknown): string {
  if (typeof v === 'boolean') return v ? 'Yes' : 'No';
  if (v == null) return '—';
  if (typeof v === 'object') return JSON.stringify(v);
  return String(v);
}

export { Badge };
