import type { MarketingLevel, CampaignType, CampaignEffect, Project } from '$lib/types';

export const PASSIVE_MARKETING_CONFIG: Record<
	MarketingLevel,
	{ wuPerWeek: number; cashPerWeek: number; growthBoost: number; decayReduction: number }
> = {
	none: { wuPerWeek: 0, cashPerWeek: 0, growthBoost: 0, decayReduction: 0 },
	low: { wuPerWeek: 1, cashPerWeek: 100, growthBoost: 0.05, decayReduction: 0.1 },
	medium: { wuPerWeek: 2, cashPerWeek: 350, growthBoost: 0.15, decayReduction: 0.25 },
	high: { wuPerWeek: 3, cashPerWeek: 900, growthBoost: 0.35, decayReduction: 0.4 }
};

export interface CampaignDef {
	type: CampaignType;
	label: string;
	wuRequired: number;
	cashCost: number;
	effect: CampaignEffect;
}

export const CAMPAIGN_DEFINITIONS: CampaignDef[] = [
	{
		type: 'social_media_blitz',
		label: 'Social Media Blitz',
		wuRequired: 3,
		cashCost: 200,
		effect: { growthMultiplier: 0.2, decayReduction: 0.1, durationWeeks: 4 }
	},
	{
		type: 'press_release',
		label: 'Press Release',
		wuRequired: 2,
		cashCost: 500,
		effect: { growthMultiplier: 0.1, decayReduction: 0.15, durationWeeks: 3 }
	},
	{
		type: 'influencer_deal',
		label: 'Influencer Deal',
		wuRequired: 4,
		cashCost: 1500,
		effect: { growthMultiplier: 0.7, decayReduction: 0.2, durationWeeks: 6 }
	},
	{
		type: 'product_hunt_launch',
		label: 'Product Hunt Launch',
		wuRequired: 5,
		cashCost: 0,
		effect: { growthMultiplier: 0.7, decayReduction: 0.1, durationWeeks: 3 }
	},
	{
		type: 'paid_ads',
		label: 'Paid Ads',
		wuRequired: 1,
		cashCost: 2000,
		effect: { growthMultiplier: 0.2, decayReduction: 0.3, durationWeeks: 5 }
	},
	{
		type: 'paid_ads_targeted',
		label: 'Targeted Paid Ads',
		wuRequired: 2,
		cashCost: 5000,
		effect: { growthMultiplier: 0.25, decayReduction: 0.1, durationWeeks: 6 }
	},
	{
		type: 'content_marketing',
		label: 'Content Marketing',
		wuRequired: 6,
		cashCost: 300,
		effect: { growthMultiplier: 0.4, decayReduction: 0.35, durationWeeks: 8 }
	}
];

export const DECAY_FLOOR = 0.05;

export function calcEffectiveDecayReduction(project: Project): number {
	const passive = PASSIVE_MARKETING_CONFIG[project.marketing.passiveLevel].decayReduction;
	const campaign = isCampaignEffectActive(project)
		? (project.marketing.activeCampaign?.effect.decayReduction ?? 0)
		: 0;
	return passive + campaign;
}

export function calcEffectiveGrowthMultiplier(project: Project): number {
	const passive = PASSIVE_MARKETING_CONFIG[project.marketing.passiveLevel].growthBoost;
	const campaignBoost = isCampaignEffectActive(project)
		? (project.marketing.activeCampaign?.effect.growthMultiplier ?? 0)
		: 0;
	return (1 + passive) * (1 + campaignBoost);
}

export function isCampaignEffectActive(project: Project): boolean {
	const c = project.marketing.activeCampaign;
	return c !== null && c.weeksRemaining !== null && c.weeksRemaining > 0;
}

export function isCampaignInvesting(project: Project): boolean {
	const c = project.marketing.activeCampaign;
	return c !== null && c.wuInvested < c.wuRequired;
}
