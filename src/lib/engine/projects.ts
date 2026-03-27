import type { ProjectFeature, ProjectType, ProjectCategory, LaptopTier } from '$lib/types';

export const PROJECT_TYPES: Record<
	ProjectType,
	{ label: string; baseWu: number; requires: string[]; laptopTierMin: LaptopTier }
> = {
	api: { label: 'Platform API', baseWu: 50, requires: ['platform_architecture'], laptopTierMin: 2 },
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
	api: { oneTime: [0.001, 0.05], subscription: [0.001, 0.05] },
	basic_website: { oneTime: [0.5, 5], subscription: [1, 3] },
	browser_ext: { oneTime: [1, 15], subscription: [1, 5] },
	mobile_app: { oneTime: [2, 20], subscription: [3, 15] },
	saas: { oneTime: [50, 500], subscription: [10, 99] },
	desktop_app: { oneTime: [10, 100], subscription: [5, 30] },
	ai_product: { oneTime: [20, 200], subscription: [15, 150] }
};

// Hosting costs per product type (external = $/wk, self = WU/wk)
export const HOSTING_EXTERNAL_COST: Partial<Record<ProjectType, number>> = {
	api: 500,
	mobile_app: 150,
	saas: 400,
	desktop_app: 100,
	ai_product: 1200
};

export const HOSTING_WU_DRAIN: Partial<Record<ProjectType, number>> = {
	api: 3,
	mobile_app: 1,
	saas: 2,
	desktop_app: 1,
	ai_product: 4
};

// Types that need hosting (browser_ext has 'none')
export const NEEDS_HOSTING: ProjectType[] = ['api', 'mobile_app', 'saas', 'desktop_app', 'ai_product'];

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
	api: [
		{ id: 'api_auth', name: 'Authentication', description: 'Enables User Auth on all sub-products for free.', wuCost: 10, revenueBoost: 0, qualityBoost: 10, unlockRequires: ['security'] },
		{ id: 'api_rate_limit', name: 'Rate Limiting', description: 'Reduces outage risk by 30%.', wuCost: 6, revenueBoost: 0, qualityBoost: 8, unlockRequires: [] },
		{ id: 'api_analytics', name: 'Analytics Endpoint', description: '+15% API revenue.', wuCost: 8, revenueBoost: 15, qualityBoost: 7, unlockRequires: ['web_basics'] },
		{ id: 'api_webhooks', name: 'Webhooks', description: 'Unlocks Webhook features on sub-products.', wuCost: 8, revenueBoost: 0, qualityBoost: 8, unlockRequires: ['web_basics'] },
		{ id: 'api_sdks', name: 'SDKs (JS, Python)', description: '+20% API revenue, -1 WU cost on sub-product features.', wuCost: 10, revenueBoost: 20, qualityBoost: 9, unlockRequires: [] },
		{ id: 'api_graphql', name: 'GraphQL Support', description: '+25% API revenue.', wuCost: 10, revenueBoost: 25, qualityBoost: 9, unlockRequires: ['web_basics'] },
		{ id: 'api_admin', name: 'Admin Console', description: '+10% platform brand strength/wk.', wuCost: 8, revenueBoost: 0, qualityBoost: 8, unlockRequires: ['ui_ux'] }
	],
	basic_website: [
		{
			id: 'bw_contact',
			name: 'Contact Form',
			description: 'Let visitors get in touch directly.',
			wuCost: 3,
			revenueBoost: 0,
			qualityBoost: 8,
			unlockRequires: []
		},
		{
			id: 'bw_gallery',
			name: 'Image Gallery',
			description: 'Showcase images in a polished gallery.',
			wuCost: 3,
			revenueBoost: 0,
			qualityBoost: 10,
			unlockRequires: []
		},
		{
			id: 'bw_seo',
			name: 'SEO Optimisation',
			description: 'Rank higher in search engines.',
			wuCost: 5,
			revenueBoost: 0,
			qualityBoost: 12,
			unlockRequires: ['web_basics']
		},
		{
			id: 'bw_newsletter',
			name: 'Email Newsletter',
			description: 'Grow a subscriber list with email updates.',
			wuCost: 6,
			revenueBoost: 0,
			qualityBoost: 12,
			unlockRequires: []
		},
		{
			id: 'bw_dark',
			name: 'Dark Mode',
			description: 'A sleek dark theme option.',
			wuCost: 3,
			revenueBoost: 0,
			qualityBoost: 8,
			unlockRequires: ['ui_ux']
		},
		{
			id: 'bw_search',
			name: 'Search',
			description: 'Full-text search across all content.',
			wuCost: 5,
			revenueBoost: 0,
			qualityBoost: 10,
			unlockRequires: ['web_basics']
		},
		{
			id: 'bw_social',
			name: 'Social Share Buttons',
			description: 'Let visitors share your content easily.',
			wuCost: 2,
			revenueBoost: 0,
			qualityBoost: 6,
			unlockRequires: []
		}
	],
	browser_ext: [
		{
			id: 'be_popup_ui',
			name: 'Popup UI',
			description: 'A polished popup interface.',
			wuCost: 5,
			revenueBoost: 0,
			qualityBoost: 10,
			unlockRequires: []
		},
		{
			id: 'be_context_menu',
			name: 'Context Menu',
			description: 'Right-click context menu integration.',
			wuCost: 4,
			revenueBoost: 0,
			qualityBoost: 8,
			unlockRequires: []
		},
		{
			id: 'be_dark_mode',
			name: 'Dark Mode',
			description: 'A sleek dark theme for your extension.',
			wuCost: 3,
			revenueBoost: 0,
			qualityBoost: 12,
			unlockRequires: ['ui_ux']
		},
		{
			id: 'be_sync',
			name: 'Sync Across Devices',
			description: 'Sync settings and data across all devices.',
			wuCost: 8,
			revenueBoost: 0,
			qualityBoost: 16,
			unlockRequires: ['cloud_hosting']
		},
		{
			id: 'be_shortcuts',
			name: 'Custom Shortcuts',
			description: 'User-configurable keyboard shortcuts.',
			wuCost: 4,
			revenueBoost: 0,
			qualityBoost: 10,
			unlockRequires: []
		},
		{
			id: 'be_analytics',
			name: 'Analytics Dashboard',
			description: 'Usage analytics and insights.',
			wuCost: 7,
			revenueBoost: 0,
			qualityBoost: 14,
			unlockRequires: ['web_basics']
		}
	],
	mobile_app: [
		{
			id: 'ma_push',
			name: 'Push Notifications',
			description: 'Real-time push notifications.',
			wuCost: 6,
			revenueBoost: 0,
			qualityBoost: 12,
			unlockRequires: []
		},
		{
			id: 'ma_auth',
			name: 'User Auth',
			description: 'Secure login and account management.',
			wuCost: 8,
			revenueBoost: 0,
			qualityBoost: 16,
			unlockRequires: ['security']
		},
		{
			id: 'ma_chat',
			name: 'In-App Chat',
			description: 'Real-time messaging between users.',
			wuCost: 12,
			revenueBoost: 0,
			qualityBoost: 20,
			unlockRequires: ['mobile_dev']
		},
		{
			id: 'ma_offline',
			name: 'Offline Mode',
			description: 'Full functionality without internet.',
			wuCost: 10,
			revenueBoost: 0,
			qualityBoost: 18,
			unlockRequires: []
		},
		{
			id: 'ma_dark',
			name: 'Dark Mode',
			description: 'Dark theme support.',
			wuCost: 4,
			revenueBoost: 0,
			qualityBoost: 10,
			unlockRequires: ['ui_ux']
		},
		{
			id: 'ma_social',
			name: 'Social Sharing',
			description: 'Share content to social platforms.',
			wuCost: 5,
			revenueBoost: 0,
			qualityBoost: 12,
			unlockRequires: []
		},
		{
			id: 'ma_analytics',
			name: 'Analytics',
			description: 'User behavior tracking and insights.',
			wuCost: 7,
			revenueBoost: 0,
			qualityBoost: 14,
			unlockRequires: ['web_basics']
		},
		{
			id: 'ma_iap',
			name: 'In-App Purchases',
			description: 'Monetize with in-app purchases.',
			wuCost: 10,
			revenueBoost: 0,
			qualityBoost: 16,
			unlockRequires: ['monetization']
		}
	],
	saas: [
		{
			id: 'saas_auth',
			name: 'User Auth & Teams',
			description: 'Multi-user authentication with team support.',
			wuCost: 10,
			revenueBoost: 0,
			qualityBoost: 16,
			unlockRequires: ['security']
		},
		{
			id: 'saas_api',
			name: 'REST API',
			description: 'Public API for integrations.',
			wuCost: 12,
			revenueBoost: 0,
			qualityBoost: 20,
			unlockRequires: ['web_basics']
		},
		{
			id: 'saas_webhooks',
			name: 'Webhooks',
			description: 'Real-time event notifications via webhooks.',
			wuCost: 8,
			revenueBoost: 0,
			qualityBoost: 14,
			unlockRequires: ['web_basics']
		},
		{
			id: 'saas_admin',
			name: 'Admin Dashboard',
			description: 'Powerful admin control panel.',
			wuCost: 10,
			revenueBoost: 0,
			qualityBoost: 18,
			unlockRequires: ['ui_ux']
		},
		{
			id: 'saas_csv',
			name: 'CSV Export',
			description: 'Export data as CSV files.',
			wuCost: 5,
			revenueBoost: 0,
			qualityBoost: 10,
			unlockRequires: []
		},
		{
			id: 'saas_email',
			name: 'Email Notifications',
			description: 'Automated email alerts.',
			wuCost: 6,
			revenueBoost: 0,
			qualityBoost: 12,
			unlockRequires: []
		},
		{
			id: 'saas_branding',
			name: 'Custom Branding',
			description: 'White-label branding options.',
			wuCost: 7,
			revenueBoost: 0,
			qualityBoost: 14,
			unlockRequires: ['ui_ux']
		},
		{
			id: 'saas_ai',
			name: 'AI Automation',
			description: 'AI-powered workflow automation.',
			wuCost: 15,
			revenueBoost: 0,
			qualityBoost: 24,
			unlockRequires: ['ai_features']
		}
	],
	desktop_app: [
		{
			id: 'da_updater',
			name: 'Auto-Updater',
			description: 'Seamless background updates.',
			wuCost: 6,
			revenueBoost: 0,
			qualityBoost: 14,
			unlockRequires: ['devops']
		},
		{
			id: 'da_offline',
			name: 'Offline Mode',
			description: 'Full functionality without internet.',
			wuCost: 8,
			revenueBoost: 0,
			qualityBoost: 16,
			unlockRequires: []
		},
		{
			id: 'da_plugins',
			name: 'Plugin System',
			description: 'Extensible plugin architecture.',
			wuCost: 14,
			revenueBoost: 0,
			qualityBoost: 20,
			unlockRequires: ['web_basics']
		},
		{
			id: 'da_sync',
			name: 'Cloud Sync',
			description: 'Sync data across devices via cloud.',
			wuCost: 10,
			revenueBoost: 0,
			qualityBoost: 18,
			unlockRequires: ['cloud_hosting']
		},
		{
			id: 'da_dark',
			name: 'Dark Mode',
			description: 'Beautiful dark theme.',
			wuCost: 4,
			revenueBoost: 0,
			qualityBoost: 10,
			unlockRequires: ['ui_ux']
		},
		{
			id: 'da_shortcuts',
			name: 'Keyboard Shortcuts',
			description: 'Power-user keyboard navigation.',
			wuCost: 5,
			revenueBoost: 0,
			qualityBoost: 12,
			unlockRequires: []
		},
		{
			id: 'da_i18n',
			name: 'Multi-Language',
			description: 'Internationalization support.',
			wuCost: 8,
			revenueBoost: 0,
			qualityBoost: 14,
			unlockRequires: []
		}
	],
	ai_product: [
		{
			id: 'ai_chat',
			name: 'Chat Interface',
			description: 'Conversational AI chat interface.',
			wuCost: 10,
			revenueBoost: 0,
			qualityBoost: 20,
			unlockRequires: ['ai_features']
		},
		{
			id: 'ai_api',
			name: 'API Access',
			description: 'Programmatic API access.',
			wuCost: 12,
			revenueBoost: 0,
			qualityBoost: 20,
			unlockRequires: ['ai_features']
		},
		{
			id: 'ai_tuning',
			name: 'Custom Model Tuning',
			description: 'Fine-tune models on customer data.',
			wuCost: 20,
			revenueBoost: 0,
			qualityBoost: 30,
			unlockRequires: ['ai_features']
		},
		{
			id: 'ai_export',
			name: 'Data Export',
			description: 'Export data and model outputs.',
			wuCost: 6,
			revenueBoost: 0,
			qualityBoost: 12,
			unlockRequires: []
		},
		{
			id: 'ai_collab',
			name: 'Team Collaboration',
			description: 'Multi-user workspaces.',
			wuCost: 10,
			revenueBoost: 0,
			qualityBoost: 16,
			unlockRequires: ['security']
		},
		{
			id: 'ai_usage',
			name: 'Usage Analytics',
			description: 'Detailed usage metrics and reports.',
			wuCost: 8,
			revenueBoost: 0,
			qualityBoost: 14,
			unlockRequires: ['web_basics']
		},
		{
			id: 'ai_webhooks',
			name: 'Webhook Integration',
			description: 'Trigger external workflows via webhooks.',
			wuCost: 8,
			revenueBoost: 0,
			qualityBoost: 16,
			unlockRequires: ['web_basics']
		}
	]
};

// Advertising feature — appended to every project's feature list
export const ADVERTISING_FEATURE: FeatureTemplate = {
	id: 'advertising',
	name: 'Advertising',
	description: 'Run ads on your product. Generates passive ad revenue based on traffic/users.',
	wuCost: 4,
	revenueBoost: 0,
	qualityBoost: -10,
	unlockRequires: []
};

// Ad revenue per user per week by project type
export const AD_RATE_PER_USER: Record<ProjectType, number> = {
	api: 0,
	basic_website: 0.08,
	browser_ext: 0.05,
	mobile_app: 0.04,
	desktop_app: 0.03,
	saas: 0.02,
	ai_product: 0.01
};

// Valid categories per project type
export const CATEGORIES_FOR_TYPE: Record<ProjectType, ProjectCategory[]> = {
	api: [],
	basic_website: ['blog', 'news', 'portfolio', 'landing_page', 'community_forum'],
	mobile_app: ['dating', 'chat', 'entertainment', 'fitness', 'education'],
	saas: ['productivity', 'crm', 'analytics', 'devtools', 'finance'],
	desktop_app: ['productivity', 'video_game', 'media_player', 'developer_tool', 'security'],
	browser_ext: ['productivity', 'privacy', 'shopping', 'developer', 'social'],
	ai_product: ['writing_assistant', 'code_assistant', 'image_generation', 'data_analysis', 'customer_support']
};

export const CATEGORY_LABELS: Partial<Record<ProjectCategory, string>> = {
	blog: 'Blog',
	news: 'News',
	portfolio: 'Portfolio',
	landing_page: 'Landing Page',
	community_forum: 'Community Forum',
	dating: 'Dating',
	chat: 'Chat',
	entertainment: 'Entertainment',
	fitness: 'Fitness',
	education: 'Education',
	productivity: 'Productivity',
	crm: 'CRM',
	analytics: 'Analytics',
	devtools: 'DevTools',
	finance: 'Finance',
	video_game: 'Video Game',
	media_player: 'Media Player',
	developer_tool: 'Developer Tool',
	security: 'Security',
	privacy: 'Privacy',
	shopping: 'Shopping',
	developer: 'Developer',
	social: 'Social',
	writing_assistant: 'Writing Assistant',
	code_assistant: 'Code Assistant',
	image_generation: 'Image Generation',
	data_analysis: 'Data Analysis',
	customer_support: 'Customer Support'
};

export const CATEGORY_FEATURE_POOLS: Record<ProjectType, Partial<Record<ProjectCategory, FeatureTemplate[]>>> = {
	api: {},
	basic_website: {
		blog: [
			{ id: 'cat_bw_blog_editor', name: 'Post Editor', description: 'Rich-text editor for publishing posts.', wuCost: 6, revenueBoost: 0, qualityBoost: 14, unlockRequires: [] },
			{ id: 'cat_bw_blog_comments', name: 'Comment System', description: 'Readers can comment on posts.', wuCost: 5, revenueBoost: 0, qualityBoost: 12, unlockRequires: [] },
			{ id: 'cat_bw_blog_rss', name: 'RSS Feed', description: 'Syndicate content via RSS.', wuCost: 3, revenueBoost: 0, qualityBoost: 8, unlockRequires: ['web_basics'] },
			{ id: 'cat_bw_blog_authors', name: 'Author Profiles', description: 'Dedicated pages for each author.', wuCost: 4, revenueBoost: 0, qualityBoost: 10, unlockRequires: [] },
			{ id: 'cat_bw_blog_tags', name: 'Tag & Category System', description: 'Organise posts by tags and categories.', wuCost: 4, revenueBoost: 0, qualityBoost: 10, unlockRequires: [] }
		],
		news: [
			{ id: 'cat_bw_news_banner', name: 'Breaking News Banner', description: 'Prominent breaking news alert strip.', wuCost: 4, revenueBoost: 0, qualityBoost: 10, unlockRequires: [] },
			{ id: 'cat_bw_news_paywall', name: 'Article Paywall', description: 'Monetise premium content behind a paywall.', wuCost: 8, revenueBoost: 0, qualityBoost: 14, unlockRequires: ['monetization'] },
			{ id: 'cat_bw_news_push', name: 'Push Alerts', description: 'Notify subscribers of breaking stories.', wuCost: 6, revenueBoost: 0, qualityBoost: 12, unlockRequires: [] },
			{ id: 'cat_bw_news_live', name: 'Live Blog', description: 'Real-time rolling coverage of events.', wuCost: 7, revenueBoost: 0, qualityBoost: 16, unlockRequires: ['web_basics'] },
			{ id: 'cat_bw_news_comments', name: 'Comment Section', description: 'Reader discussion below articles.', wuCost: 5, revenueBoost: 0, qualityBoost: 10, unlockRequires: [] }
		],
		portfolio: [
			{ id: 'cat_bw_port_showcase', name: 'Project Showcase', description: 'Beautiful grid of your best work.', wuCost: 4, revenueBoost: 0, qualityBoost: 16, unlockRequires: [] },
			{ id: 'cat_bw_port_testimonials', name: 'Client Testimonials', description: 'Social proof from happy clients.', wuCost: 3, revenueBoost: 0, qualityBoost: 12, unlockRequires: [] },
			{ id: 'cat_bw_port_cases', name: 'Case Studies', description: 'Deep-dive write-ups of past projects.', wuCost: 5, revenueBoost: 0, qualityBoost: 14, unlockRequires: [] },
			{ id: 'cat_bw_port_booking', name: 'Booking Form', description: 'Let clients book consultations directly.', wuCost: 5, revenueBoost: 0, qualityBoost: 12, unlockRequires: [] }
		],
		landing_page: [
			{ id: 'cat_bw_lp_hero', name: 'Hero Animation', description: 'Eye-catching animated hero section.', wuCost: 5, revenueBoost: 0, qualityBoost: 16, unlockRequires: ['ui_ux'] },
			{ id: 'cat_bw_lp_ab', name: 'A/B Test Variants', description: 'Test multiple versions to maximise conversions.', wuCost: 8, revenueBoost: 0, qualityBoost: 14, unlockRequires: ['web_basics'] },
			{ id: 'cat_bw_lp_lead', name: 'Lead Capture Form', description: 'Collect emails from interested visitors.', wuCost: 4, revenueBoost: 0, qualityBoost: 12, unlockRequires: [] },
			{ id: 'cat_bw_lp_video', name: 'Video Embed', description: 'Embed a product or explainer video.', wuCost: 3, revenueBoost: 0, qualityBoost: 10, unlockRequires: [] },
			{ id: 'cat_bw_lp_chat', name: 'Live Chat Widget', description: 'Real-time chat for visitor questions.', wuCost: 6, revenueBoost: 0, qualityBoost: 12, unlockRequires: [] }
		],
		community_forum: [
			{ id: 'cat_bw_forum_threads', name: 'Thread & Reply System', description: 'Core forum post and reply functionality.', wuCost: 8, revenueBoost: 0, qualityBoost: 16, unlockRequires: ['web_basics'] },
			{ id: 'cat_bw_forum_rep', name: 'User Reputation', description: 'Karma/upvote system for members.', wuCost: 5, revenueBoost: 0, qualityBoost: 14, unlockRequires: [] },
			{ id: 'cat_bw_forum_mod', name: 'Moderation Tools', description: 'Tools to manage spam and rule violations.', wuCost: 6, revenueBoost: 0, qualityBoost: 12, unlockRequires: ['security'] },
			{ id: 'cat_bw_forum_pm', name: 'Private Messaging', description: 'Direct messages between members.', wuCost: 7, revenueBoost: 0, qualityBoost: 14, unlockRequires: ['security'] },
			{ id: 'cat_bw_forum_badges', name: 'Badges & Awards', description: 'Gamified achievement badges for members.', wuCost: 4, revenueBoost: 0, qualityBoost: 10, unlockRequires: [] }
		]
	},
	mobile_app: {
		dating: [
			{ id: 'cat_ma_dating_swipe', name: 'Swipe Matching', description: 'Swipe-based card matching interface.', wuCost: 10, revenueBoost: 0, qualityBoost: 20, unlockRequires: ['mobile_dev'] },
			{ id: 'cat_ma_dating_profile', name: 'Profile Builder', description: 'Rich profile with photos and bio.', wuCost: 7, revenueBoost: 0, qualityBoost: 16, unlockRequires: [] },
			{ id: 'cat_ma_dating_location', name: 'Location-Based Discovery', description: 'Find matches near your location.', wuCost: 9, revenueBoost: 0, qualityBoost: 18, unlockRequires: ['mobile_dev'] },
			{ id: 'cat_ma_dating_superlikes', name: 'Super Likes', description: 'Premium super-like feature to stand out.', wuCost: 5, revenueBoost: 0, qualityBoost: 12, unlockRequires: ['monetization'] },
			{ id: 'cat_ma_dating_video', name: 'Video Date', description: 'In-app video calling for virtual dates.', wuCost: 10, revenueBoost: 0, qualityBoost: 20, unlockRequires: ['mobile_dev'] }
		],
		chat: [
			{ id: 'cat_ma_chat_groups', name: 'Group Chats', description: 'Create and manage group conversations.', wuCost: 8, revenueBoost: 0, qualityBoost: 16, unlockRequires: [] },
			{ id: 'cat_ma_chat_voice', name: 'Voice Messages', description: 'Record and send voice notes.', wuCost: 7, revenueBoost: 0, qualityBoost: 16, unlockRequires: ['mobile_dev'] },
			{ id: 'cat_ma_chat_e2e', name: 'End-to-End Encryption', description: 'Private messages that only recipients can read.', wuCost: 10, revenueBoost: 0, qualityBoost: 20, unlockRequires: ['security'] },
			{ id: 'cat_ma_chat_stickers', name: 'Stickers & Reactions', description: 'Express yourself with stickers and emoji reactions.', wuCost: 5, revenueBoost: 0, qualityBoost: 12, unlockRequires: [] },
			{ id: 'cat_ma_chat_status', name: 'Status Updates', description: 'Share disappearing status stories.', wuCost: 4, revenueBoost: 0, qualityBoost: 10, unlockRequires: [] }
		],
		entertainment: [
			{ id: 'cat_ma_ent_feed', name: 'Content Feed', description: 'Scrollable feed of entertainment content.', wuCost: 8, revenueBoost: 0, qualityBoost: 16, unlockRequires: [] },
			{ id: 'cat_ma_ent_video', name: 'Video Player', description: 'Smooth in-app video playback.', wuCost: 9, revenueBoost: 0, qualityBoost: 18, unlockRequires: ['mobile_dev'] },
			{ id: 'cat_ma_ent_reco', name: 'Personalised Recommendations', description: 'AI-driven content recommendations.', wuCost: 10, revenueBoost: 0, qualityBoost: 20, unlockRequires: ['ai_features'] },
			{ id: 'cat_ma_ent_creators', name: 'Creator Profiles', description: 'Dedicated pages for content creators.', wuCost: 6, revenueBoost: 0, qualityBoost: 14, unlockRequires: [] },
			{ id: 'cat_ma_ent_live', name: 'Live Streaming', description: 'Real-time live broadcast from creators.', wuCost: 12, revenueBoost: 0, qualityBoost: 22, unlockRequires: ['cloud_hosting'] }
		],
		fitness: [
			{ id: 'cat_ma_fit_tracker', name: 'Workout Tracker', description: 'Log and track exercise sessions.', wuCost: 7, revenueBoost: 0, qualityBoost: 16, unlockRequires: [] },
			{ id: 'cat_ma_fit_charts', name: 'Progress Charts', description: 'Visualise fitness progress over time.', wuCost: 6, revenueBoost: 0, qualityBoost: 14, unlockRequires: ['web_basics'] },
			{ id: 'cat_ma_fit_meal', name: 'Meal Planner', description: 'Plan and track nutrition and meals.', wuCost: 8, revenueBoost: 0, qualityBoost: 16, unlockRequires: [] },
			{ id: 'cat_ma_fit_wearable', name: 'Wearable Sync', description: 'Sync data from fitness wearables.', wuCost: 9, revenueBoost: 0, qualityBoost: 18, unlockRequires: ['mobile_dev'] },
			{ id: 'cat_ma_fit_ai', name: 'Coach AI', description: 'AI-powered personal fitness coaching.', wuCost: 12, revenueBoost: 0, qualityBoost: 22, unlockRequires: ['ai_features'] }
		],
		education: [
			{ id: 'cat_ma_edu_player', name: 'Course Player', description: 'Structured video course playback.', wuCost: 8, revenueBoost: 0, qualityBoost: 16, unlockRequires: [] },
			{ id: 'cat_ma_edu_quiz', name: 'Quiz Engine', description: 'Interactive quizzes and assessments.', wuCost: 6, revenueBoost: 0, qualityBoost: 14, unlockRequires: [] },
			{ id: 'cat_ma_edu_certs', name: 'Progress Certificates', description: 'Award certificates on course completion.', wuCost: 5, revenueBoost: 0, qualityBoost: 12, unlockRequires: [] },
			{ id: 'cat_ma_edu_live', name: 'Live Classes', description: 'Real-time live teaching sessions.', wuCost: 10, revenueBoost: 0, qualityBoost: 20, unlockRequires: ['cloud_hosting'] },
			{ id: 'cat_ma_edu_ai', name: 'AI Tutor', description: 'Personalised AI-driven tutoring.', wuCost: 12, revenueBoost: 0, qualityBoost: 22, unlockRequires: ['ai_features'] }
		]
	},
	saas: {
		productivity: [
			{ id: 'cat_saas_prod_editor', name: 'Word Editor', description: 'Rich-text document editing.', wuCost: 10, revenueBoost: 0, qualityBoost: 18, unlockRequires: ['web_basics'] },
			{ id: 'cat_saas_prod_sheets', name: 'Spreadsheet Editor', description: 'Collaborative spreadsheets.', wuCost: 12, revenueBoost: 0, qualityBoost: 20, unlockRequires: ['web_basics'] },
			{ id: 'cat_saas_prod_kanban', name: 'Task Board (Kanban)', description: 'Visual task management board.', wuCost: 8, revenueBoost: 0, qualityBoost: 16, unlockRequires: [] },
			{ id: 'cat_saas_prod_cal', name: 'Calendar Integration', description: 'Sync tasks with calendar events.', wuCost: 7, revenueBoost: 0, qualityBoost: 14, unlockRequires: ['web_basics'] },
			{ id: 'cat_saas_prod_templates', name: 'Templates Library', description: 'Pre-built templates to get started fast.', wuCost: 6, revenueBoost: 0, qualityBoost: 14, unlockRequires: [] }
		],
		crm: [
			{ id: 'cat_saas_crm_contacts', name: 'Contact Database', description: 'Centralised customer contact records.', wuCost: 8, revenueBoost: 0, qualityBoost: 16, unlockRequires: [] },
			{ id: 'cat_saas_crm_pipeline', name: 'Deal Pipeline', description: 'Visual sales pipeline management.', wuCost: 9, revenueBoost: 0, qualityBoost: 18, unlockRequires: [] },
			{ id: 'cat_saas_crm_email', name: 'Email Sequences', description: 'Automated follow-up email campaigns.', wuCost: 10, revenueBoost: 0, qualityBoost: 18, unlockRequires: ['web_basics'] },
			{ id: 'cat_saas_crm_timeline', name: 'Activity Timeline', description: 'Full history of customer interactions.', wuCost: 6, revenueBoost: 0, qualityBoost: 14, unlockRequires: [] },
			{ id: 'cat_saas_crm_forecast', name: 'Sales Forecasting', description: 'AI-driven revenue forecasting.', wuCost: 10, revenueBoost: 0, qualityBoost: 20, unlockRequires: ['ai_features'] }
		],
		analytics: [
			{ id: 'cat_saas_anl_dashboards', name: 'Custom Dashboards', description: 'Drag-and-drop analytics dashboards.', wuCost: 9, revenueBoost: 0, qualityBoost: 18, unlockRequires: ['ui_ux'] },
			{ id: 'cat_saas_anl_funnels', name: 'Funnel Reports', description: 'Visualise conversion funnels.', wuCost: 8, revenueBoost: 0, qualityBoost: 16, unlockRequires: ['web_basics'] },
			{ id: 'cat_saas_anl_export', name: 'Data Export', description: 'Export data as CSV or JSON.', wuCost: 5, revenueBoost: 0, qualityBoost: 12, unlockRequires: [] },
			{ id: 'cat_saas_anl_anomaly', name: 'Anomaly Detection', description: 'AI flags unusual data patterns.', wuCost: 10, revenueBoost: 0, qualityBoost: 20, unlockRequires: ['ai_features'] },
			{ id: 'cat_saas_anl_ab', name: 'A/B Test Reports', description: 'Statistical results for A/B experiments.', wuCost: 8, revenueBoost: 0, qualityBoost: 16, unlockRequires: ['web_basics'] }
		],
		devtools: [
			{ id: 'cat_saas_dev_editor', name: 'Code Editor', description: 'Browser-based code editing environment.', wuCost: 10, revenueBoost: 0, qualityBoost: 18, unlockRequires: ['web_basics'] },
			{ id: 'cat_saas_dev_cicd', name: 'CI/CD Integration', description: 'Automated build and deployment pipelines.', wuCost: 10, revenueBoost: 0, qualityBoost: 18, unlockRequires: ['devops'] },
			{ id: 'cat_saas_dev_errors', name: 'Error Monitoring', description: 'Real-time error tracking and alerting.', wuCost: 8, revenueBoost: 0, qualityBoost: 16, unlockRequires: ['web_basics'] },
			{ id: 'cat_saas_dev_logs', name: 'Log Viewer', description: 'Searchable structured log explorer.', wuCost: 6, revenueBoost: 0, qualityBoost: 14, unlockRequires: [] },
			{ id: 'cat_saas_dev_ai', name: 'AI Code Review', description: 'Automated AI-powered code review.', wuCost: 12, revenueBoost: 0, qualityBoost: 22, unlockRequires: ['ai_features'] }
		],
		finance: [
			{ id: 'cat_saas_fin_invoices', name: 'Invoice Generator', description: 'Create and send professional invoices.', wuCost: 7, revenueBoost: 0, qualityBoost: 16, unlockRequires: [] },
			{ id: 'cat_saas_fin_expenses', name: 'Expense Tracker', description: 'Track and categorise business expenses.', wuCost: 7, revenueBoost: 0, qualityBoost: 14, unlockRequires: [] },
			{ id: 'cat_saas_fin_bank', name: 'Bank Sync', description: 'Automatically import bank transactions.', wuCost: 10, revenueBoost: 0, qualityBoost: 20, unlockRequires: ['security'] },
			{ id: 'cat_saas_fin_tax', name: 'Tax Reports', description: 'Auto-generate tax-ready financial reports.', wuCost: 9, revenueBoost: 0, qualityBoost: 18, unlockRequires: ['web_basics'] },
			{ id: 'cat_saas_fin_currency', name: 'Multi-Currency', description: 'Handle transactions in multiple currencies.', wuCost: 8, revenueBoost: 0, qualityBoost: 16, unlockRequires: [] }
		]
	},
	desktop_app: {
		productivity: [
			{ id: 'cat_da_prod_doc', name: 'Document Editor', description: 'Full-featured desktop document editing.', wuCost: 10, revenueBoost: 0, qualityBoost: 18, unlockRequires: [] },
			{ id: 'cat_da_prod_sheets', name: 'Spreadsheet Editor', description: 'Powerful desktop spreadsheets.', wuCost: 12, revenueBoost: 0, qualityBoost: 20, unlockRequires: [] },
			{ id: 'cat_da_prod_pdf', name: 'PDF Viewer', description: 'View and annotate PDF files.', wuCost: 6, revenueBoost: 0, qualityBoost: 14, unlockRequires: [] },
			{ id: 'cat_da_prod_focus', name: 'Focus Timer', description: 'Pomodoro-style productivity timer.', wuCost: 5, revenueBoost: 0, qualityBoost: 12, unlockRequires: [] },
			{ id: 'cat_da_prod_cal', name: 'Calendar Sidebar', description: 'Integrated calendar panel.', wuCost: 7, revenueBoost: 0, qualityBoost: 14, unlockRequires: [] }
		],
		video_game: [
			{ id: 'cat_da_game_save', name: 'Save System', description: 'Multiple save slots and autosave.', wuCost: 6, revenueBoost: 0, qualityBoost: 16, unlockRequires: [] },
			{ id: 'cat_da_game_leader', name: 'Leaderboard', description: 'Online leaderboard for top scores.', wuCost: 7, revenueBoost: 0, qualityBoost: 14, unlockRequires: ['cloud_hosting'] },
			{ id: 'cat_da_game_controller', name: 'Controller Support', description: 'Full gamepad and controller support.', wuCost: 5, revenueBoost: 0, qualityBoost: 12, unlockRequires: [] },
			{ id: 'cat_da_game_mods', name: 'Mod Support', description: 'Community modding API and workshop.', wuCost: 10, revenueBoost: 0, qualityBoost: 20, unlockRequires: [] },
			{ id: 'cat_da_game_steam', name: 'Steam Integration', description: 'Steam achievements, DLC, and workshop.', wuCost: 9, revenueBoost: 0, qualityBoost: 18, unlockRequires: ['devops'] }
		],
		media_player: [
			{ id: 'cat_da_media_playlist', name: 'Playlist Manager', description: 'Create and manage playlists.', wuCost: 6, revenueBoost: 0, qualityBoost: 14, unlockRequires: [] },
			{ id: 'cat_da_media_eq', name: 'Equaliser', description: '10-band audio equaliser.', wuCost: 5, revenueBoost: 0, qualityBoost: 12, unlockRequires: [] },
			{ id: 'cat_da_media_formats', name: 'Format Support (FLAC etc)', description: 'Play lossless and rare audio formats.', wuCost: 6, revenueBoost: 0, qualityBoost: 14, unlockRequires: [] },
			{ id: 'cat_da_media_cast', name: 'Chromecast / AirPlay', description: 'Cast media to TV and speakers.', wuCost: 8, revenueBoost: 0, qualityBoost: 16, unlockRequires: ['cloud_hosting'] },
			{ id: 'cat_da_media_viz', name: 'Visualiser', description: 'Audio spectrum visualiser.', wuCost: 4, revenueBoost: 0, qualityBoost: 10, unlockRequires: ['ui_ux'] }
		],
		developer_tool: [
			{ id: 'cat_da_dev_syntax', name: 'Syntax Highlighting', description: 'Colour-coded syntax for 50+ languages.', wuCost: 6, revenueBoost: 0, qualityBoost: 14, unlockRequires: [] },
			{ id: 'cat_da_dev_git', name: 'Git Integration', description: 'Visual Git history, diff, and commit UI.', wuCost: 8, revenueBoost: 0, qualityBoost: 16, unlockRequires: ['devops'] },
			{ id: 'cat_da_dev_terminal', name: 'Terminal Emulator', description: 'Built-in terminal inside the app.', wuCost: 7, revenueBoost: 0, qualityBoost: 14, unlockRequires: [] },
			{ id: 'cat_da_dev_marketplace', name: 'Extension Marketplace', description: 'Install community-built extensions.', wuCost: 10, revenueBoost: 0, qualityBoost: 20, unlockRequires: [] },
			{ id: 'cat_da_dev_ai', name: 'AI Autocomplete', description: 'AI-powered code completion.', wuCost: 12, revenueBoost: 0, qualityBoost: 22, unlockRequires: ['ai_features'] }
		],
		security: [
			{ id: 'cat_da_sec_vault', name: 'Password Vault', description: 'Encrypted local password storage.', wuCost: 8, revenueBoost: 0, qualityBoost: 18, unlockRequires: ['security'] },
			{ id: 'cat_da_sec_2fa', name: '2FA Manager', description: 'TOTP-based two-factor authentication codes.', wuCost: 7, revenueBoost: 0, qualityBoost: 16, unlockRequires: ['security'] },
			{ id: 'cat_da_sec_vpn', name: 'VPN Integration', description: 'One-click VPN toggle.', wuCost: 10, revenueBoost: 0, qualityBoost: 18, unlockRequires: ['security'] },
			{ id: 'cat_da_sec_breach', name: 'Breach Alerts', description: 'Notify when your credentials appear in breaches.', wuCost: 6, revenueBoost: 0, qualityBoost: 14, unlockRequires: ['security'] },
			{ id: 'cat_da_sec_notes', name: 'Secure Notes', description: 'Encrypted note-taking.', wuCost: 5, revenueBoost: 0, qualityBoost: 12, unlockRequires: [] }
		]
	},
	browser_ext: {
		productivity: [
			{ id: 'cat_be_prod_tabs', name: 'Tab Manager', description: 'Organise and search open tabs.', wuCost: 6, revenueBoost: 0, qualityBoost: 14, unlockRequires: [] },
			{ id: 'cat_be_prod_focus', name: 'Focus Mode (site blocker)', description: 'Block distracting sites during focus sessions.', wuCost: 5, revenueBoost: 0, qualityBoost: 12, unlockRequires: [] },
			{ id: 'cat_be_prod_reading', name: 'Reading List', description: 'Save articles to read later.', wuCost: 4, revenueBoost: 0, qualityBoost: 10, unlockRequires: [] },
			{ id: 'cat_be_prod_clipboard', name: 'Clipboard History', description: 'Access recent clipboard entries.', wuCost: 5, revenueBoost: 0, qualityBoost: 12, unlockRequires: [] }
		],
		privacy: [
			{ id: 'cat_be_priv_adblock', name: 'Ad Blocker', description: 'Block ads and tracking scripts.', wuCost: 7, revenueBoost: 0, qualityBoost: 16, unlockRequires: ['security'] },
			{ id: 'cat_be_priv_tracker', name: 'Tracker Blocker', description: 'Block cross-site trackers.', wuCost: 7, revenueBoost: 0, qualityBoost: 16, unlockRequires: ['security'] },
			{ id: 'cat_be_priv_cookies', name: 'Cookie Manager', description: 'View and delete cookies per site.', wuCost: 5, revenueBoost: 0, qualityBoost: 12, unlockRequires: ['security'] },
			{ id: 'cat_be_priv_https', name: 'HTTPS Enforcer', description: 'Upgrade all connections to HTTPS.', wuCost: 4, revenueBoost: 0, qualityBoost: 12, unlockRequires: ['security'] }
		],
		shopping: [
			{ id: 'cat_be_shop_compare', name: 'Price Comparison', description: 'Compare prices across retailers instantly.', wuCost: 8, revenueBoost: 0, qualityBoost: 16, unlockRequires: ['web_basics'] },
			{ id: 'cat_be_shop_coupons', name: 'Coupon Finder', description: 'Automatically apply discount codes at checkout.', wuCost: 6, revenueBoost: 0, qualityBoost: 14, unlockRequires: [] },
			{ id: 'cat_be_shop_history', name: 'Price History Chart', description: 'Show historical price trends for products.', wuCost: 7, revenueBoost: 0, qualityBoost: 14, unlockRequires: ['web_basics'] },
			{ id: 'cat_be_shop_wishlist', name: 'Wishlist Sync', description: 'Sync wishlists across devices.', wuCost: 5, revenueBoost: 0, qualityBoost: 12, unlockRequires: ['cloud_hosting'] }
		],
		developer: [
			{ id: 'cat_be_dev_json', name: 'JSON Formatter', description: 'Pretty-print and explore JSON responses.', wuCost: 4, revenueBoost: 0, qualityBoost: 12, unlockRequires: [] },
			{ id: 'cat_be_dev_api', name: 'API Tester', description: 'Send HTTP requests from the browser.', wuCost: 7, revenueBoost: 0, qualityBoost: 16, unlockRequires: ['web_basics'] },
			{ id: 'cat_be_dev_css', name: 'CSS Inspector', description: 'Live CSS editing and inspection.', wuCost: 5, revenueBoost: 0, qualityBoost: 14, unlockRequires: ['ui_ux'] },
			{ id: 'cat_be_dev_color', name: 'Colour Picker', description: 'Pick any colour from the current page.', wuCost: 3, revenueBoost: 0, qualityBoost: 10, unlockRequires: [] }
		],
		social: [
			{ id: 'cat_be_soc_crosspost', name: 'Cross-Post Tool', description: 'Post to multiple social networks at once.', wuCost: 7, revenueBoost: 0, qualityBoost: 14, unlockRequires: [] },
			{ id: 'cat_be_soc_filter', name: 'Feed Filter', description: 'Filter and clean up social media feeds.', wuCost: 5, revenueBoost: 0, qualityBoost: 12, unlockRequires: [] },
			{ id: 'cat_be_soc_screenshot', name: 'Screenshot Annotator', description: 'Capture and annotate screenshots.', wuCost: 6, revenueBoost: 0, qualityBoost: 14, unlockRequires: [] },
			{ id: 'cat_be_soc_preview', name: 'Link Preview', description: 'Show rich previews for shared links.', wuCost: 4, revenueBoost: 0, qualityBoost: 10, unlockRequires: [] }
		]
	},
	ai_product: {
		writing_assistant: [
			{ id: 'cat_ai_write_grammar', name: 'Grammar & Style Check', description: 'Real-time grammar and style suggestions.', wuCost: 8, revenueBoost: 0, qualityBoost: 16, unlockRequires: ['ai_features'] },
			{ id: 'cat_ai_write_tone', name: 'Tone Rewriter', description: 'Rewrite content in different tones.', wuCost: 8, revenueBoost: 0, qualityBoost: 16, unlockRequires: ['ai_features'] },
			{ id: 'cat_ai_write_longform', name: 'Long-Form Drafting', description: 'AI drafts full articles and documents.', wuCost: 12, revenueBoost: 0, qualityBoost: 20, unlockRequires: ['ai_features'] },
			{ id: 'cat_ai_write_brand', name: 'Brand Voice Training', description: 'Train AI on your brand style guide.', wuCost: 10, revenueBoost: 0, qualityBoost: 18, unlockRequires: ['ai_features'] }
		],
		code_assistant: [
			{ id: 'cat_ai_code_autocomplete', name: 'Autocomplete Engine', description: 'Context-aware code completions.', wuCost: 10, revenueBoost: 0, qualityBoost: 20, unlockRequires: ['ai_features'] },
			{ id: 'cat_ai_code_explainer', name: 'Bug Explainer', description: 'AI explains what bugs do and why they happen.', wuCost: 8, revenueBoost: 0, qualityBoost: 16, unlockRequires: ['ai_features'] },
			{ id: 'cat_ai_code_tests', name: 'Test Generator', description: 'Auto-generate unit tests for your code.', wuCost: 9, revenueBoost: 0, qualityBoost: 18, unlockRequires: ['ai_features'] },
			{ id: 'cat_ai_code_review', name: 'Code Review Bot', description: 'Automated PR review and suggestions.', wuCost: 10, revenueBoost: 0, qualityBoost: 18, unlockRequires: ['ai_features'] }
		],
		image_generation: [
			{ id: 'cat_ai_img_presets', name: 'Style Presets', description: 'One-click artistic style presets.', wuCost: 7, revenueBoost: 0, qualityBoost: 16, unlockRequires: ['ai_features'] },
			{ id: 'cat_ai_img_inpaint', name: 'Inpainting', description: 'Edit specific regions of an image with AI.', wuCost: 10, revenueBoost: 0, qualityBoost: 18, unlockRequires: ['ai_features'] },
			{ id: 'cat_ai_img_batch', name: 'Batch Generation', description: 'Generate multiple images from one prompt.', wuCost: 8, revenueBoost: 0, qualityBoost: 16, unlockRequires: ['ai_features'] },
			{ id: 'cat_ai_img_license', name: 'Commercial Licence Export', description: 'Export images with commercial usage rights.', wuCost: 6, revenueBoost: 0, qualityBoost: 14, unlockRequires: ['monetization'] }
		],
		data_analysis: [
			{ id: 'cat_ai_data_csv', name: 'CSV Analyser', description: 'Upload and analyse CSV data with AI.', wuCost: 8, revenueBoost: 0, qualityBoost: 16, unlockRequires: ['ai_features'] },
			{ id: 'cat_ai_data_charts', name: 'Chart Generator', description: 'Auto-generate charts from your data.', wuCost: 8, revenueBoost: 0, qualityBoost: 16, unlockRequires: ['ai_features'] },
			{ id: 'cat_ai_data_anomaly', name: 'Anomaly Detection', description: 'AI flags outliers and unusual patterns.', wuCost: 10, revenueBoost: 0, qualityBoost: 18, unlockRequires: ['ai_features'] },
			{ id: 'cat_ai_data_nlq', name: 'Natural Language Queries', description: 'Ask questions about your data in plain English.', wuCost: 10, revenueBoost: 0, qualityBoost: 20, unlockRequires: ['ai_features'] }
		],
		customer_support: [
			{ id: 'cat_ai_cs_faq', name: 'FAQ Bot', description: 'AI answers common support questions.', wuCost: 7, revenueBoost: 0, qualityBoost: 16, unlockRequires: ['ai_features'] },
			{ id: 'cat_ai_cs_triage', name: 'Ticket Triage', description: 'Auto-categorise and route support tickets.', wuCost: 8, revenueBoost: 0, qualityBoost: 16, unlockRequires: ['ai_features'] },
			{ id: 'cat_ai_cs_sentiment', name: 'Sentiment Analysis', description: 'Detect customer mood from messages.', wuCost: 8, revenueBoost: 0, qualityBoost: 16, unlockRequires: ['ai_features'] },
			{ id: 'cat_ai_cs_handoff', name: 'Human Handoff', description: 'Seamlessly escalate to a human agent.', wuCost: 6, revenueBoost: 0, qualityBoost: 14, unlockRequires: [] }
		]
	}
};

// API call rates per user per week by platform category
export const API_CALL_RATES: Record<string, number> = {
	social_network: 120,
	developer_platform: 80,
	ecommerce: 50,
	media_streaming: 200,
	productivity_suite: 40,
	fintech: 60
};

// Platform sub-product conversion rates (fraction of shared users who pay for each product type)
export const PLATFORM_CONVERSION_RATES: Partial<Record<ProjectType, number>> = {
	mobile_app: 0.35,
	saas: 0.15,
	desktop_app: 0.20
};

// Which API features unlock which sub-product features
// Map: apiFeatureId → { subProductType → featureIds[] }
export const API_FEATURE_UNLOCK_MAP: Record<string, Partial<Record<ProjectType, string[]>>> = {
	api_auth: {
		mobile_app: ['ma_auth', 'ma_iap'],
		saas: ['saas_auth', 'saas_admin'],
		desktop_app: ['da_sync', 'da_updater']
	},
	api_webhooks: {
		mobile_app: ['ma_social', 'ma_analytics'],
		saas: ['saas_webhooks', 'saas_email'],
		desktop_app: ['da_plugins']
	},
	api_analytics: {
		mobile_app: ['ma_analytics'],
		saas: ['saas_admin']
	},
	api_sdks: {
		mobile_app: ['ma_offline', 'ma_push'],
		saas: ['saas_api', 'saas_csv'],
		desktop_app: ['da_shortcuts', 'da_i18n']
	},
	api_graphql: {
		mobile_app: ['ma_chat'],
		saas: ['saas_ai']
	},
	api_admin: {
		mobile_app: ['ma_dark', 'ma_social'],
		saas: ['saas_branding'],
		desktop_app: ['da_dark']
	},
	api_rate_limit: {
		desktop_app: ['da_offline', 'da_updater']
	}
};

// All feature IDs that require an API unlock (used to filter feature pool for sub-products)
export const ALL_API_GATED_FEATURE_IDS = new Set(
	Object.values(API_FEATURE_UNLOCK_MAP).flatMap((byType) =>
		Object.values(byType).flatMap((ids) => ids ?? [])
	)
);

/**
 * Returns the set of feature IDs a sub-product is allowed to include,
 * based on which API features were complete at sub-product creation time.
 * This is computed once at creation and stored on the project.
 */
export function getUnlockedSubProductFeatures(
	apiCompletedFeatureIds: string[],
	subProductType: ProjectType
): Set<string> {
	const unlocked = new Set<string>();
	for (const apiFeatureId of apiCompletedFeatureIds) {
		const byType = API_FEATURE_UNLOCK_MAP[apiFeatureId];
		if (!byType) continue;
		const featureIds = byType[subProductType];
		if (featureIds) featureIds.forEach((id) => unlocked.add(id));
	}
	return unlocked;
}
