export type ListingDirection = 'hiring' | 'for_hire';

export interface AggregatedHit {
  origin: 'reddit' | 'hackernews';
  url: string;
  title: string;
  description?: string;
  author?: string;
  posted_at: number;
  raw_metadata: Record<string, unknown>;
}

const REDDIT_SUBS = [
  'forhire',
  'hireahacker',
  'slavelabour',
  'RemoteJobs',
  'jobbit',
];

const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000;
const USER_AGENT = 'OutsauceAggregator/1.0';

export async function fetchAllHits(
  direction: ListingDirection = 'hiring',
): Promise<AggregatedHit[]> {
  const cutoff = Date.now() - SEVEN_DAYS_MS;

  const settled = await Promise.allSettled([
    ...REDDIT_SUBS.map((sub) => fetchReddit(sub, cutoff, direction)),
    fetchHackerNews(cutoff, direction),
  ]);

  const hits: AggregatedHit[] = [];
  for (const r of settled) {
    if (r.status === 'fulfilled') hits.push(...r.value);
  }

  const seen = new Set<string>();
  const deduped: AggregatedHit[] = [];
  for (const h of hits) {
    if (seen.has(h.url)) continue;
    seen.add(h.url);
    deduped.push(h);
  }

  deduped.sort((a, b) => b.posted_at - a.posted_at);
  return deduped;
}

async function fetchReddit(
  sub: string,
  cutoff: number,
  direction: ListingDirection,
): Promise<AggregatedHit[]> {
  const url = `https://www.reddit.com/r/${sub}/new.json?limit=50`;
  let res: Response;
  try {
    res = await fetch(url, {
      headers: { 'User-Agent': USER_AGENT, Accept: 'application/json' },
    });
  } catch {
    return [];
  }
  if (!res.ok) return [];

  let data: unknown;
  try {
    data = await res.json();
  } catch {
    return [];
  }

  const children = (data as { data?: { children?: Array<{ data?: unknown }> } })
    ?.data?.children;
  if (!Array.isArray(children)) return [];

  const out: AggregatedHit[] = [];
  for (const c of children) {
    const post = c.data as
      | {
          title?: string;
          permalink?: string;
          url?: string;
          author?: string;
          selftext?: string;
          created_utc?: number;
          ups?: number;
          num_comments?: number;
          subreddit?: string;
          link_flair_text?: string;
        }
      | undefined;
    if (!post) continue;

    const title = post.title?.trim();
    const permalink = post.permalink;
    const createdSec = post.created_utc;
    if (!title || !permalink || !createdSec) continue;

    const postedMs = createdSec * 1000;
    if (postedMs < cutoff) continue;

    const titleUpper = title.toUpperCase();
    const flairUpper = (post.link_flair_text ?? '').toUpperCase();
    const isHiring =
      titleUpper.includes('[HIRING]') ||
      titleUpper.includes('HIRING:') ||
      flairUpper.includes('HIRING');
    const isForHire =
      titleUpper.includes('[FOR HIRE]') ||
      titleUpper.includes('[FORHIRE]') ||
      titleUpper.includes('FOR HIRE:') ||
      flairUpper.includes('FOR HIRE') ||
      flairUpper.includes('FORHIRE');

    if (sub === 'forhire' || sub === 'hireahacker' || sub === 'jobbit') {
      if (direction === 'hiring' && !isHiring) continue;
      if (direction === 'for_hire' && !isForHire) continue;
    } else if (direction === 'for_hire') {
      if (!isForHire) continue;
    }

    out.push({
      origin: 'reddit',
      url: `https://www.reddit.com${permalink}`,
      title,
      description: post.selftext?.trim().slice(0, 800) || undefined,
      author: post.author ? `u/${post.author}` : undefined,
      posted_at: postedMs,
      raw_metadata: {
        subreddit: `r/${post.subreddit ?? sub}`,
        upvotes: post.ups ?? 0,
        comments: post.num_comments ?? 0,
        posted_hours_ago: Math.max(
          0,
          Math.floor((Date.now() - postedMs) / (1000 * 60 * 60)),
        ),
      },
    });
  }
  return out;
}

async function fetchHackerNews(
  cutoff: number,
  direction: ListingDirection,
): Promise<AggregatedHit[]> {
  const cutoffSec = Math.floor(cutoff / 1000);
  const query =
    direction === 'for_hire'
      ? 'seeking%20freelance%20OR%20looking%20for%20work%20OR%20available'
      : 'remote%20OR%20hiring';
  const url = `https://hn.algolia.com/api/v1/search?tags=comment&query=${query}&numericFilters=created_at_i>${cutoffSec}&hitsPerPage=50`;

  let res: Response;
  try {
    res = await fetch(url, {
      headers: { 'User-Agent': USER_AGENT, Accept: 'application/json' },
    });
  } catch {
    return [];
  }
  if (!res.ok) return [];

  let data: unknown;
  try {
    data = await res.json();
  } catch {
    return [];
  }

  const hits = (data as { hits?: unknown[] }).hits;
  if (!Array.isArray(hits)) return [];

  const out: AggregatedHit[] = [];
  for (const h of hits) {
    const hit = h as
      | {
          objectID?: string;
          comment_text?: string;
          author?: string;
          created_at_i?: number;
          parent_id?: number;
          story_title?: string;
          story_id?: number;
        }
      | undefined;
    if (!hit) continue;

    const text = stripHtml(hit.comment_text ?? '');
    if (!text || text.length < 60) continue;
    if (!/\b(hiring|seeking|looking for|we need|join us|developer|engineer|designer|remote)\b/i.test(text)) {
      continue;
    }

    const createdSec = hit.created_at_i;
    if (!createdSec) continue;
    const postedMs = createdSec * 1000;
    if (postedMs < cutoff) continue;

    const objectID = hit.objectID;
    if (!objectID) continue;

    const title = extractTitle(text);

    out.push({
      origin: 'hackernews',
      url: `https://news.ycombinator.com/item?id=${objectID}`,
      title,
      description: text.slice(0, 600),
      author: hit.author ? `${hit.author} (HN)` : undefined,
      posted_at: postedMs,
      raw_metadata: {
        story_title: hit.story_title ?? null,
        posted_hours_ago: Math.max(
          0,
          Math.floor((Date.now() - postedMs) / (1000 * 60 * 60)),
        ),
      },
    });
  }
  return out;
}

function stripHtml(s: string): string {
  return s
    .replace(/<[^>]+>/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#x27;/g, "'")
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function extractTitle(text: string): string {
  const firstLine = text.split(/[.!?]\s|\n/)[0];
  const trimmed = firstLine.trim();
  if (trimmed.length >= 20 && trimmed.length <= 140) return trimmed;
  return trimmed.slice(0, 120) + (trimmed.length > 120 ? '…' : '');
}
