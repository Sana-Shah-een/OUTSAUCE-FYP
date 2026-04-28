import { ApifyClient } from 'apify-client';
import { Logger } from '@nestjs/common';

const logger = new Logger('ApifyLeads');

const ACTOR_ID = 'FgJtjDwJCLhRH9saM';
const CACHE_TTL_MS = 60 * 60 * 1000;
const ACTOR_TIMEOUT_SEC = 90;

export interface RealRedditLead {
  source_url: string;
  title: string;
  description?: string;
  company?: string;
  metadata: Record<string, unknown>;
}

interface CacheEntry {
  expiresAt: number;
  result: RealRedditLead | null;
}

const cache = new Map<string, CacheEntry>();

export async function fetchOneRedditLead(
  apifyToken: string | undefined,
  criteria: {
    keywords?: string[];
    location?: string;
    remote?: boolean;
  },
): Promise<RealRedditLead | null> {
  if (!apifyToken || apifyToken.trim().length === 0) return null;

  const keywords = (criteria.keywords ?? [])
    .filter((k): k is string => typeof k === 'string' && k.length > 0)
    .map((k) => k.trim().toLowerCase())
    .sort();

  const cacheKey = keywords.join('|') || '_default';
  const cached = cache.get(cacheKey);
  if (cached && cached.expiresAt > Date.now()) {
    logger.log(`Cache hit for "${cacheKey}"`);
    return cached.result;
  }

  const query = keywords.length > 0 ? keywords.join(' ') : 'developer';
  const searchUrl = `https://www.reddit.com/r/forhire/search/?q=${encodeURIComponent(
    query,
  )}&restrict_sr=on&sort=new`;

  try {
    const client = new ApifyClient({ token: apifyToken });

    const input = {
      startUrls: [{ url: searchUrl }],
      skipComments: true,
      skipUserPosts: true,
      skipCommunity: true,
      ignoreStartUrls: false,
      searchPosts: true,
      searchComments: false,
      searchCommunities: false,
      searchUsers: false,
      sort: 'new',
      includeNSFW: false,
      maxItems: 1,
      maxPostCount: 1,
      maxComments: 0,
      maxCommunitiesCount: 0,
      maxUserCount: 0,
      scrollTimeout: 20,
      proxy: {
        useApifyProxy: true,
      },
      debugMode: false,
    };

    logger.log(`Calling Apify actor ${ACTOR_ID} with maxItems=1`);
    const run = await client
      .actor(ACTOR_ID)
      .call(input, { timeout: ACTOR_TIMEOUT_SEC });

    const { items } = await client.dataset(run.defaultDatasetId).listItems();

    if (!items || items.length === 0) {
      logger.warn(`Apify returned 0 items for query "${query}"`);
      cache.set(cacheKey, { expiresAt: Date.now() + CACHE_TTL_MS, result: null });
      return null;
    }

    const lead = normalizeApifyItem(items[0] as Record<string, unknown>);
    if (!lead) {
      logger.warn(`Apify item failed to normalize for query "${query}"`);
      cache.set(cacheKey, { expiresAt: Date.now() + CACHE_TTL_MS, result: null });
      return null;
    }

    cache.set(cacheKey, { expiresAt: Date.now() + CACHE_TTL_MS, result: lead });
    logger.log(`Apify fetched 1 real lead for query "${query}"`);
    return lead;
  } catch (err) {
    logger.warn(
      `Apify fetch failed: ${err instanceof Error ? err.message : 'unknown'}`,
    );
    cache.set(cacheKey, { expiresAt: Date.now() + CACHE_TTL_MS, result: null });
    return null;
  }
}

function normalizeApifyItem(
  raw: Record<string, unknown>,
): RealRedditLead | null {
  const url =
    pickString(raw, 'url') ??
    pickString(raw, 'permalink') ??
    pickString(raw, 'link');
  const title = pickString(raw, 'title');
  if (!url || !title) return null;

  const description =
    pickString(raw, 'body') ??
    pickString(raw, 'selftext') ??
    pickString(raw, 'text') ??
    pickString(raw, 'content');

  const author =
    pickString(raw, 'author') ??
    pickString(raw, 'username') ??
    pickString(raw, 'user');

  const subreddit =
    pickString(raw, 'subreddit') ??
    pickString(raw, 'community') ??
    'r/forhire';

  const upvotes =
    pickNumber(raw, 'upvotes') ??
    pickNumber(raw, 'score') ??
    pickNumber(raw, 'ups');
  const comments =
    pickNumber(raw, 'numberOfComments') ??
    pickNumber(raw, 'numComments') ??
    pickNumber(raw, 'commentCount') ??
    pickNumber(raw, 'comments');
  const created =
    pickString(raw, 'createdAt') ??
    pickString(raw, 'created') ??
    pickString(raw, 'createdAtIso');

  let postedHoursAgo: number | undefined;
  if (created) {
    const ts = Date.parse(created);
    if (!Number.isNaN(ts)) {
      postedHoursAgo = Math.max(
        0,
        Math.floor((Date.now() - ts) / (1000 * 60 * 60)),
      );
    }
  }

  const sub = subreddit.startsWith('r/') ? subreddit : `r/${subreddit}`;

  return {
    source_url: url,
    title: cleanRedditTitle(title),
    description: description ? description.slice(0, 600) : undefined,
    company: author ? `u/${author.replace(/^u\//, '')}` : undefined,
    metadata: {
      verified: true,
      subreddit: sub,
      ...(typeof upvotes === 'number' ? { upvotes } : {}),
      ...(typeof comments === 'number' ? { comments } : {}),
      ...(typeof postedHoursAgo === 'number'
        ? { posted_hours_ago: postedHoursAgo }
        : {}),
    },
  };
}

function cleanRedditTitle(raw: string): string {
  return raw
    .replace(/^\s*\[\s*HIRING\s*\]\s*/i, '')
    .replace(/^\s*HIRING:\s*/i, '')
    .trim()
    .slice(0, 200);
}

function pickString(o: Record<string, unknown>, k: string): string | undefined {
  const v = o[k];
  return typeof v === 'string' && v.trim().length > 0 ? v.trim() : undefined;
}

function pickNumber(o: Record<string, unknown>, k: string): number | undefined {
  const v = o[k];
  return typeof v === 'number' && Number.isFinite(v) ? v : undefined;
}
