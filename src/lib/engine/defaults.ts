import type { GameState } from '$lib/types';
import { RESEARCH_TREE } from './research';

export function defaultGameState(): GameState {
	return {
		meta: {
			companyName: 'My Startup',
			week: 1,
			year: 1,
			cash: 50000,
			reputation: 10,
			totalEarned: 0
		},
		projects: [],
		research: {
			completed: [],
			inProgress: null,
			progressWu: 0,
			tree: RESEARCH_TREE
		},
		notifications: [
			{
				id: crypto.randomUUID(),
				week: 1,
				message: 'Welcome! Your startup journey begins. Build your first product.',
				type: 'info'
			}
		],
		expenses: {
			laptopTier: 1,
			selfCostTier: 'bedroom',
			weeklySelfCost: 200
		},
		pendingHostingChoiceId: null
	};
}
