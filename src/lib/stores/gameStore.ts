import { writable } from 'svelte/store';
import type { GameState } from '$lib/types';
import { defaultGameState } from '$lib/engine/defaults';

const SAVE_KEY = 'startup_inc_save';

function migrateSave(raw: GameState): GameState {
	const defaults = defaultGameState();
	// Add expenses if missing (v1 → v1.1 migration)
	if (!raw.expenses) {
		raw = { ...raw, expenses: defaults.expenses };
	}
	// Add pendingHostingChoiceId if missing
	if (raw.pendingHostingChoiceId === undefined) {
		raw = { ...raw, pendingHostingChoiceId: null };
	}
	// Add hosting fields to existing projects if missing
	raw = {
		...raw,
		projects: raw.projects.map((p) => ({
			...p,
			hostingType: p.hostingType ?? ('none' as const),
			hostingCostPerWeek: p.hostingCostPerWeek ?? 0,
			hostingWuDrainPerWeek: p.hostingWuDrainPerWeek ?? 0
		}))
	};
	// Add upfrontCost to research tree nodes if missing (merge with defaults)
	raw = {
		...raw,
		research: {
			...raw.research,
			tree: defaults.research.tree
		}
	};
	return raw;
}

function loadSave(): GameState {
	if (typeof localStorage === 'undefined') return defaultGameState();
	const raw = localStorage.getItem(SAVE_KEY);
	if (!raw) return defaultGameState();
	const parsed = JSON.parse(raw) as GameState;
	return migrateSave(parsed);
}

export const game = writable<GameState>(loadSave());

game.subscribe((state) => {
	if (typeof localStorage !== 'undefined') {
		localStorage.setItem(SAVE_KEY, JSON.stringify(state));
	}
});

export function resetGame() {
	if (typeof localStorage !== 'undefined') {
		localStorage.removeItem(SAVE_KEY);
	}
	game.set(defaultGameState());
}
