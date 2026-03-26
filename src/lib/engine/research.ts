import type { ResearchNode } from '$lib/types';

export const RESEARCH_TREE: ResearchNode[] = [
	{
		id: 'web_basics',
		name: 'Web Basics',
		description: 'Master the fundamentals of web development.',
		weeksToComplete: 2,
		upfrontCost: 500,
		unlocks: 'Unlocks SaaS & Desktop App projects',
		requires: [],
		category: 'frontend'
	},
	{
		id: 'mobile_dev',
		name: 'Mobile Dev',
		description: 'Learn to build native mobile applications.',
		weeksToComplete: 3,
		upfrontCost: 1000,
		unlocks: 'Unlocks Mobile App projects',
		requires: [],
		category: 'mobile'
	},
	{
		id: 'cloud_hosting',
		name: 'Cloud Hosting',
		description: 'Deploy and scale apps in the cloud.',
		weeksToComplete: 4,
		upfrontCost: 2500,
		unlocks: '+20% revenue on SaaS, unlocks cloud features',
		requires: ['web_basics'],
		category: 'infrastructure'
	},
	{
		id: 'agile_process',
		name: 'Agile Process',
		description: 'Ship faster with iterative development practices.',
		weeksToComplete: 2,
		upfrontCost: 300,
		unlocks: '+1 WU/week productivity',
		requires: [],
		category: 'backend'
	},
	{
		id: 'ui_ux',
		name: 'UI/UX Design',
		description: 'Design beautiful, intuitive interfaces.',
		weeksToComplete: 3,
		upfrontCost: 800,
		unlocks: 'Unlocks design features, +10 quality on all projects',
		requires: ['web_basics'],
		category: 'frontend'
	},
	{
		id: 'ai_features',
		name: 'AI Features',
		description: 'Integrate machine learning into your products.',
		weeksToComplete: 5,
		upfrontCost: 8000,
		unlocks: 'Unlocks AI Product type + AI features',
		requires: ['cloud_hosting'],
		category: 'ai'
	},
	{
		id: 'devops',
		name: 'DevOps',
		description: 'Automate deployments and reduce downtime.',
		weeksToComplete: 4,
		upfrontCost: 3000,
		unlocks: '-50% revenue decay rate, -60% self-hosting outage risk',
		requires: ['cloud_hosting'],
		category: 'infrastructure'
	},
	{
		id: 'security',
		name: 'Security Hardening',
		description: 'Protect your users and infrastructure.',
		weeksToComplete: 3,
		upfrontCost: 1500,
		unlocks: 'Unlocks auth features, -30% bug rate',
		requires: ['web_basics'],
		category: 'backend'
	},
	{
		id: 'monetization',
		name: 'Monetization Engine',
		description: 'Optimize pricing and revenue streams.',
		weeksToComplete: 3,
		upfrontCost: 1000,
		unlocks: 'Unlocks In-App Purchases, +25% revenue',
		requires: ['agile_process'],
		category: 'backend'
	}
];
