import { derived } from 'svelte/store';
import { game } from './gameStore';

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
	$game.projects.filter((p) => p.status === 'shipped')
);

export const activeResearch = derived(game, ($game) => {
	if (!$game.research.inProgress) return null;
	return $game.research.tree.find((n) => n.id === $game.research.inProgress) ?? null;
});

export const wuPerWeek = derived(game, ($game) =>
	$game.research.completed.includes('agile_process') ? 6 : 5
);

export const researchWeeksRemaining = derived(game, ($game) => {
	if (!$game.research.inProgress) return 0;
	const node = $game.research.tree.find((n) => n.id === $game.research.inProgress);
	if (!node) return 0;
	const rpPerWeek = 2;
	const totalRpNeeded = node.weeksToComplete * rpPerWeek;
	const remaining = totalRpNeeded - $game.research.progressWu;
	return Math.ceil(remaining / rpPerWeek);
});
