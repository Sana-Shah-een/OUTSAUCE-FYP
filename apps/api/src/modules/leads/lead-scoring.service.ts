import { Injectable, Logger } from '@nestjs/common';
import Groq from 'groq-sdk';

export interface LeadInput {
  title: string;
  description: string;
  source: string;
}

export interface ProfileInput {
  resume_text: string;
  target_roles: string[];
  skills: string[];
}

export interface ScoreResult {
  score: number | null;
  reasoning: string;
}

@Injectable()
export class LeadScoringService {
  private readonly logger = new Logger(LeadScoringService.name);
  private groq: Groq | null = null;

  constructor() {
    const apiKey = process.env.GROQ_API_KEY;
    if (apiKey) {
      this.groq = new Groq({ apiKey });
    } else {
      this.logger.warn('GROQ_API_KEY not set in environment; lead scoring will return null.');
    }
  }

  private getGroqClient(): Groq | null {
    if (!this.groq) {
      const apiKey = process.env.GROQ_API_KEY;
      if (apiKey) {
        this.groq = new Groq({ apiKey });
      }
    }
    return this.groq;
  }

  async scoreLead(lead: LeadInput, profile: ProfileInput, retries = 3): Promise<ScoreResult> {
    const groq = this.getGroqClient();
    if (!groq) {
      return { score: null, reasoning: 'GROQ_API_KEY missing' };
    }

    const prompt = this.buildPrompt(lead, profile);
    const model = process.env.GROQ_MODEL || 'qwen/qwen3-32b';

    for (let attempt = 0; attempt <= retries; attempt++) {
      try {
        const completion = await groq.chat.completions.create({
          model,
          messages: [{ role: 'user', content: prompt }],
          response_format: { type: 'json_object' },
          temperature: 0.3,
          max_tokens: 200,
        });

        const text = completion.choices[0]?.message?.content ?? '{}';
        const parsed = JSON.parse(text);

        if (typeof parsed.score !== 'number' || parsed.score < 0 || parsed.score > 100) {
          throw new Error('Invalid score value in response');
        }

        return {
          score: Math.round(parsed.score),
          reasoning: typeof parsed.reasoning === 'string' ? parsed.reasoning : '',
        };
      } catch (err: any) {
        const isRateLimit = err?.status === 429 || err?.message?.includes('429');
        if (isRateLimit && attempt < retries) {
          const delay = 1000 * Math.pow(2, attempt); // exponential backoff: 1s, 2s, 4s
          this.logger.warn(`Rate limited, retrying in ${delay}ms (attempt ${attempt + 1})`);
          await new Promise((res) => setTimeout(res, delay));
          continue;
        }
        this.logger.error(`Scoring failed for lead "${lead.title}": ${err?.message || err}`);
        return { score: null, reasoning: 'Scoring failed' };
      }
    }

    return { score: null, reasoning: 'Scoring failed after retries' };
  }

  private buildPrompt(lead: LeadInput, profile: ProfileInput): string {
    const roles = Array.isArray(profile.target_roles) ? profile.target_roles.join(', ') : '';
    const skills = Array.isArray(profile.skills) ? profile.skills.join(', ') : '';
    const resume = typeof profile.resume_text === 'string' ? profile.resume_text.slice(0, 1000) : '';

    return `You are scoring how well a job/gig listing matches a candidate's profile.

CANDIDATE PROFILE:
Target roles: ${roles}
Skills: ${skills}
Resume summary: ${resume}

LISTING (from ${lead.source || 'unknown'}):
Title: ${lead.title || ''}
Description: ${(lead.description || '').slice(0, 1500)}

Score this listing's fit for the candidate from 0-100 based on skill match, role alignment, and seniority fit.
Respond ONLY with valid JSON, no markdown, no preamble:
{"score": <number>, "reasoning": "<one sentence, under 20 words>"}`;
  }
}
