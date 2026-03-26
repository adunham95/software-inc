import type { GameState, Project, ProjectFeature } from '$lib/types';
import { calcInitialRevenue, calcInitialSubscribers, tickShippedProject } from './pricing';
import { maybeFireEvent } from './events';

function getWuPerWeek(state: GameState): number {
	return state.research.completed.includes('agile_process') ? 6 : 5;
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
	const wu = getWuPerWeek(s);
	const rp = getRpPerWeek();

	// 1. Tick active development project
	const activeProject = s.projects.find((p) => p.status === 'in_development');
	if (activeProject) {
		const updated = tickActiveProject(activeProject, wu);

		// Check if all features complete → ship!
		const allComplete = updated.features.every((f) => f.status === 'complete');
		if (allComplete || updated.progress >= 100) {
			const shipped = {
				...updated,
				status: 'shipped' as const,
				weekShipped: week,
				weeklyRevenue: calcInitialRevenue(updated, s.meta.reputation),
				activeSubscribers: calcInitialSubscribers(updated, s.meta.reputation),
				revenueDecayRate: s.research.completed.includes('devops') ? 0.25 : 0.5,
				weeksOnMarket: 0,
				revenueHistory: []
			};
			s.projects = s.projects.map((p) => (p.id === shipped.id ? shipped : p));
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

	// 2. Tick active research
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

	// 3. Revenue from shipped products
	let weeklyIncome = 0;
	s.projects = s.projects.map((p) => {
		if (p.status !== 'shipped') return p;
		const ticked = tickShippedProject(p);
		weeklyIncome += ticked.weeklyRevenue;
		return ticked;
	});

	s.meta.cash += weeklyIncome;
	s.meta.totalEarned += weeklyIncome;

	// 4. Advance time
	s.meta.week = week + 1;
	if (s.meta.week > 52) {
		s.meta.week = 1;
		s.meta.year += 1;
	}

	// 5. Random events
	s = maybeFireEvent(s);

	return s;
}
