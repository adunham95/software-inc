import type { Bug, GameState, Project } from '$lib/types';

// Flavour text per severity
const MINOR_DESCRIPTIONS = [
	'UI glitch on settings page',
	'Slow image loading on some screens',
	'Button misaligned on mobile',
	'Tooltip text truncated incorrectly',
	'Minor layout issue in dark mode',
	'Form validation message disappears too quickly',
	'Scroll position resets unexpectedly',
	'Search results flicker on load'
];

const MAJOR_DESCRIPTIONS = [
	'Crash on login for some users',
	'Data export produces malformed files',
	'Notifications not delivered reliably',
	'Session expires without warning',
	'Payment flow throws error on retry',
	'Profile pictures fail to upload',
	'Search returns incorrect results intermittently',
	'Dashboard fails to load for new accounts'
];

const CRITICAL_DESCRIPTIONS = [
	'Security vulnerability in authentication module',
	'User data visible to wrong accounts',
	'Total data loss risk on account deletion',
	'SQL injection vector discovered in API',
	'Memory leak causes server crash under load',
	'Password reset tokens never expire',
	'Admin panel accessible without credentials',
	'Encryption keys stored in plain text'
];

function pick<T>(arr: T[]): T {
	return arr[Math.floor(Math.random() * arr.length)];
}

export function generateBug(project: Project, week: number, forcedSeverity?: Bug['severity']): Bug {
	const roll = Math.random();
	let severity: Bug['severity'];
	let revenueImpact: number;
	let description: string;

	const sev = forcedSeverity ?? (roll < 0.6 ? 'minor' : roll < 0.9 ? 'major' : 'critical');

	if (sev === 'minor') {
		severity = 'minor';
		revenueImpact = parseFloat((0.01 + Math.random() * 0.04).toFixed(3)); // 1–5%
		description = pick(MINOR_DESCRIPTIONS);
	} else if (sev === 'major') {
		severity = 'major';
		revenueImpact = parseFloat((0.05 + Math.random() * 0.1).toFixed(3)); // 5–15%
		description = pick(MAJOR_DESCRIPTIONS);
	} else {
		severity = 'critical';
		revenueImpact = parseFloat((0.15 + Math.random() * 0.25).toFixed(3)); // 15–40%
		description = pick(CRITICAL_DESCRIPTIONS);
	}

	return {
		id: crypto.randomUUID(),
		weekDiscovered: week,
		severity,
		description,
		revenueImpact,
		fixed: false
	};
}

export function calcBugsThisWeek(project: Project): number {
	const baseRate = 0.1;
	const qualityFactor = 1 - project.quality / 100;
	const ageFactor = 1 + project.weeksOnMarket * 0.05;
	return baseRate * qualityFactor * ageFactor;
}

export function checkEscalation(state: GameState): GameState {
	let s = state;
	const week = s.meta.week;

	for (const project of s.projects) {
		if (project.status !== 'shipped' && project.status !== 'dead') continue;

		const unfixed = project.bugs.filter((b) => !b.fixed);
		const unfixedCount = unfixed.length;
		const criticalUnfixed = unfixed.filter((b) => b.severity === 'critical');
		const oldestCriticalAge = criticalUnfixed.length
			? Math.max(...criticalUnfixed.map((b) => week - b.weekDiscovered))
			: 0;

		// Stage 3: Product death
		if ((unfixedCount >= 10 || oldestCriticalAge >= 6) && project.status !== 'dead') {
			s = {
				...s,
				meta: { ...s.meta, reputation: Math.max(0, s.meta.reputation - 10) },
				projects: s.projects.map((p) =>
					p.id === project.id ? { ...p, status: 'dead' as const, weeklyRevenue: 0 } : p
				),
				notifications: [
					{
						id: crypto.randomUUID(),
						week,
						message: `💀 "${project.name}" has become unusable. Users have abandoned it.`,
						type: 'danger' as const
					},
					...s.notifications
				].slice(0, 50)
			};
			continue;
		}

		// Stage 2: Reputation damage (6+ bugs or critical unfixed 3+ weeks)
		if (unfixedCount >= 6 || oldestCriticalAge >= 3) {
			s = {
				...s,
				meta: { ...s.meta, reputation: Math.max(0, s.meta.reputation - 1) },
				notifications: [
					{
						id: crypto.randomUUID(),
						week,
						message: `🔴 Bad reviews spreading for "${project.name}". Reputation taking a hit.`,
						type: 'warning' as const
					},
					...s.notifications
				].slice(0, 50)
			};
			continue;
		}

		// Stage 1: Grumbling (3+ bugs) — notification only, revenue handled separately
		if (unfixedCount >= 3 && unfixedCount < 6) {
			// Only notify once every 4 weeks to avoid spam
			if (week % 4 === 0) {
				s = {
					...s,
					notifications: [
						{
							id: crypto.randomUUID(),
							week,
							message: `⚠️ Users are complaining about bugs in "${project.name}".`,
							type: 'warning' as const
						},
						...s.notifications
					].slice(0, 50)
				};
			}
		}
	}

	return s;
}

export function completePatch(state: GameState): GameState {
	const job = state.activePatchJob;
	if (!job) return state;

	const project = state.projects.find((p) => p.id === job.projectId);
	if (!project) return { ...state, activePatchJob: null };

	// Fix selected bugs
	const updatedBugs = project.bugs.map((b) =>
		job.bugIdsToFix.includes(b.id) ? { ...b, fixed: true } : b
	);

	// Bump minor version: "1.2" → "1.3"
	const parts = project.version.split('.');
	const newVersion = `${parts[0]}.${parseInt(parts[1] ?? '0') + 1}`;

	// Check if dead product can be revived
	const remainingUnfixed = updatedBugs.filter((b) => !b.fixed);
	const hasCriticalOrMajor = remainingUnfixed.some(
		(b) => b.severity === 'critical' || b.severity === 'major'
	);
	const newStatus =
		project.status === 'dead' && !hasCriticalOrMajor ? ('shipped' as const) : project.status;

	const totalBugsFixed = project.totalBugsFixed + job.bugIdsToFix.length;

	const updatedProject = {
		...project,
		bugs: updatedBugs,
		version: newVersion,
		status: newStatus,
		totalBugsFixed,
		lastPatchedWeek: state.meta.week
	};

	return {
		...state,
		projects: state.projects.map((p) => (p.id === job.projectId ? updatedProject : p)),
		activePatchJob: null,
		notifications: [
			{
				id: crypto.randomUUID(),
				week: state.meta.week,
				message: `🩹 Patch v${newVersion} released for "${project.name}". Bugs squashed.`,
				type: 'success' as const
			},
			...state.notifications
		].slice(0, 50)
	};
}

export function calcWeeklyTraffic(project: Project): number {
	// Traffic grows with quality and weeks on market, then plateaus
	const qualityFactor = project.quality / 100;
	const ageFactor = Math.min(1, project.weeksOnMarket / 20);
	return qualityFactor * ageFactor * 10000;
}
