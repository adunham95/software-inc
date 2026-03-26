import type { ProjectFeature, ProjectType } from '$lib/types';

export const PROJECT_TYPES: Record<
	ProjectType,
	{ label: string; baseWu: number; requires: string[] }
> = {
	browser_ext: { label: 'Browser Extension', baseWu: 10, requires: [] },
	mobile_app: { label: 'Mobile App', baseWu: 30, requires: ['mobile_dev'] },
	saas: { label: 'SaaS Tool', baseWu: 40, requires: ['web_basics'] },
	desktop_app: { label: 'Desktop App', baseWu: 35, requires: ['web_basics'] },
	ai_product: { label: 'AI Product', baseWu: 60, requires: ['ai_features'] }
};

export const PRICE_RANGES: Record<
	ProjectType,
	{ oneTime: [number, number]; subscription: [number, number] }
> = {
	browser_ext: { oneTime: [1, 15], subscription: [1, 5] },
	mobile_app: { oneTime: [2, 20], subscription: [3, 15] },
	saas: { oneTime: [50, 500], subscription: [10, 99] },
	desktop_app: { oneTime: [10, 100], subscription: [5, 30] },
	ai_product: { oneTime: [20, 200], subscription: [15, 150] }
};

type FeatureTemplate = Omit<ProjectFeature, 'status' | 'progressWu'>;

export const FEATURE_POOLS: Record<ProjectType, FeatureTemplate[]> = {
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
