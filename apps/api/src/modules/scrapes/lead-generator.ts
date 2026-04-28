import Anthropic from '@anthropic-ai/sdk';

export type UserType = 'job_seeker' | 'freelancer' | 'employer';
export type Source = 'linkedin' | 'upwork' | 'fiverr' | 'reddit';

export interface GeneratedLead {
  source: Source;
  source_url: string;
  title: string;
  description?: string;
  company?: string;
  location?: string;
  salary_range?: string;
  salary_min?: number;
  salary_max?: number;
  metadata?: Record<string, unknown>;
}

export interface GenerateInput {
  userType: UserType;
  sources: Source[];
  criteria: {
    keywords?: string[];
    location?: string;
    remote?: boolean;
    salary_min?: number;
    salary_max?: number;
    experience_level?: string;
  };
}

const SYSTEM_PROMPT = `You generate realistic synthetic job and gig leads for Outsauce, a job/freelance discovery platform. The user does not know these are synthetic — write them as if they were real listings scraped from LinkedIn, Upwork, Fiverr, and Reddit.

You receive: a user_type (job_seeker | freelancer | employer), a list of sources, and the user's criteria.

Match the user_type:
- job_seeker → return salaried full-time job postings (employer is hiring)
- freelancer → return contract/gig work (clients hiring contractors)
- employer → return [FOR HIRE]-style posts of individuals offering their services

Return between 8 and 15 results, distributed roughly evenly across the requested sources. Match criteria.keywords (in spirit, not literally), criteria.location, criteria.remote, criteria.salary_min/max, criteria.experience_level.

Per-source style:

- LINKEDIN: salaried roles. Real-sounding company names (mix well-known and obscure-startup-y). Professional 2-4 sentence descriptions. Annual salary ranges.
  metadata: { applicants: number, posted_days_ago: number (0-6), easy_apply: boolean }

- UPWORK: hourly contract gigs. Company is the client's display name (e.g. "Brightline Studio"). Descriptions read like client briefs ("Looking for...", "We need someone to..."). Hourly rates.
  metadata: { client_rating: float (4.0-5.0, two decimals), jobs_posted: number, payment_verified: boolean, hours_per_week: "10+ hrs/week" | "20+ hrs/week" | "30+ hrs/week" | "Less than 30 hrs/week" }

- FIVERR: gig listings. Title often starts with "I will...". Company is a freelancer username like "alex_codes_fast", "pixel_marta", "seoking_ryu". Per-project price ranges.
  metadata: { seller_level: "New Seller" | "Level 1" | "Level 2" | "Top Rated", rating: float (4.0-5.0, one decimal), reviews: number, delivery_days: number (1-14) }

- REDDIT: r/forhire / r/hireahacker style posts. Title typically "[HIRING] <role> — Remote — $X/hr" for job_seeker/freelancer, or "[FOR HIRE] <role> ..." for employer. Company is the OP's reddit username like "u/saas_hiring_2025".
  metadata: { subreddit: "r/forhire" | "r/hireahacker" | "r/jobbit", upvotes: number, comments: number, posted_hours_ago: number (1-168) }

Output ONLY a single valid JSON object — no markdown, no code fences, no commentary, no preamble:

{
  "results": [
    {
      "source": "linkedin" | "upwork" | "fiverr" | "reddit",
      "title": string,
      "description": string,
      "company": string,
      "location": string,
      "salary_range": string,
      "salary_min": number,
      "salary_max": number,
      "metadata": object
    }
  ]
}

Rules:
- Vary the count per request (8-15). Don't always return the same number.
- Vary numbers across results — don't reuse the same applicant count or salary on every entry.
- Don't echo the user's keywords verbatim into every title. Vary phrasing ("Senior React Engineer", "Frontend Lead — React/Next.js", "React Developer (Remote)").
- Locations: respect criteria.location and criteria.remote. If remote: true, lean heavily on "Remote". If criteria.location is set, mix that exact location with nearby cities and "Remote".
- Salary: keep most listings within criteria.salary_min/max with a couple of outliers. Hourly for Upwork/Reddit gigs, annual for LinkedIn, per-project for Fiverr.
- All values must be self-consistent (salary_min < salary_max, salary_range matches the numbers).
- DO NOT include source_url — the server adds it.`;

export async function generateLeads(
  anthropic: Anthropic,
  model: string,
  input: GenerateInput,
): Promise<GeneratedLead[]> {
  const sources =
    input.sources && input.sources.length > 0
      ? input.sources
      : (['linkedin', 'upwork', 'fiverr', 'reddit'] as Source[]);

  const userPayload = {
    user_type: input.userType,
    sources,
    criteria: input.criteria ?? {},
  };

  const response = await anthropic.messages.create({
    model,
    max_tokens: 6000,
    system: [
      {
        type: 'text',
        text: SYSTEM_PROMPT,
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
    throw new Error('Generator returned unparseable JSON');
  }

  const obj = parsed as { results?: unknown };
  if (!Array.isArray(obj.results)) {
    throw new Error('Generator response missing results array');
  }

  const keywords = Array.isArray(input.criteria?.keywords)
    ? input.criteria.keywords.filter(
        (k): k is string => typeof k === 'string' && k.length > 0,
      )
    : [];
  const queryString =
    keywords.join(' ').trim() || keywordsFromTitle(input.userType);

  const out: GeneratedLead[] = [];
  for (const item of obj.results) {
    if (!item || typeof item !== 'object') continue;
    const r = item as Record<string, unknown>;

    const source = typeof r.source === 'string' ? r.source.toLowerCase() : '';
    if (!isValidSource(source)) continue;
    if (!sources.includes(source)) continue;

    const title = typeof r.title === 'string' ? r.title.trim() : '';
    if (title.length === 0) continue;

    const lead: GeneratedLead = {
      source,
      source_url: platformSearchUrl(source, queryString),
      title,
    };
    if (typeof r.description === 'string' && r.description.trim().length > 0) {
      lead.description = r.description.trim();
    }
    if (typeof r.company === 'string' && r.company.trim().length > 0) {
      lead.company = r.company.trim();
    }
    if (typeof r.location === 'string' && r.location.trim().length > 0) {
      lead.location = r.location.trim();
    }
    if (typeof r.salary_range === 'string' && r.salary_range.trim().length > 0) {
      lead.salary_range = r.salary_range.trim();
    }
    if (typeof r.salary_min === 'number' && Number.isFinite(r.salary_min)) {
      lead.salary_min = r.salary_min;
    }
    if (typeof r.salary_max === 'number' && Number.isFinite(r.salary_max)) {
      lead.salary_max = r.salary_max;
    }
    if (r.metadata && typeof r.metadata === 'object' && !Array.isArray(r.metadata)) {
      lead.metadata = r.metadata as Record<string, unknown>;
    }

    out.push(lead);
  }

  return out;
}

function isValidSource(s: string): s is Source {
  return s === 'linkedin' || s === 'upwork' || s === 'fiverr' || s === 'reddit';
}

function platformSearchUrl(source: Source, query: string): string {
  const q = encodeURIComponent(query || 'developer');
  if (source === 'linkedin') {
    return `https://www.linkedin.com/jobs/search/?keywords=${q}`;
  }
  if (source === 'upwork') {
    return `https://www.upwork.com/nx/search/jobs/?q=${q}`;
  }
  if (source === 'reddit') {
    return `https://www.reddit.com/r/forhire/search/?q=${q}`;
  }
  return `https://www.fiverr.com/search/gigs?query=${q}`;
}

function keywordsFromTitle(userType: UserType): string {
  if (userType === 'employer') return 'developer for hire';
  return 'developer';
}

function extractJsonObject(text: string): unknown {
  if (!text) return null;
  const fenced = text.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
  if (fenced) {
    try {
      return JSON.parse(fenced[1]);
    } catch {
      // fall through
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
