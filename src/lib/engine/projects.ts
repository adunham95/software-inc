import type { ProjectFeature, ProjectType, LaptopTier } from '$lib/types';

export const PROJECT_TYPES: Record<
	ProjectType,
	{ label: string; baseWu: number; requires: string[]; laptopTierMin: LaptopTier }
> = {
	basic_website: { label: 'Basic Website', baseWu: 8, requires: [], laptopTierMin: 1 },
	browser_ext: { label: 'Browser Extension', baseWu: 10, requires: [], laptopTierMin: 1 },
	mobile_app: { label: 'Mobile App', baseWu: 30, requires: ['mobile_dev'], laptopTierMin: 2 },
	saas: { label: 'SaaS Tool', baseWu: 40, requires: ['web_basics'], laptopTierMin: 2 },
	desktop_app: { label: 'Desktop App', baseWu: 35, requires: ['web_basics'], laptopTierMin: 2 },
	ai_product: { label: 'AI Product', baseWu: 60, requires: ['ai_features'], laptopTierMin: 4 }
};

export const PRICE_RANGES: Record<
	ProjectType,
	{ oneTime: [number, number]; subscription: [number, number] }
> = {
	basic_website: { oneTime: [1, 10], subscription: [1, 5] },
	browser_ext: { oneTime: [1, 15], subscription: [1, 5] },
	mobile_app: { oneTime: [2, 20], subscription: [3, 15] },
	saas: { oneTime: [50, 500], subscription: [10, 99] },
	desktop_app: { oneTime: [10, 100], subscription: [5, 30] },
	ai_product: { oneTime: [20, 200], subscription: [15, 150] }
};

// Hosting costs per product type (external = $/wk, self = WU/wk)
export const HOSTING_EXTERNAL_COST: Partial<Record<ProjectType, number>> = {
	mobile_app: 150,
	saas: 400,
	desktop_app: 100,
	ai_product: 1200
};

export const HOSTING_WU_DRAIN: Partial<Record<ProjectType, number>> = {
	mobile_app: 1,
	saas: 2,
	desktop_app: 1,
	ai_product: 4
};

// Types that need hosting (browser_ext has 'none')
export const NEEDS_HOSTING: ProjectType[] = ['mobile_app', 'saas', 'desktop_app', 'ai_product'];

// Laptop tier definitions
export const LAPTOP_TIERS: Record<
	LaptopTier,
	{ name: string; wuPerWeek: number; purchasePrice: number; description: string }
> = {
	1: { name: 'Old Laptop', wuPerWeek: 5, purchasePrice: 0, description: 'Starting equipment' },
	2: { name: 'Mid-Range Laptop', wuPerWeek: 7, purchasePrice: 1500, description: 'Decent speed' },
	3: { name: 'Pro Laptop', wuPerWeek: 10, purchasePrice: 4000, description: 'Professional grade' },
	4: {
		name: 'Dev Workstation',
		wuPerWeek: 14,
		purchasePrice: 12000,
		description: 'Peak performance'
	},
	5: {
		name: 'Ultra Workstation',
		wuPerWeek: 20,
		purchasePrice: 30000,
		description: 'Ultra performance'
	}
};

// Self-cost tier definitions
export const SELF_COST_TIERS = {
	bedroom: {
		label: 'Bedroom Startup',
		weeklyCost: 200,
		emoji: '🛏️',
		flavour: 'Living with parents, ramen diet'
	},
	apartment: {
		label: 'Solo Apartment',
		weeklyCost: 600,
		emoji: '🏠',
		flavour: 'Your own place, basic setup'
	},
	home_office: {
		label: 'Home Office',
		weeklyCost: 1200,
		emoji: '💻',
		flavour: 'Decent desk, fast internet, coffee machine'
	},
	coworking: {
		label: 'Coworking Space',
		weeklyCost: 2500,
		emoji: '☕',
		flavour: 'Hot desk, networking events, free oat milk'
	}
} as const;

type FeatureTemplate = Omit<ProjectFeature, 'status' | 'progressWu'>;

export const FEATURE_POOLS: Record<ProjectType, FeatureTemplate[]> = {
	basic_website: [
		{
			id: 'bw_landing',
			name: 'Landing Page',
			description: 'A polished homepage that converts visitors.',
			wuCost: 3,
			revenueBoost: 5,
			qualityBoost: 5,
			unlockRequires: []
		},
		{
			id: 'bw_contact',
			name: 'Contact Form',
			description: 'Let visitors get in touch directly.',
			wuCost: 2,
			revenueBoost: 5,
			qualityBoost: 3,
			unlockRequires: []
		},
		{
			id: 'bw_blog',
			name: 'Blog',
			description: 'Publish articles to drive organic traffic.',
			wuCost: 4,
			revenueBoost: 15,
			qualityBoost: 5,
			unlockRequires: []
		},
		{
			id: 'bw_seo',
			name: 'SEO Optimization',
			description: 'Rank higher in search engines.',
			wuCost: 3,
			revenueBoost: 15,
			qualityBoost: 6,
			unlockRequires: ['web_basics']
		},
		{
			id: 'bw_dark',
			name: 'Dark Mode',
			description: 'A sleek dark theme option.',
			wuCost: 2,
			revenueBoost: 2,
			qualityBoost: 5,
			unlockRequires: ['ui_ux']
		},
		{
			id: 'bw_analytics',
			name: 'Analytics',
			description: 'Track visitor behavior and traffic sources.',
			wuCost: 3,
			revenueBoost: 10,
			qualityBoost: 4,
			unlockRequires: ['web_basics']
		}
	],
	browser_ext: [
		{
			id: 'be_popup_ui',
			name: 'Popup UI',
			description: 'A polished popup interface.',
			wuCost: 5,
			revenueBoost: 50,
			qualityBoost: 5,
			unlockRequires: []
		},
		{
			id: 'be_context_menu',
			name: 'Context Menu',
			description: 'Right-click context menu integration.',
			wuCost: 4,
			revenueBoost: 30,
			qualityBoost: 4,
			unlockRequires: []
		},
		{
			id: 'be_dark_mode',
			name: 'Dark Mode',
			description: 'A sleek dark theme for your extension.',
			wuCost: 3,
			revenueBoost: 40,
			qualityBoost: 6,
			unlockRequires: ['ui_ux']
		},
		{
			id: 'be_sync',
			name: 'Sync Across Devices',
			description: 'Sync settings and data across all devices.',
			wuCost: 8,
			revenueBoost: 100,
			qualityBoost: 8,
			unlockRequires: ['cloud_hosting']
		},
		{
			id: 'be_shortcuts',
			name: 'Custom Shortcuts',
			description: 'User-configurable keyboard shortcuts.',
			wuCost: 4,
			revenueBoost: 50,
			qualityBoost: 5,
			unlockRequires: []
		},
		{
			id: 'be_analytics',
			name: 'Analytics Dashboard',
			description: 'Usage analytics and insights.',
			wuCost: 7,
			revenueBoost: 120,
			qualityBoost: 7,
			unlockRequires: ['web_basics']
		}
	],
	mobile_app: [
		{
			id: 'ma_push',
			name: 'Push Notifications',
			description: 'Real-time push notifications.',
			wuCost: 6,
			revenueBoost: 200,
			qualityBoost: 6,
			unlockRequires: []
		},
		{
			id: 'ma_auth',
			name: 'User Auth',
			description: 'Secure login and account management.',
			wuCost: 8,
			revenueBoost: 150,
			qualityBoost: 8,
			unlockRequires: ['security']
		},
		{
			id: 'ma_chat',
			name: 'In-App Chat',
			description: 'Real-time messaging between users.',
			wuCost: 12,
			revenueBoost: 300,
			qualityBoost: 10,
			unlockRequires: ['mobile_dev']
		},
		{
			id: 'ma_offline',
			name: 'Offline Mode',
			description: 'Full functionality without internet.',
			wuCost: 10,
			revenueBoost: 250,
			qualityBoost: 9,
			unlockRequires: []
		},
		{
			id: 'ma_dark',
			name: 'Dark Mode',
			description: 'Dark theme support.',
			wuCost: 4,
			revenueBoost: 100,
			qualityBoost: 5,
			unlockRequires: ['ui_ux']
		},
		{
			id: 'ma_social',
			name: 'Social Sharing',
			description: 'Share content to social platforms.',
			wuCost: 5,
			revenueBoost: 150,
			qualityBoost: 6,
			unlockRequires: []
		},
		{
			id: 'ma_analytics',
			name: 'Analytics',
			description: 'User behavior tracking and insights.',
			wuCost: 7,
			revenueBoost: 180,
			qualityBoost: 7,
			unlockRequires: ['web_basics']
		},
		{
			id: 'ma_iap',
			name: 'In-App Purchases',
			description: 'Monetize with in-app purchases.',
			wuCost: 10,
			revenueBoost: 400,
			qualityBoost: 8,
			unlockRequires: ['monetization']
		}
	],
	saas: [
		{
			id: 'saas_auth',
			name: 'User Auth & Teams',
			description: 'Multi-user authentication with team support.',
			wuCost: 10,
			revenueBoost: 400,
			qualityBoost: 8,
			unlockRequires: ['security']
		},
		{
			id: 'saas_api',
			name: 'REST API',
			description: 'Public API for integrations.',
			wuCost: 12,
			revenueBoost: 600,
			qualityBoost: 10,
			unlockRequires: ['web_basics']
		},
		{
			id: 'saas_webhooks',
			name: 'Webhooks',
			description: 'Real-time event notifications via webhooks.',
			wuCost: 8,
			revenueBoost: 350,
			qualityBoost: 7,
			unlockRequires: ['web_basics']
		},
		{
			id: 'saas_admin',
			name: 'Admin Dashboard',
			description: 'Powerful admin control panel.',
			wuCost: 10,
			revenueBoost: 500,
			qualityBoost: 9,
			unlockRequires: ['ui_ux']
		},
		{
			id: 'saas_csv',
			name: 'CSV Export',
			description: 'Export data as CSV files.',
			wuCost: 5,
			revenueBoost: 200,
			qualityBoost: 5,
			unlockRequires: []
		},
		{
			id: 'saas_email',
			name: 'Email Notifications',
			description: 'Automated email alerts.',
			wuCost: 6,
			revenueBoost: 250,
			qualityBoost: 6,
			unlockRequires: []
		},
		{
			id: 'saas_branding',
			name: 'Custom Branding',
			description: 'White-label branding options.',
			wuCost: 7,
			revenueBoost: 300,
			qualityBoost: 7,
			unlockRequires: ['ui_ux']
		},
		{
			id: 'saas_ai',
			name: 'AI Automation',
			description: 'AI-powered workflow automation.',
			wuCost: 15,
			revenueBoost: 1200,
			qualityBoost: 12,
			unlockRequires: ['ai_features']
		}
	],
	desktop_app: [
		{
			id: 'da_updater',
			name: 'Auto-Updater',
			description: 'Seamless background updates.',
			wuCost: 6,
			revenueBoost: 200,
			qualityBoost: 7,
			unlockRequires: ['devops']
		},
		{
			id: 'da_offline',
			name: 'Offline Mode',
			description: 'Full functionality without internet.',
			wuCost: 8,
			revenueBoost: 300,
			qualityBoost: 8,
			unlockRequires: []
		},
		{
			id: 'da_plugins',
			name: 'Plugin System',
			description: 'Extensible plugin architecture.',
			wuCost: 14,
			revenueBoost: 500,
			qualityBoost: 10,
			unlockRequires: ['web_basics']
		},
		{
			id: 'da_sync',
			name: 'Cloud Sync',
			description: 'Sync data across devices via cloud.',
			wuCost: 10,
			revenueBoost: 400,
			qualityBoost: 9,
			unlockRequires: ['cloud_hosting']
		},
		{
			id: 'da_dark',
			name: 'Dark Mode',
			description: 'Beautiful dark theme.',
			wuCost: 4,
			revenueBoost: 150,
			qualityBoost: 5,
			unlockRequires: ['ui_ux']
		},
		{
			id: 'da_shortcuts',
			name: 'Keyboard Shortcuts',
			description: 'Power-user keyboard navigation.',
			wuCost: 5,
			revenueBoost: 180,
			qualityBoost: 6,
			unlockRequires: []
		},
		{
			id: 'da_i18n',
			name: 'Multi-Language',
			description: 'Internationalization support.',
			wuCost: 8,
			revenueBoost: 350,
			qualityBoost: 7,
			unlockRequires: []
		}
	],
	ai_product: [
		{
			id: 'ai_chat',
			name: 'Chat Interface',
			description: 'Conversational AI chat interface.',
			wuCost: 10,
			revenueBoost: 800,
			qualityBoost: 10,
			unlockRequires: ['ai_features']
		},
		{
			id: 'ai_api',
			name: 'API Access',
			description: 'Programmatic API access.',
			wuCost: 12,
			revenueBoost: 1000,
			qualityBoost: 10,
			unlockRequires: ['ai_features']
		},
		{
			id: 'ai_tuning',
			name: 'Custom Model Tuning',
			description: 'Fine-tune models on customer data.',
			wuCost: 20,
			revenueBoost: 2000,
			qualityBoost: 15,
			unlockRequires: ['ai_features']
		},
		{
			id: 'ai_export',
			name: 'Data Export',
			description: 'Export data and model outputs.',
			wuCost: 6,
			revenueBoost: 400,
			qualityBoost: 6,
			unlockRequires: []
		},
		{
			id: 'ai_collab',
			name: 'Team Collaboration',
			description: 'Multi-user workspaces.',
			wuCost: 10,
			revenueBoost: 600,
			qualityBoost: 8,
			unlockRequires: ['security']
		},
		{
			id: 'ai_usage',
			name: 'Usage Analytics',
			description: 'Detailed usage metrics and reports.',
			wuCost: 8,
			revenueBoost: 500,
			qualityBoost: 7,
			unlockRequires: ['web_basics']
		},
		{
			id: 'ai_webhooks',
			name: 'Webhook Integration',
			description: 'Trigger external workflows via webhooks.',
			wuCost: 8,
			revenueBoost: 700,
			qualityBoost: 8,
			unlockRequires: ['web_basics']
		}
	]
};
