export type ProjectType =
	| 'api'
	| 'basic_website'
	| 'browser_ext'
	| 'mobile_app'
	| 'saas'
	| 'desktop_app'
	| 'ai_product';

export type ProjectCategory =
	// Basic Website
	| 'blog'
	| 'news'
	| 'portfolio'
	| 'landing_page'
	| 'community_forum'
	// Mobile App
	| 'dating'
	| 'chat'
	| 'entertainment'
	| 'fitness'
	| 'education'
	// SaaS Tool
	| 'productivity'
	| 'crm'
	| 'analytics'
	| 'devtools'
	| 'finance'
	// Desktop App (productivity shared with SaaS)
	| 'video_game'
	| 'media_player'
	| 'developer_tool'
	| 'security'
	// Browser Extension (productivity shared, developer distinct from devtools)
	| 'privacy'
	| 'shopping'
	| 'developer'
	| 'social'
	// AI Product
	| 'writing_assistant'
	| 'code_assistant'
	| 'image_generation'
	| 'data_analysis'
	| 'customer_support';

export interface ProjectFeature {
	id: string;
	name: string;
	description: string;
	wuCost: number;
	revenueBoost: number;
	qualityBoost: number;
	status: 'not_started' | 'in_progress' | 'complete';
	progressWu: number;
	unlockRequires: string[];
}

export interface Bug {
	id: string;
	weekDiscovered: number;
	severity: 'minor' | 'major' | 'critical';
	description: string;
	revenueImpact: number;
	fixed: boolean;
}

export interface PatchJob {
	projectId: string;
	wuRequired: number;
	wuInvested: number;
	bugIdsToFix: string[];
	weekStarted: number;
}

export type MarketingLevel = 'none' | 'low' | 'medium' | 'high';

export type CampaignType =
	| 'social_media_blitz'
	| 'press_release'
	| 'influencer_deal'
	| 'product_hunt_launch'
	| 'paid_ads'
	| 'content_marketing';

export interface CampaignEffect {
	growthMultiplier: number;
	decayReduction: number;
	durationWeeks: number;
}

export interface Campaign {
	id: string;
	type: CampaignType;
	wuRequired: number;
	wuInvested: number;
	cashCost: number;
	weekStarted: number;
	effect: CampaignEffect;
	weeksRemaining: number | null;
}

export interface MarketingState {
	passiveLevel: MarketingLevel;
	activeCampaign: Campaign | null;
	campaignHistory: CampaignType[];
}

export type ApiCategory =
	| 'social_network'
	| 'developer_platform'
	| 'ecommerce'
	| 'media_streaming'
	| 'productivity_suite'
	| 'fintech';

export interface Platform {
	id: string;
	name: string;
	description: string;
	weekCreated: number;
	apiCategory: ApiCategory;
	pricePerCall: number;

	apiProjectId: string | null;
	subProductIds: string[];

	sharedUsers: number;
	weeklyNewUsers: number;
	weeklyChurnedUsers: number;

	brandStrength: number;
	marketingBonus: number;

	status: 'building' | 'live' | 'degraded' | 'offline';
}

export interface Project {
	id: string;
	name: string;
	type: ProjectType;
	category: ProjectCategory | null;
	status: 'in_development' | 'shipped' | 'dead' | 'archived' | 'cancelled';

	// Platform fields
	platformId: string | null;
	isPlatformApi: boolean;
	isLandingPage: boolean;
	platformBonus: number;

	pricingModel: 'one_time' | 'subscription';
	price: number;

	progress: number;
	totalWuRequired: number;
	quality: number;
	bugsFound: number;
	bugsFixed: number;

	features: ProjectFeature[];

	weeklyRevenue: number;
	adRevenue: number;
	activeSubscribers: number;
	revenueDecayRate: number;
	weeksOnMarket: number;
	totalRevenue: number;
	revenueHistory: number[];

	// Hosting
	hostingType: 'external' | 'self' | 'none';
	hostingCostPerWeek: number;
	hostingWuDrainPerWeek: number;

	// Bug tracking
	bugs: Bug[];
	bugAccumulator: number;
	totalBugsFixed: number;
	lastPatchedWeek: number | null;

	// Version / lineage
	version: string;
	parentProjectId: string | null;
	isMajorRelease: boolean;
	archivedWeek: number | null;

	weekStarted: number;
	weekShipped: number | null;
	techRequired: string[];

	marketing: MarketingState;
}

export interface ResearchNode {
	id: string;
	name: string;
	description: string;
	weeksToComplete: number;
	upfrontCost: number;
	unlocks: string;
	requires: string[];
	category: 'frontend' | 'backend' | 'mobile' | 'ai' | 'infrastructure';
}

export interface ResearchState {
	completed: string[];
	inProgress: string | null;
	progressWu: number;
	tree: ResearchNode[];
}

export interface Notification {
	id: string;
	week: number;
	message: string;
	type: 'success' | 'warning' | 'info' | 'danger';
}

export type LaptopTier = 1 | 2 | 3 | 4 | 5;
export type SelfCostTier = 'bedroom' | 'apartment' | 'home_office' | 'coworking';

export interface ExpenseState {
	laptopTier: LaptopTier;
	selfCostTier: SelfCostTier;
	weeklySelfCost: number;
}

export interface GameState {
	meta: {
		companyName: string;
		week: number;
		year: number;
		cash: number;
		reputation: number;
		totalEarned: number;
	};
	projects: Project[];
	platforms: Platform[];
	research: ResearchState;
	notifications: Notification[];
	expenses: ExpenseState;
	pendingHostingChoiceId: string | null;
	activePatchJobs: PatchJob[];
}
