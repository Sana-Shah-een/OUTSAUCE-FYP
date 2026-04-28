import Anthropic from '@anthropic-ai/sdk';
import type { AggregatedHit } from './lead-aggregator';

export type UserType = 'job_seeker' | 'freelancer' | 'employer';

export interface ValidationCriteria {
  keywords?: string[];
  location?: string;
  remote?: boolean;
  salary_min?: number;
  salary_max?: number;
  experience_level?: string;
}

export interface ValidatedLead {
  hit: AggregatedHit;
  title: string;
  description: string;
  location?: string;
  company?: string;
  salary_min?: number;
  salary_max?: number;
  salary_range?: string;
  experience_level?: string;
}

const CONCURRENCY = 20;
const MAX_CANDIDATES = 60;

export async function validateCandidates(
  anthropic: Anthropic,
  model: string,
  candidates: AggregatedHit[],
  userType: UserType,
  criteria: ValidationCriteria,
): Promise<{ validated: ValidatedLead[]; rejectionLog: string[] }> {
  const pool = candidates.slice(0, MAX_CANDIDATES);
  const validated: ValidatedLead[] = [];
  const rejectionLog: string[] = [];

  let cursor = 0;
  async function worker() {
    while (cursor < pool.length) {
      const i = cursor++;
      const hit = pool[i];
      try {
        const result = await validateOne(anthropic, model, hit, userType, criteria);
        if (result.passes && result.lead) {
          validated.push(result.lead);
        } else {
          rejectionLog.push(`${hit.url}: ${result.reason ?? 'no reason'}`);
        }
      } catch (err) {
        rejectionLog.push(
          `${hit.url}: validation error: ${err instanceof Error ? err.message : 'unknown'}`,
        );
      }
    }
  }

  const workers = Array.from(
    { length: Math.min(CONCURRENCY, pool.length) },
    () => worker(),
  );
  await Promise.all(workers);

  return { validated, rejectionLog };
}

interface ValidateOneResult {
  passes: boolean;
  reason?: string;
  lead?: ValidatedLead;
}

async function validateOne(
  anthropic: Anthropic,
  model: string,
  hit: AggregatedHit,
  userType: UserType,
  criteria: ValidationCriteria,
): Promise<ValidateOneResult> {
  const userPayload = {
    user_type: userType,
    criteria,
    candidate: {
      origin: hit.origin,
      title: hit.title,
      body: (hit.description ?? '').slice(0, 1500),
      author: hit.author ?? null,
    },
  };

  const response = await anthropic.messages.create({
    model,
    max_tokens: 800,
    system: [
      {
        type: 'text',
        text: VALIDATOR_SYSTEM_PROMPT,
        cache_control: { type: 'ephemeral' },
      },
    ],
    messages: [{ role: 'user', content: JSON.stringify(userPayload) }],
  });

  const text = response.content
    .filter((b): b is Anthropic.TextBlock => b.type === 'text')
    .map((b) => b.text)
    .join('\n')
    .trim();

  const parsed = extractJsonObject(text);
  if (!parsed || typeof parsed !== 'object') {
    return { passes: false, reason: 'parse_error' };
  }

  const v = parsed as {
    passes?: unknown;
    reject_reason?: unknown;
    title?: unknown;
    description?: unknown;
    location?: unknown;
    company?: unknown;
    salary_min?: unknown;
    salary_max?: unknown;
    salary_range?: unknown;
    experience_level?: unknown;
  };

  if (v.passes !== true) {
    return {
      passes: false,
      reason: typeof v.reject_reason === 'string' ? v.reject_reason : 'rejected',
    };
  }

  const title = typeof v.title === 'string' && v.title.trim().length > 0
    ? v.title.trim()
    : hit.title;
  const description = typeof v.description === 'string'
    ? v.description.trim()
    : hit.description ?? '';

  const lead: ValidatedLead = {
    hit,
    title,
    description,
  };
  if (typeof v.location === 'string' && v.location.trim().length > 0) {
    lead.location = v.location.trim();
  }
  if (typeof v.company === 'string' && v.company.trim().length > 0) {
    lead.company = v.company.trim();
  }
  if (typeof v.salary_min === 'number' && Number.isFinite(v.salary_min)) {
    lead.salary_min = v.salary_min;
  }
  if (typeof v.salary_max === 'number' && Number.isFinite(v.salary_max)) {
    lead.salary_max = v.salary_max;
  }
  if (typeof v.salary_range === 'string' && v.salary_range.trim().length > 0) {
    lead.salary_range = v.salary_range.trim();
  }
  if (
    typeof v.experience_level === 'string' &&
    v.experience_level.trim().length > 0
  ) {
    lead.experience_level = v.experience_level.trim();
  }

  return { passes: true, lead };
}

const VALIDATOR_SYSTEM_PROMPT = `You are a lead validator for Outsauce, a job/gig discovery platform. You receive ONE candidate listing scraped from Reddit or Hacker News, plus the user's profile and criteria. You decide whether the listing is worth showing the user, and if so, you extract clean structured fields.

You output a SINGLE JSON object — no prose, no code fences, no commentary. Just JSON.

Schema:
{
  "passes": boolean,
  "reject_reason": string,    // required when passes is false. Short reason like "off_niche", "wrong_listing_direction", "location_mismatch", "remote_mismatch", "not_a_job_post", "stale", "spam".
  "title": string,            // required when passes is true. Cleaned, no "[HIRING]" prefix, ≤140 chars.
  "description": string,      // required when passes is true. Cleaned, paragraph-formatted, ≤600 chars.
  "location": string | null,  // extracted from the listing text. "Remote" if remote-only, otherwise the city/country/region named. null if none mentioned.
  "company": string | null,   // company name OR poster handle if individual.
  "salary_min": number | null,
  "salary_max": number | null,
  "salary_range": string | null, // human-readable like "$80/hr" or "$120k – $160k".
  "experience_level": "entry" | "mid" | "senior" | "lead" | "executive" | null
}

ABSOLUTE RULES:
- Never fabricate data. Every value MUST come from the candidate's title or body. If a field isn't stated, return null.
- Do not change numbers, company names, locations, or technology names from the source text.
- Cleanup is allowed: strip "[HIRING]" / "[FOR HIRE]" / "HIRING:" prefixes, fix capitalization, drop signature filler ("DM me", "thanks!"), reformat markdown into clean paragraphs.

HARD REJECT RULES (return passes: false):

1. WRONG LISTING DIRECTION:
   - If user_type is "job_seeker" or "freelancer", listing MUST be someone offering work (an employer hiring). Reject [FOR HIRE] / "I'm available" / "looking for clients" posts. reject_reason: "wrong_listing_direction".
   - If user_type is "employer", listing MUST be someone offering their services / [FOR HIRE]. Reject [HIRING] posts. reject_reason: "wrong_listing_direction".

2. NOT A JOB/GIG POST:
   - Reject meta posts, advice questions, news articles, project showcases, "how do I" questions, deleted posts. reject_reason: "not_a_job_post".

3. OFF-NICHE:
   - Infer the user's niche from criteria.keywords. Reject listings clearly outside that field. (Example: criteria.keywords includes "react" or "frontend" → reject "Plumber needed" or "Looking for a virtual assistant for data entry".)
   - If criteria.keywords is empty, skip this check.
   - reject_reason: "off_niche".

4. LOCATION MISMATCH (only if criteria.location is set AND non-empty):
   - If the listing is on-site and explicitly in a different city/country than criteria.location, reject. reject_reason: "location_mismatch".
   - If the listing's location restriction excludes the user's location (e.g., "US-only" when user is in EU), reject. reject_reason: "location_mismatch".
   - If the listing is silent on location, do NOT reject — that's a soft signal.

5. REMOTE MISMATCH:
   - If criteria.remote is true and the listing is explicitly on-site only (no remote option mentioned), reject. reject_reason: "remote_mismatch".
   - If criteria.remote is false, do not reject remote listings — they're still valid.

6. SPAM / LOW QUALITY:
   - Reject single-sentence posts with no substance, MLM/get-rich-quick schemes, obvious scams. reject_reason: "spam".

SOFT SIGNALS (do not auto-reject; just preferences):
- Salary range overlap with criteria.salary_min/max: nice but listings often omit salary. Don't reject for missing/low salary alone.
- Experience level match: don't reject seniority mismatches alone.
- Tech stack specificity: a listing matching the niche but using a different stack (e.g. Vue when user wants React) is still acceptable.

When passes is true, the reject_reason field can be omitted.
When passes is false, all extraction fields can be omitted.

Output ONLY the JSON object.`;

function extractJsonObject(text: string): unknown {
  if (!text) return null;
  const fenced = text.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
  if (fenced) {
    try {
      return JSON.parse(fenced[1]);
    } catch {
    }
  }

  const firstBrace = text.indexOf('{');
  if (firstBrace === -1) return null;

  let depth = 0;
  let inString = false;
  let escape = false;

  for (let i = firstBrace; i < text.length; i++) {
    const ch = text[i];
    if (escape) {
      escape = false;
      continue;
    }
    if (ch === '\\' && inString) {
      escape = true;
      continue;
    }
    if (ch === '"') {
      inString = !inString;
      continue;
    }
    if (inString) continue;

    if (ch === '{') depth++;
    else if (ch === '}') {
      depth--;
      if (depth === 0) {
        const candidate = text.slice(firstBrace, i + 1);
        try {
          return JSON.parse(candidate);
        } catch {
          return null;
        }
      }
    }
  }
  return null;
}
