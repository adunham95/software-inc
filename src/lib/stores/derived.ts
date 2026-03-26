import { derived } from 'svelte/store';
import { game } from './gameStore';
import { LAPTOP_TIERS } from '$lib/engine/projects';

export const totalWeeklyRevenue = derived(game, ($game) =>
	$game.projects
		.filter((p) => p.status === 'shipped')
		.reduce((sum, p) => sum + p.weeklyRevenue, 0)
);

export const activeProject = derived(
	game,
	($game) => $game.projects.find((p) => p.status === 'in_development') ?? null
);

export const shippedProjects = derived(game, ($game) =>
	$game.projects.filter((p) => p.status === 'shipped' || p.status === 'dead')
);

export const archivedProjects = derived(game, ($game) =>
	$game.projects.filter((p) => p.status === 'archived')
);

export const activeResearch = derived(game, ($game) => {
	if (!$game.research.inProgress) return null;
	return $game.research.tree.find((n) => n.id === $game.research.inProgress) ?? null;
});

export const wuPerWeek = derived(game, ($game) => {
	const laptopWu = LAPTOP_TIERS[$game.expenses.laptopTier].wuPerWeek;
	const agileBonus = $game.research.completed.includes('agile_process') ? 1 : 0;
	return laptopWu + agileBonus;
});

export const selfHostingWuDrain = derived(game, ($game) =>
	$game.projects
		.filter((p) => p.status === 'shipped' && p.hostingType === 'self')
		.reduce((sum, p) => sum + p.hostingWuDrainPerWeek, 0)
);

export const availableWu = derived(game, ($game) => {
	const laptopWu = LAPTOP_TIERS[$game.expenses.laptopTier].wuPerWeek;
	const agileBonus = $game.research.completed.includes('agile_process') ? 1 : 0;
	const drain = $game.projects
		.filter((p) => p.status === 'shipped' && p.hostingType === 'self')
		.reduce((sum, p) => sum + p.hostingWuDrainPerWeek, 0);
	return laptopWu + agileBonus - drain;
});

export const totalWeeklyExpenses = derived(game, ($game) => {
	const selfCost = $game.expenses.weeklySelfCost;
	const hostingCost = $game.projects
		.filter((p) => p.status === 'shipped' && p.hostingType === 'external')
		.reduce((sum, p) => sum + p.hostingCostPerWeek, 0);
	return selfCost + hostingCost;
});

export const researchWeeksRemaining = derived(game, ($game) => {
	if (!$game.research.inProgress) return 0;
	const node = $game.research.tree.find((n) => n.id === $game.research.inProgress);
	if (!node) return 0;
	const rpPerWeek = 2;
	const totalRpNeeded = node.weeksToComplete * rpPerWeek;
	const remaining = totalRpNeeded - $game.research.progressWu;
	return Math.ceil(remaining / rpPerWeek);
});
