import type { GameState, Notification } from '$lib/types';

function makeNotif(
	week: number,
	message: string,
	type: Notification['type']
): Notification {
	return { id: crypto.randomUUID(), week, message, type };
}

export function maybeFireEvent(state: GameState): GameState {
	if (Math.random() > 1 / 8) return state;

	const shippedProjects = state.projects.filter((p) => p.status === 'shipped');
	const week = state.meta.week;

	const events = [
		// Viral Moment
		() => {
			if (!shippedProjects.length) return null;
			const target = shippedProjects[Math.floor(Math.random() * shippedProjects.length)];
			return {
				projects: state.projects.map((p) =>
					p.id === target.id ? { ...p, weeklyRevenue: p.weeklyRevenue + 500 } : p
				),
				notif: makeNotif(
					week,
					`🚀 Viral Moment! "${target.name}" is trending — +$500/wk for 4 weeks!`,
					'success'
				)
			};
		},
		// Critical Bug
		() => {
			if (!shippedProjects.length) return null;
			const target = shippedProjects[Math.floor(Math.random() * shippedProjects.length)];
			return {
				projects: state.projects.map((p) =>
					p.id === target.id
						? {
								...p,
								quality: Math.max(0, p.quality - 10),
								weeklyRevenue: p.weeklyRevenue * 0.8
							}
						: p
				),
				notif: makeNotif(
					week,
					`🐛 Critical Bug in "${target.name}"! Quality -10, revenue -20%.`,
					'danger'
				)
			};
		},
		// Angel Investor
		() => ({
			projects: state.projects,
			notif: makeNotif(week, '💸 Angel Investor! +$10,000 cash injected.', 'success'),
			cashDelta: 10000
		}),
		// Market Dip
		() => ({
			projects: state.projects.map((p) =>
				p.status === 'shipped' ? { ...p, weeklyRevenue: p.weeklyRevenue * 0.9 } : p
			),
			notif: makeNotif(week, '📉 Market Dip — all revenues -10% this week.', 'warning')
		}),
		// Industry Award
		() => ({
			projects: state.projects,
			notif: makeNotif(week, '🏆 Industry Award! Reputation +10.', 'success'),
			repDelta: 10
		}),
		// Competitor Launch
		() => {
			if (!shippedProjects.length) return null;
			const top = [...shippedProjects].sort((a, b) => b.weeklyRevenue - a.weeklyRevenue)[0];
			return {
				projects: state.projects.map((p) =>
					p.id === top.id
						? { ...p, revenueDecayRate: p.revenueDecayRate * 2 }
						: p
				),
				notif: makeNotif(
					week,
					`👾 Competitor Launch! "${top.name}" revenue decays 2x faster for 4 weeks.`,
					'warning'
				)
			};
		},
		// Tech Debt
		() => {
			const activeProject = state.projects.find((p) => p.status === 'in_development');
			if (!activeProject) return null;
			return {
				projects: state.projects.map((p) =>
					p.id === activeProject.id ? { ...p, progress: Math.max(0, p.progress - 5) } : p
				),
				notif: makeNotif(
					week,
					`🔧 Tech Debt hit "${activeProject.name}"! Lost 5 WU progress.`,
					'warning'
				)
			};
		},
		// Press Coverage
		() => ({
			projects: state.projects,
			notif: makeNotif(week, '🌟 Press Coverage! Reputation +5.', 'info'),
			repDelta: 5
		})
	];

	const roll = events[Math.floor(Math.random() * events.length)];
	const result = roll();
	if (!result) return state;

	const newState = { ...state };
	newState.projects = result.projects;
	if ('cashDelta' in result && typeof result.cashDelta === 'number') {
		newState.meta = { ...newState.meta, cash: newState.meta.cash + (result.cashDelta as number) };
	}
	if ('repDelta' in result && typeof result.repDelta === 'number') {
		newState.meta = {
			...newState.meta,
			reputation: Math.min(100, newState.meta.reputation + (result.repDelta as number))
		};
	}
	newState.notifications = [result.notif, ...newState.notifications].slice(0, 50);

	return newState;
}
