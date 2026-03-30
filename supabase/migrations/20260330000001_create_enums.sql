CREATE TYPE user_type AS ENUM ('job_seeker', 'freelancer', 'employer');
CREATE TYPE scrape_source AS ENUM ('linkedin', 'upwork', 'fiverr', 'reddit');
CREATE TYPE scrape_status AS ENUM ('pending', 'running', 'completed', 'failed', 'cancelled');
CREATE TYPE lead_status AS ENUM ('new', 'contacted', 'in_progress', 'closed', 'archived');
CREATE TYPE ai_tool_type AS ENUM ('bio', 'resume', 'cover_letter', 'gig_description', 'profile_summary');
CREATE TYPE plan_tier AS ENUM ('free', 'starter', 'pro', 'enterprise');
CREATE TYPE message_status AS ENUM ('sent', 'delivered', 'read');
CREATE TYPE export_format AS ENUM ('csv', 'json', 'pdf');
