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
	// Add activePatchJob if missing
	if (raw.activePatchJob === undefined) {
		raw = { ...raw, activePatchJob: null };
	}
	// Add hosting fields to existing projects if missing
	// Also add all new fields from Categories + Bugs specs
	raw = {
		...raw,
		projects: raw.projects.map((p) => ({
			...p,
			hostingType: p.hostingType ?? ('none' as const),
			hostingCostPerWeek: p.hostingCostPerWeek ?? 0,
			hostingWuDrainPerWeek: p.hostingWuDrainPerWeek ?? 0,
			// Categories spec
			category: p.category ?? null,
			adRevenue: p.adRevenue ?? 0,
			// Bugs spec
			bugs: p.bugs ?? [],
			bugAccumulator: p.bugAccumulator ?? 0,
			totalBugsFixed: p.totalBugsFixed ?? 0,
			lastPatchedWeek: p.lastPatchedWeek ?? null,
			version: p.version ?? '1.0',
			parentProjectId: p.parentProjectId ?? null,
			isMajorRelease: p.isMajorRelease ?? false,
			archivedWeek: p.archivedWeek ?? null,
			// Marketing spec
			marketing: p.marketing ?? {
				passiveLevel: 'none',
				activeCampaign: null,
				campaignHistory: []
			}
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
