import type { Project, ProjectType } from '$lib/types';
import { PRICE_RANGES } from './projects';

export function getMaxPrice(type: ProjectType, model: 'one_time' | 'subscription'): number {
	return model === 'one_time' ? PRICE_RANGES[type].oneTime[1] : PRICE_RANGES[type].subscription[1];
}

export function getPricePenalty(
	price: number,
	type: ProjectType,
	model: 'one_time' | 'subscription'
): number {
	const max = getMaxPrice(type, model);
	return Math.max(0.2, 1 - (price / max) * 0.8);
}

export function calcInitialRevenue(project: Project, reputation: number): number {
	const qualityFactor = project.quality / 100;
	const repFactor = reputation / 100;
	const featureRevenue = project.features
		.filter((f) => f.status === 'complete')
		.reduce((sum, f) => sum + f.revenueBoost, 0);

	if (project.pricingModel === 'one_time') {
		const demandScore = qualityFactor * 0.6 + repFactor * 0.4;
		const baseSales = demandScore * 20;
		const pricePenalty = getPricePenalty(project.price, project.type, 'one_time');
		return Math.round(baseSales * pricePenalty) * project.price + featureRevenue;
	} else {
		const initialSubs = Math.round((qualityFactor * 0.6 + repFactor * 0.4) * 500);
		return initialSubs * project.price + featureRevenue;
	}
}

export function calcInitialSubscribers(project: Project, reputation: number): number {
	if (project.pricingModel !== 'subscription') return 0;
	const qualityFactor = project.quality / 100;
	const repFactor = reputation / 100;
	return Math.round((qualityFactor * 0.6 + repFactor * 0.4) * 500);
}

export function tickShippedProject(project: Project): Project {
	const p = { ...project, features: [...project.features] };

	if (p.pricingModel === 'subscription') {
		const churnRate = 0.03 - (p.quality / 100) * 0.015;
		const newSubsRate = Math.max(0, 0.05 - p.weeksOnMarket * 0.001);
		const churn = Math.floor(p.activeSubscribers * churnRate);
		const newSubs = Math.floor(p.activeSubscribers * newSubsRate);
		p.activeSubscribers = Math.max(0, p.activeSubscribers - churn + newSubs);
		p.weeklyRevenue = p.activeSubscribers * p.price;
	} else {
		p.weeklyRevenue = p.weeklyRevenue * (1 - p.revenueDecayRate / 100);
	}

	p.revenueHistory = [...p.revenueHistory.slice(-7), p.weeklyRevenue];
	p.totalRevenue += p.weeklyRevenue;
	p.weeksOnMarket++;
	return p;
}

export function estimateWeeklyRevenue(
	type: ProjectType,
	pricingModel: 'one_time' | 'subscription',
	price: number,
	featureRevenueBoost: number,
	quality: number,
	reputation: number
): number {
	const qualityFactor = quality / 100;
	const repFactor = reputation / 100;

	if (pricingModel === 'one_time') {
		const demandScore = qualityFactor * 0.6 + repFactor * 0.4;
		const baseSales = demandScore * 20;
		const pricePenalty = getPricePenalty(price, type, 'one_time');
		return Math.round(Math.round(baseSales * pricePenalty) * price + featureRevenueBoost);
	} else {
		const initialSubs = Math.round((qualityFactor * 0.6 + repFactor * 0.4) * 500);
		return Math.round(initialSubs * price + featureRevenueBoost);
	}
}
