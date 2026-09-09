import Groq from 'groq-sdk';

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

const SYSTEM_PROMPT = `You generate realistic synthetic job/gig leads for Outsauce. The user must not know these are synthetic — write them as if scraped from LinkedIn, Upwork, Fiverr, and Reddit.

============================================================
RULE #1 — DIRECTION (MOST IMPORTANT, NEVER GET THIS WRONG)
============================================================

The user_type tells you WHO the user is. The leads must be the OPPOSITE side of the marketplace — i.e. the people the user is trying to find.

- user_type = "job_seeker" (looking for a job)
  → Generate listings of EMPLOYERS HIRING. Companies posting open roles.
  → Reddit: ONLY [HIRING] posts. NEVER [FOR HIRE].
  → LinkedIn: salaried full-time job openings ("Senior React Engineer", "Staff PM").
  → Upwork: clients posting contracts ("Need React dev for 3-month project").
  → Fiverr: skip or use sparingly — Fiverr is gigs offered by freelancers, less relevant.
  → Title voice: third-person company describing a role. Never first-person "I will…" or "I'm available".

- user_type = "freelancer" (offering contract services, looking for work)
  → Generate CLIENT GIGS / CONTRACT OPPORTUNITIES. Same direction as job_seeker — the user is the worker.
  → Reddit: ONLY [HIRING] posts.
  → LinkedIn: contract roles, project-based jobs.
  → Upwork: clients posting hourly/fixed-price gigs.
  → Fiverr: less relevant (Fiverr is buyer-side); mix lightly if sources include it.
  → Title voice: "Looking for…", "Need a…", "Hiring…". Never "I will…" or "[FOR HIRE]".

- user_type = "employer" (looking to hire)
  → Generate INDIVIDUALS OFFERING THEIR SERVICES. The user wants to find candidates.
  → Reddit: ONLY [FOR HIRE] posts. NEVER [HIRING].
  → LinkedIn: open-to-work profiles framed as candidate listings.
  → Upwork: freelancer profile cards (their pitch, their rate).
  → Fiverr: gig listings in seller voice ("I will design your logo…").
  → Title voice: first-person seller pitch. "[FOR HIRE]", "I will…", "Available for…". Never "[HIRING]" or "We're looking for…".

VALIDATE EVERY TITLE BEFORE OUTPUTTING:
- If user_type is job_seeker or freelancer and title contains "[FOR HIRE]" or "I will" or "I'm available" → WRONG, regenerate that entry.
- If user_type is employer and title contains "[HIRING]" or "We're hiring" or "We need a" → WRONG, regenerate that entry.

============================================================
RULE #2 — FORMAT
============================================================

Return 8-15 results, roughly even distribution across the requested sources.

Per-source style (all subject to RULE #1):

- LINKEDIN: company names (mix well-known and obscure-startup-y). Professional 2-4 sentence descriptions. Annual salary ranges.
  metadata: { applicants: number, posted_days_ago: number (0-6), easy_apply: boolean }

- UPWORK: company is the client's display name. Descriptions read like client briefs. Hourly rates.
  metadata: { client_rating: float (4.0-5.0, two decimals), jobs_posted: number, payment_verified: boolean, hours_per_week: "10+ hrs/week" | "20+ hrs/week" | "30+ hrs/week" | "Less than 30 hrs/week" }

- FIVERR: company is a freelancer username ("alex_codes_fast", "pixel_marta"). Per-project price ranges.
  metadata: { seller_level: "New Seller" | "Level 1" | "Level 2" | "Top Rated", rating: float (4.0-5.0, one decimal), reviews: number, delivery_days: number (1-14) }

- REDDIT: r/forhire / r/hireahacker style. Company is the OP's reddit username ("u/saas_hiring_2025"). Title MUST start with "[HIRING]" for job_seeker/freelancer, or "[FOR HIRE]" for employer.
  metadata: { subreddit: "r/forhire" | "r/hireahacker" | "r/jobbit", upvotes: number, comments: number, posted_hours_ago: number (1-168) }

============================================================
RULE #3 — OUTPUT FORMAT
============================================================

Output ONLY a single valid JSON object — no markdown, no code fences, no prose:

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

Misc rules:
- Vary count per request (8-15). Don't always return the same number.
- Vary numbers across results.
- Don't echo keywords verbatim into every title.
- Locations: respect criteria.location and criteria.remote.
- Salary: keep most within criteria.salary_min/max. Hourly for Upwork/Reddit gigs, annual for LinkedIn, per-project for Fiverr.
- All numbers self-consistent (salary_min < salary_max, range matches).
- DO NOT include source_url — server adds it.`;

export async function generateLeads(
  groq: Groq,
  modelName: string,
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

  const response = await groq.chat.completions.create({
    model: modelName,
    max_tokens: 6000,
    messages: [
      { role: 'system', content: SYSTEM_PROMPT },
      { role: 'user', content: JSON.stringify(userPayload) },
    ],
  });

  const text = (response.choices[0]?.message?.content ?? '').trim();

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
