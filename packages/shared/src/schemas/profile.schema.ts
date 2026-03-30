import { z } from 'zod';

export const onboardingSchema = z.object({
  user_type: z.enum(['job_seeker', 'freelancer', 'employer']),
  full_name: z.string().min(1).max(100),
  headline: z.string().max(200).optional(),
  bio: z.string().max(2000).optional(),
  interests: z.array(z.string().min(1).max(50)).max(20).default([]),
  skills: z.array(z.string().min(1).max(50)).max(30).default([]),
  location: z.string().max(100).optional(),
  linkedin_url: z.string().url().optional().or(z.literal('')),
  website_url: z.string().url().optional().or(z.literal('')),
});

export const updateProfileSchema = onboardingSchema.partial();

export type OnboardingInput = z.infer<typeof onboardingSchema>;
export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;
