export type { Profile, UserType } from './types/user';
export type { ScrapeJob, ScrapeResult, ScrapeSource, ScrapeStatus, ScrapeCriteria } from './types/scrape';
export type { Lead, LeadFolder, Tag, LeadStatus } from './types/lead';
export type { Conversation, ConversationParticipant, Message, MessageStatus } from './types/message';
export type { Subscription, Usage, PlanLimits, PlanTier } from './types/billing';
export type { Connection, ConnectionStatus } from './types/network';

export { onboardingSchema, updateProfileSchema } from './schemas/profile.schema';
export type { OnboardingInput, UpdateProfileInput } from './schemas/profile.schema';
export { createScrapeSchema } from './schemas/scrape.schema';
export type { CreateScrapeInput } from './schemas/scrape.schema';
export { createLeadSchema, bulkCreateLeadSchema, updateLeadSchema } from './schemas/lead.schema';
export type { CreateLeadInput, BulkCreateLeadInput, UpdateLeadInput } from './schemas/lead.schema';

export { PLAN_LIMITS, isWithinLimit } from './constants/plans';
export { SCRAPE_SOURCES } from './constants/sources';
export type { SourceMeta } from './constants/sources';
