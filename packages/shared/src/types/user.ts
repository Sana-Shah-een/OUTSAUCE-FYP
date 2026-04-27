export type UserType = 'job_seeker' | 'freelancer' | 'employer';

export interface Profile {
  id: string;
  email: string;
  full_name: string | null;
  avatar_url: string | null;
  user_type: UserType;
  headline: string | null;
  bio: string | null;
  interests: string[];
  skills: string[];
  location: string | null;
  linkedin_url: string | null;
  website_url: string | null;
  is_discoverable: boolean;
  onboarding_completed: boolean;
  is_admin: boolean;
  created_at: string;
  updated_at: string;
}
