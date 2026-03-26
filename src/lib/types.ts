export type ProjectType =
	| 'basic_website'
	| 'browser_ext'
	| 'mobile_app'
	| 'saas'
	| 'desktop_app'
	| 'ai_product';

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

export interface Project {
	id: string;
	name: string;
	type: ProjectType;
	status: 'in_development' | 'shipped' | 'cancelled';

	pricingModel: 'one_time' | 'subscription';
	price: number;

	progress: number;
	totalWuRequired: number;
	quality: number;
	bugsFound: number;
	bugsFixed: number;

	features: ProjectFeature[];

	weeklyRevenue: number;
	activeSubscribers: number;
	revenueDecayRate: number;
	weeksOnMarket: number;
	totalRevenue: number;
	revenueHistory: number[];

	// Hosting
	hostingType: 'external' | 'self' | 'none';
	hostingCostPerWeek: number; // $0 if self-hosted or none
	hostingWuDrainPerWeek: number; // 0 if external or none

	weekStarted: number;
	weekShipped: number | null;
	techRequired: string[];
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
	research: ResearchState;
	notifications: Notification[];
	expenses: ExpenseState;
	pendingHostingChoiceId: string | null;
}
