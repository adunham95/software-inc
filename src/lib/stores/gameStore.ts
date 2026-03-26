import { writable } from 'svelte/store';
import type { GameState } from '$lib/types';
import { defaultGameState } from '$lib/engine/defaults';

const SAVE_KEY = 'startup_inc_save';

function loadSave(): GameState {
	if (typeof localStorage === 'undefined') return defaultGameState();
	const raw = localStorage.getItem(SAVE_KEY);
	return raw ? (JSON.parse(raw) as GameState) : defaultGameState();
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
