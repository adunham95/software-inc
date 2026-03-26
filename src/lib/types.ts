export type ProjectType = 'browser_ext' | 'mobile_app' | 'saas' | 'desktop_app' | 'ai_product';

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

	weekStarted: number;
	weekShipped: number | null;
	techRequired: string[];
}

export interface ResearchNode {
	id: string;
	name: string;
	description: string;
	weeksToComplete: number;
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
}
