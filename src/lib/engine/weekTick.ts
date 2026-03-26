import type { GameState, Project, ProjectFeature, Platform } from '$lib/types';
import { calcInitialRevenue, calcInitialSubscribers, tickShippedProject } from './pricing';
import { maybeFireEvent } from './events';
import { LAPTOP_TIERS, HOSTING_EXTERNAL_COST, HOSTING_WU_DRAIN, NEEDS_HOSTING, AD_RATE_PER_USER, API_CALL_RATES, PLATFORM_CONVERSION_RATES } from './projects';
import { generateBug, calcBugsThisWeek, checkEscalation, completePatch, calcWeeklyTraffic } from './bugs';
import {
	PASSIVE_MARKETING_CONFIG,
	CAMPAIGN_DEFINITIONS,
	calcEffectiveDecayReduction,
	calcEffectiveGrowthMultiplier,
	isCampaignInvesting
} from './marketing';

function getBaseLaptopWu(state: GameState): number {
	return LAPTOP_TIERS[state.expenses.laptopTier].wuPerWeek;
}

function getSelfHostingWuDrain(state: GameState): number {
	return state.projects
		.filter((p) => p.status === 'shipped' && p.hostingType === 'self')
		.reduce((sum, p) => sum + p.hostingWuDrainPerWeek, 0);
}

function getPassiveMarketingWuDrain(state: GameState): number {
	return state.projects
		.filter((p) => p.status === 'shipped')
		.reduce((sum, p) => sum + PASSIVE_MARKETING_CONFIG[p.marketing.passiveLevel].wuPerWeek, 0);
}

function getCampaignWuDrain(state: GameState): number {
	return state.projects
		.filter((p) => p.status === 'shipped' && isCampaignInvesting(p))
		.length; // 1 WU/wk per active campaign being invested
}

function getAvailableWu(state: GameState): number {
	const base = getBaseLaptopWu(state);
	const agileBonus = state.research.completed.includes('agile_process') ? 1 : 0;
	const selfHostDrain = getSelfHostingWuDrain(state);
	const passiveMarketingDrain = getPassiveMarketingWuDrain(state);
	const campaignDrain = getCampaignWuDrain(state);
	return base + agileBonus - selfHostDrain - passiveMarketingDrain - campaignDrain;
}

function getRpPerWeek(): number {
	return 2;
}

function tickActiveProject(project: Project, wu: number): Project {
	if (project.status !== 'in_development') return project;

	let p = { ...project, features: project.features.map((f) => ({ ...f })) };
	let remainingWu = wu;

	// Find current in-progress or next not-started feature
	for (let i = 0; i < p.features.length && remainingWu > 0; i++) {
		const f: ProjectFeature = p.features[i];
		if (f.status === 'complete') continue;

		if (f.status === 'not_started') {
			p.features[i] = { ...f, status: 'in_progress' };
		}

		const needed = f.wuCost - p.features[i].progressWu;
		const invest = Math.min(remainingWu, needed);
		p.features[i].progressWu += invest;
		remainingWu -= invest;

		if (p.features[i].progressWu >= p.features[i].wuCost) {
			p.features[i].status = 'complete';
			p.features[i].progressWu = p.features[i].wuCost;
			p.quality = Math.min(100, p.quality + p.features[i].qualityBoost);
		} else {
			// Still working on this feature, stop here
			break;
		}
	}

	// Update overall progress
	const totalWu = p.features.reduce((s, f) => s + f.wuCost, 0);
	const doneWu = p.features.reduce((s, f) => s + f.progressWu, 0);
	p.progress = totalWu > 0 ? Math.min(100, (doneWu / totalWu) * 100) : 0;

	return p;
}

function makeNotif(week: number, message: string, type: 'success' | 'warning' | 'info' | 'danger') {
	return { id: crypto.randomUUID(), week, message, type };
}

export function advanceWeek(state: GameState): GameState {
	let s = structuredClone(state) as GameState;
	const week = s.meta.week;
	const availableWu = getAvailableWu(s);
	const rp = getRpPerWeek();

	// 1. Advance active patch jobs (consume WU before project development, split evenly)
	let wuForProject = availableWu;
	if (s.activePatchJobs.length > 0) {
		const wuPerPatch = availableWu / s.activePatchJobs.length;
		wuForProject = 0;
		s.activePatchJobs = s.activePatchJobs.map((job) => ({
			...job,
			wuInvested: job.wuInvested + wuPerPatch
		}));
		const completedIds = s.activePatchJobs
			.filter((job) => job.wuInvested >= job.wuRequired)
			.map((job) => job.projectId);
		for (const pid of completedIds) {
			s = completePatch(s, pid);
		}
	}

	// 2. Tick active development projects — priority queue: newest weekStarted first
	//    Each project gets as much WU as it needs; remainder flows to the next.
	const activeProjects = s.projects
		.filter((p) => p.status === 'in_development')
		.sort((a, b) => b.weekStarted - a.weekStarted);

	let wuRemaining = wuForProject;
	let newPendingHostingId: string | null = s.pendingHostingChoiceId;

	for (const activeProject of activeProjects) {
		if (wuRemaining <= 0) break;

		const wuBefore = activeProject.features.reduce((sum, f) => sum + f.progressWu, 0);
		const updated = tickActiveProject(activeProject, wuRemaining);
		const wuAfter = updated.features.reduce((sum, f) => sum + f.progressWu, 0);
		wuRemaining -= wuAfter - wuBefore;

		// Check if all features complete → ship!
		const allComplete = updated.features.every((f) => f.status === 'complete');
		if (allComplete || updated.progress >= 100) {
			const needsHosting = NEEDS_HOSTING.includes(updated.type);
			const externalCost = HOSTING_EXTERNAL_COST[updated.type] ?? 0;
			const wuDrain = HOSTING_WU_DRAIN[updated.type] ?? 0;

			let shipped = {
				...updated,
				status: 'shipped' as const,
				weekShipped: week,
				weeklyRevenue: calcInitialRevenue(updated, s.meta.reputation),
				activeSubscribers: calcInitialSubscribers(updated, s.meta.reputation),
				revenueDecayRate: s.research.completed.includes('devops') ? 0.25 : 0.5,
				weeksOnMarket: 0,
				revenueHistory: [],
				hostingType: needsHosting ? ('external' as const) : ('none' as const),
				hostingCostPerWeek: needsHosting ? externalCost : 0,
				hostingWuDrainPerWeek: needsHosting ? wuDrain : 0
			};

			// Major release: archive parent, carry over unfixed bugs, apply launch boost
			if (shipped.isMajorRelease && shipped.parentProjectId) {
				const parent = s.projects.find((p) => p.id === shipped.parentProjectId);
				if (parent) {
					s.projects = s.projects.map((p) =>
						p.id === parent.id
							? { ...p, status: 'archived' as const, archivedWeek: week }
							: p
					);
					s.meta = { ...s.meta, reputation: Math.min(100, s.meta.reputation + 5) };
					const addressedBugIds = new Set(
						shipped.features
							.filter((f) => f.id.startsWith('bugfix_'))
							.map((f) => f.id.slice('bugfix_'.length))
					);
					const carryOverBugs = parent.bugs.filter(
						(b) => !b.fixed && !addressedBugIds.has(b.id)
					);
					const launchBoostFactor = 1 + (s.meta.reputation / 100) * 0.3;
					shipped = {
						...shipped,
						bugs: [...shipped.bugs, ...carryOverBugs],
						weeklyRevenue: Math.round(shipped.weeklyRevenue * launchBoostFactor),
						activeSubscribers: Math.round(shipped.activeSubscribers * launchBoostFactor)
					};
					s.notifications = [
						makeNotif(
							week,
							`🎉 Major Release! "${shipped.name}" launched — Reputation +5. Previous version archived.`,
							'success'
						),
						...s.notifications
					].slice(0, 50);
				}
			}

			s.projects = s.projects.map((p) => (p.id === shipped.id ? shipped : p));

			if (needsHosting) {
				newPendingHostingId = shipped.id;
			}

			s.notifications = [
				makeNotif(
					week,
					`🚀 "${shipped.name}" shipped! Estimated $${Math.round(shipped.weeklyRevenue).toLocaleString()}/wk revenue.`,
					'success'
				),
				...s.notifications
			].slice(0, 50);
		} else {
			s.projects = s.projects.map((p) => (p.id === updated.id ? updated : p));
		}
	}

	s.pendingHostingChoiceId = newPendingHostingId;

	// 3. Tick active research
	if (s.research.inProgress) {
		s.research.progressWu += rp;
		const node = s.research.tree.find((n) => n.id === s.research.inProgress);
		if (node && s.research.progressWu >= node.weeksToComplete * rp) {
			s.research.completed = [...s.research.completed, s.research.inProgress];
			s.notifications = [
				makeNotif(
					week,
					`🔬 Research complete: "${node.name}"! ${node.unlocks}`,
					'success'
				),
				...s.notifications
			].slice(0, 50);
			s.research.inProgress = null;
			s.research.progressWu = 0;
		}
	}

	// 4. Deduct self/living costs
	const selfCost = s.expenses.weeklySelfCost;
	s.meta.cash -= selfCost;

	// 5. Accumulate bugs on all shipped/dead products
	s.projects = s.projects.map((p) => {
		if (p.status !== 'shipped' && p.status !== 'dead') return p;
		let proj = { ...p, bugs: [...p.bugs] };
		proj.bugAccumulator += calcBugsThisWeek(proj);
		while (proj.bugAccumulator >= 1) {
			proj.bugs = [...proj.bugs, generateBug(proj, week)];
			proj.bugAccumulator -= 1;
		}
		return proj;
	});

	// 6. Advance active campaign WU per product (1 WU/wk each)
	s.projects = s.projects.map((p) => {
		if (p.status !== 'shipped' || !p.marketing.activeCampaign) return p;
		const campaign = { ...p.marketing.activeCampaign };
		if (campaign.wuInvested < campaign.wuRequired) {
			campaign.wuInvested += 1;
			if (campaign.wuInvested >= campaign.wuRequired) {
				// Campaign complete — activate effect
				campaign.weeksRemaining = campaign.effect.durationWeeks;
				s.notifications = [
					makeNotif(
						week,
						`📣 "${p.name}" — ${CAMPAIGN_DEFINITIONS.find((c) => c.type === campaign.type)?.label ?? campaign.type} campaign complete! Effect active for ${campaign.effect.durationWeeks} weeks.`,
						'success'
					),
					...s.notifications
				].slice(0, 50);
			}
		}
		return { ...p, marketing: { ...p.marketing, activeCampaign: campaign } };
	});

	// 7. Deduct external hosting costs + apply outage risk for self-hosted; collect revenue
	let externalHostingTotal = 0;
	let passiveMarketingCashTotal = 0;
	let weeklyIncome = 0;

	s.projects = s.projects.map((p) => {
		if (p.status !== 'shipped') return p;

		// Outage check for self-hosted
		const outageRisk = s.research.completed.includes('devops') ? 0.02 : 0.05;
		if (p.hostingType === 'self' && Math.random() < outageRisk) {
			s.notifications = [
				makeNotif(
					week,
					`⚡ "${p.name}" went down — self-hosted server crashed. No revenue this week.`,
					'danger'
				),
				...s.notifications
			].slice(0, 50);
			return p;
		}

		// External hosting cost
		if (p.hostingType === 'external') {
			externalHostingTotal += p.hostingCostPerWeek;
			s.meta.cash -= p.hostingCostPerWeek;
		}

		// Tick revenue with marketing modifiers
		const decayReduction = calcEffectiveDecayReduction(p);
		const growthMultiplier = calcEffectiveGrowthMultiplier(p);
		let ticked = tickShippedProject(p, decayReduction, growthMultiplier);

		// Apply bug revenue impact (each bug's revenueImpact is a fraction of weekly revenue)
		const unfixedBugs = ticked.bugs.filter((b) => !b.fixed);
		const bugLoss = unfixedBugs.reduce((sum, b) => sum + b.revenueImpact * ticked.weeklyRevenue, 0);

		// Escalation revenue penalty
		const unfixedCount = unfixedBugs.length;
		let escalationPenalty = 0;
		if (unfixedCount >= 6) {
			escalationPenalty = ticked.weeklyRevenue * 0.04 * unfixedCount;
		} else if (unfixedCount >= 3) {
			escalationPenalty = ticked.weeklyRevenue * 0.02 * unfixedCount;
		}

		ticked = {
			...ticked,
			weeklyRevenue: Math.max(0, ticked.weeklyRevenue - bugLoss - escalationPenalty)
		};

		// Ad revenue (if advertising feature is complete)
		const hasAds = ticked.features.some((f) => f.id === 'advertising' && f.status === 'complete');
		let adRevenue = 0;
		if (hasAds) {
			const traffic = calcWeeklyTraffic(ticked);
			adRevenue = Math.round(traffic * AD_RATE_PER_USER[ticked.type]);
		}
		ticked = { ...ticked, adRevenue };

		// Passive marketing cash cost
		const passiveCashCost = PASSIVE_MARKETING_CONFIG[p.marketing.passiveLevel].cashPerWeek;
		passiveMarketingCashTotal += passiveCashCost;

		weeklyIncome += ticked.weeklyRevenue + adRevenue;
		return ticked;
	});

	// 8. Deduct passive marketing cash costs
	s.meta.cash -= passiveMarketingCashTotal;

	// 9. Tick down active campaign effect durations (after revenue applied)
	s.projects = s.projects.map((p) => {
		if (p.status !== 'shipped' || !p.marketing.activeCampaign) return p;
		const campaign = { ...p.marketing.activeCampaign };
		if (campaign.weeksRemaining !== null) {
			campaign.weeksRemaining--;
			if (campaign.weeksRemaining <= 0) {
				return { ...p, marketing: { ...p.marketing, activeCampaign: null } };
			}
		}
		return { ...p, marketing: { ...p.marketing, activeCampaign: campaign } };
	});

	s.meta.cash += weeklyIncome;
	s.meta.totalEarned += weeklyIncome;

	// 10. Check escalation thresholds (bugs → reputation damage / death)
	s = checkEscalation(s);

	// 11. Weekly expense summary notification
	const netChange = weeklyIncome - selfCost - externalHostingTotal - passiveMarketingCashTotal;
	const sign = netChange >= 0 ? '+' : '';
	const marketingLine = passiveMarketingCashTotal > 0 ? ` · Marketing: -$${passiveMarketingCashTotal.toLocaleString()}` : '';
	s.notifications = [
		makeNotif(
			week,
			`📊 Week ${week} — Revenue: +$${Math.round(weeklyIncome).toLocaleString()} · Living: -$${selfCost.toLocaleString()} · Hosting: -$${externalHostingTotal.toLocaleString()}${marketingLine} · Net: ${sign}$${Math.round(netChange).toLocaleString()}`,
			netChange >= 0 ? 'info' : 'warning'
		),
		...s.notifications
	].slice(0, 50);

	// 12. WU warning if overloaded
	if (availableWu <= 0) {
		s.notifications = [
			makeNotif(
				week,
				`⚠️ WU overcommitted — reduce marketing or self-hosting.`,
				'danger'
			),
			...s.notifications
		].slice(0, 50);
	}

	// 10. Advance time
	s.meta.week = week + 1;
	if (s.meta.week > 52) {
		s.meta.week = 1;
		s.meta.year += 1;
	}

	// 11. Tick platforms (shared users, API revenue, bug spread, brand)
	s = tickPlatforms(s, week);

	// 12. Random events
	s = maybeFireEvent(s);

	return s;
}

// ── Platform tick helpers ─────────────────────────────────────────────────────

function getApiProject(platform: Platform, projects: Project[]): Project | undefined {
	return platform.apiProjectId ? projects.find((p) => p.id === platform.apiProjectId) : undefined;
}

function getSubProducts(platform: Platform, projects: Project[]): Project[] {
	return projects.filter((p) => platform.subProductIds.includes(p.id) && p.status === 'shipped');
}

function apiHasCriticalBugs(api: Project): boolean {
	return api.bugs.some((b) => !b.fixed && b.severity === 'critical');
}

function tickSharedUsers(platform: Platform, subProducts: Project[]): Platform {
	let weeklyNew = 0;
	let weeklyChurned = 0;
	for (const p of subProducts) {
		// Use subscriber growth delta as user acquisition proxy
		const growthRate = 0.02 + (p.quality / 100) * 0.03; // 2–5% per week
		const churnRate = Math.max(0, 0.01 + (p.bugs.filter((b) => !b.fixed).length * 0.005));
		weeklyNew += Math.round(platform.sharedUsers * growthRate);
		weeklyChurned += Math.round(platform.sharedUsers * churnRate);
	}
	// New platform — seed initial users if 0 and there are live sub-products
	if (platform.sharedUsers === 0 && subProducts.length > 0) {
		weeklyNew += 100;
	}
	const newTotal = Math.max(0, platform.sharedUsers + weeklyNew - weeklyChurned);
	return { ...platform, sharedUsers: newTotal, weeklyNewUsers: weeklyNew, weeklyChurnedUsers: weeklyChurned };
}

function tickBrandStrength(platform: Platform, projects: Project[]): Platform {
	const landingPage = projects.find(
		(p) => p.platformId === platform.id && p.isLandingPage && p.status === 'shipped'
	);
	const apiProject = getApiProject(platform, projects);
	const hasAdminConsole = apiProject?.features.some(
		(f) => f.id === 'api_admin' && f.status === 'complete'
	) ?? false;

	const brandGrowth =
		platform.sharedUsers / 10000 +
		(landingPage ? landingPage.quality / 200 : 0) +
		(hasAdminConsole ? 0.5 : 0);

	const newBrand = Math.min(100, platform.brandStrength + brandGrowth);

	const landingPageMarketingBonus = landingPage
		? (landingPage.quality / 100) * 0.25
		: 0;
	const marketingBonus = (newBrand / 100) * 0.5 + landingPageMarketingBonus;

	return { ...platform, brandStrength: newBrand, marketingBonus };
}

function tickApiRevenue(platform: Platform, api: Project): [Platform, Project] {
	const callRate = API_CALL_RATES[platform.apiCategory] ?? 60;
	const baseRevenue = Math.round(platform.sharedUsers * callRate * api.price);

	// Apply feature revenue boosts
	const featureBoost = api.features
		.filter((f) => f.status === 'complete')
		.reduce((sum, f) => sum + f.revenueBoost / 100, 0);
	const apiRevenue = Math.round(baseRevenue * (1 + featureBoost));

	const updatedApi = { ...api, weeklyRevenue: apiRevenue };
	return [platform, updatedApi];
}

function rollBugSpread(
	platform: Platform,
	projects: Project[],
	researchCompleted: string[],
	week: number
): { projects: Project[]; notifs: ReturnType<typeof makeNotif>[] } {
	const subProducts = projects.filter(
		(p) => platform.subProductIds.includes(p.id) && p.status === 'shipped'
	);
	let updatedProjects = [...projects];
	const notifs: ReturnType<typeof makeNotif>[] = [];

	// Spread chance per unfixed major/critical bug
	const baseSpread = researchCompleted.includes('security') ? 0.04 : 0.08;
	const apiProject = getApiProject(platform, projects);
	const hasRateLimit = apiProject?.features.some(
		(f) => f.id === 'api_rate_limit' && f.status === 'complete'
	);
	const spreadChance = hasRateLimit ? 0.03 : baseSpread;

	for (const source of subProducts) {
		const spreadBugs = source.bugs.filter(
			(b) => !b.fixed && (b.severity === 'major' || b.severity === 'critical')
		);
		for (const _bug of spreadBugs) {
			if (Math.random() < spreadChance) {
				const targets = subProducts.filter((p) => p.id !== source.id);
				if (targets.length === 0) continue;
				const target = targets[Math.floor(Math.random() * targets.length)];
				const newBug = generateBug({ ...target, quality: Math.max(0, target.quality - 10) }, week);
				updatedProjects = updatedProjects.map((p) =>
					p.id === target.id ? { ...p, bugs: [...p.bugs, { ...newBug, severity: 'minor' as const }] } : p
				);
				notifs.push(
					makeNotif(
						week,
						`🐛 A bug in "${source.name}" has caused an issue in "${target.name}".`,
						'warning'
					)
				);
			}
		}
	}
	return { projects: updatedProjects, notifs };
}

function applyChurnContagion(platform: Platform, projects: Project[]): Platform {
	const subProducts = projects.filter(
		(p) => platform.subProductIds.includes(p.id) && p.status === 'shipped'
	);
	let extraChurn = 0;
	for (const p of subProducts) {
		const unfixedCount = p.bugs.filter((b) => !b.fixed).length;
		const hasOldCritical = p.bugs.some(
			(b) => !b.fixed && b.severity === 'critical'
		);
		if (unfixedCount >= 6 || hasOldCritical) {
			extraChurn += platform.sharedUsers * 0.02;
		}
	}
	const newChurned = Math.round(platform.weeklyChurnedUsers + extraChurn);
	const newUsers = Math.max(0, platform.sharedUsers - extraChurn);
	return { ...platform, sharedUsers: Math.round(newUsers), weeklyChurnedUsers: newChurned };
}

function tickPlatforms(s: GameState, week: number): GameState {
	if (!s.platforms || s.platforms.length === 0) return s;

	let projects = [...s.projects];
	const notifs: ReturnType<typeof makeNotif>[] = [];

	const platforms = s.platforms.map((platform) => {
		const api = getApiProject(platform, projects);

		// Determine platform status
		if (!api || api.status !== 'shipped') {
			return { ...platform, status: 'building' as const };
		}

		const subProducts = getSubProducts(platform, projects);
		const isOffline = api.bugs.filter((b) => !b.fixed).length >= 10;
		const isDegraded = !isOffline && apiHasCriticalBugs(api);

		if (isOffline) {
			// Zero out sub-product revenue
			projects = projects.map((p) =>
				platform.subProductIds.includes(p.id) ? { ...p, weeklyRevenue: 0, adRevenue: 0 } : p
			);
			notifs.push(
				makeNotif(
					week,
					`🔴 ${platform.name} API is down. All products offline.`,
					'danger'
				)
			);
			return { ...platform, status: 'offline' as const };
		}

		// Degraded penalty
		if (isDegraded) {
			projects = projects.map((p) =>
				platform.subProductIds.includes(p.id)
					? { ...p, weeklyRevenue: Math.round(p.weeklyRevenue * 0.7) }
					: p
			);
			notifs.push(
				makeNotif(
					week,
					`⚠️ ${platform.name} API is degraded. Products running at reduced capacity.`,
					'warning'
				)
			);
		}

		// Tick shared users
		let updated = tickSharedUsers(platform, subProducts);

		// Apply churn contagion
		updated = applyChurnContagion(updated, projects);

		// Update sub-product revenue using shared user base + conversion rates
		projects = projects.map((p) => {
			if (!platform.subProductIds.includes(p.id) || p.status !== 'shipped') return p;
			const convRate = PLATFORM_CONVERSION_RATES[p.type] ?? 0;
			const featureRevBoost = p.features
				.filter((f) => f.status === 'complete')
				.reduce((sum, f) => sum + f.revenueBoost, 0);
			const platformBonusPct = updated.marketingBonus;
			const base = updated.sharedUsers * convRate * p.price;
			const rev = Math.round((base + featureRevBoost) * (1 + platformBonusPct));
			return { ...p, weeklyRevenue: rev, platformBonus: Math.round(base * platformBonusPct) };
		});

		// Tick API revenue
		const [updatedPlatform, updatedApi] = tickApiRevenue(updated, api);
		projects = projects.map((p) => (p.id === updatedApi.id ? updatedApi : p));

		// Bug spread
		const spreadResult = rollBugSpread(updatedPlatform, projects, s.research.completed, week);
		projects = spreadResult.projects;
		notifs.push(...spreadResult.notifs);

		// Brand strength
		const withBrand = tickBrandStrength(updatedPlatform, projects);

		const newStatus = subProducts.length > 0 ? 'live' : 'building';
		return { ...withBrand, status: newStatus as Platform['status'] };
	});

	return {
		...s,
		platforms,
		projects,
		notifications: [...notifs, ...s.notifications].slice(0, 50)
	};
}

export { getAvailableWu, getBaseLaptopWu, getSelfHostingWuDrain };
