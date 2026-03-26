<script lang="ts">
	import { page } from '$app/state';
	import { goto } from '$app/navigation';
	import { game } from '$lib/stores/gameStore';
	import { availableWu } from '$lib/stores/derived';
	import { PROJECT_TYPES, HOSTING_EXTERNAL_COST, HOSTING_WU_DRAIN } from '$lib/engine/projects';
	import FeatureProgress from '$lib/components/FeatureProgress.svelte';
	import RevenueChart from '$lib/components/RevenueChart.svelte';
	import type { Notification, Bug } from '$lib/types';

	const id = $derived(page.params.id);
	const project = $derived($game.projects.find((p) => p.id === id));
	const typeLabel = $derived(project ? (PROJECT_TYPES[project.type]?.label ?? project.type) : '');

	let showCancelConfirm = $state(false);
	let showHostingSwitch = $state(false);
	let showPatchModal = $state(false);
	let patchSelectedBugIds = $state<string[]>([]);

	const currentFeature = $derived(
		project?.features.find((f) => f.status === 'in_progress') ?? null
	);

	const weeksRemaining = $derived(
		project && project.status === 'in_development'
			? Math.ceil(
					(project.features.reduce((s, f) => s + (f.wuCost - f.progressWu), 0)) /
						$availableWu
				)
			: 0
	);

	const externalCost = $derived(
		project ? (HOSTING_EXTERNAL_COST[project.type] ?? 0) : 0
	);
	const selfWuDrain = $derived(
		project ? (HOSTING_WU_DRAIN[project.type] ?? 0) : 0
	);
	const wuAfterSwitch = $derived($availableWu - selfWuDrain);

	// Bug helpers
	const unfixedBugs = $derived(project ? project.bugs.filter((b) => !b.fixed) : []);
	const criticalCount = $derived(unfixedBugs.filter((b) => b.severity === 'critical').length);
	const majorCount = $derived(unfixedBugs.filter((b) => b.severity === 'major').length);
	const minorCount = $derived(unfixedBugs.filter((b) => b.severity === 'minor').length);

	const escalationStage = $derived.by(() => {
		if (!project) return 0;
		const week = $game.meta.week;
		const criticalUnfixed = unfixedBugs.filter((b) => b.severity === 'critical');
		const oldestCriticalAge = criticalUnfixed.length
			? Math.max(...criticalUnfixed.map((b) => week - b.weekDiscovered))
			: 0;
		if (unfixedBugs.length >= 10 || oldestCriticalAge >= 6) return 3;
		if (unfixedBugs.length >= 6 || oldestCriticalAge >= 3) return 2;
		if (unfixedBugs.length >= 3) return 1;
		return 0;
	});

	// Patch modal helpers
	const patchWuCost = $derived(
		patchSelectedBugIds.reduce((sum, bid) => {
			const bug = project?.bugs.find((b) => b.id === bid);
			if (!bug) return sum;
			return sum + (bug.severity === 'critical' ? 10 : bug.severity === 'major' ? 5 : 2);
		}, 0)
	);
	const patchWeeksEstimate = $derived(
		$availableWu > 0 ? Math.ceil(patchWuCost / $availableWu) : 0
	);

	const activePatch = $derived(
		$game.activePatchJob?.projectId === id ? $game.activePatchJob : null
	);

	const hasMajorReleaseInDev = $derived(
		$game.projects.some((p) => p.isMajorRelease && p.status === 'in_development')
	);
	const canPlanMajorRelease = $derived(
		!hasMajorReleaseInDev && $game.activePatchJob === null
	);

	function togglePatchBug(bugId: string) {
		if (patchSelectedBugIds.includes(bugId)) {
			patchSelectedBugIds = patchSelectedBugIds.filter((b) => b !== bugId);
		} else {
			patchSelectedBugIds = [...patchSelectedBugIds, bugId];
		}
	}

	function startPatch() {
		if (!project || patchSelectedBugIds.length === 0) return;
		game.update((s) => ({
			...s,
			activePatchJob: {
				projectId: project.id,
				wuRequired: patchWuCost,
				wuInvested: 0,
				bugIdsToFix: [...patchSelectedBugIds],
				weekStarted: s.meta.week
			},
			notifications: ([
				{
					id: crypto.randomUUID(),
					week: s.meta.week,
					message: `🩹 Patch started for "${project.name}" — fixing ${patchSelectedBugIds.length} bug(s).`,
					type: 'info'
				} satisfies Notification,
				...s.notifications
			] as Notification[]).slice(0, 50)
		}));
		showPatchModal = false;
		patchSelectedBugIds = [];
	}

	function cancelPatch() {
		game.update((s) => ({
			...s,
			activePatchJob: null,
			notifications: ([
				{
					id: crypto.randomUUID(),
					week: s.meta.week,
					message: `❌ Patch cancelled for "${project?.name}". WU invested is lost.`,
					type: 'warning'
				} satisfies Notification,
				...s.notifications
			] as Notification[]).slice(0, 50)
		}));
	}

	function cancelProject() {
		if (!project) return;
		game.update((s) => ({
			...s,
			projects: s.projects.map((p) =>
				p.id === id ? { ...p, status: 'cancelled' } : p
			),
			notifications: ([
				{
					id: crypto.randomUUID(),
					week: s.meta.week,
					message: `❌ "${project.name}" cancelled.`,
					type: 'warning'
				} satisfies Notification,
				...s.notifications
			] as Notification[]).slice(0, 50)
		}));
		goto('/');
	}

	function switchHosting(newType: 'external' | 'self') {
		if (!project) return;
		const newCost = newType === 'external' ? externalCost : 0;
		const newDrain = newType === 'self' ? selfWuDrain : 0;
		game.update((s) => ({
			...s,
			projects: s.projects.map((p) =>
				p.id === id
					? { ...p, hostingType: newType, hostingCostPerWeek: newCost, hostingWuDrainPerWeek: newDrain }
					: p
			),
			notifications: ([
				{
					id: crypto.randomUUID(),
					week: s.meta.week,
					message: newType === 'external'
						? `☁️ "${project.name}" switched to external hosting — $${newCost}/wk.`
						: `🖥️ "${project.name}" switched to self-hosting — ${newDrain} WU/wk drain.`,
					type: 'info'
				} satisfies Notification,
				...s.notifications
			] as Notification[]).slice(0, 50)
		}));
		showHostingSwitch = false;
	}

	function bugWuCost(bug: Bug): number {
		return bug.severity === 'critical' ? 10 : bug.severity === 'major' ? 5 : 2;
	}

	function severityColor(severity: Bug['severity']): string {
		return severity === 'critical'
			? 'bg-red-900 text-red-300'
			: severity === 'major'
				? 'bg-orange-900 text-orange-300'
				: 'bg-yellow-900 text-yellow-300';
	}
</script>

<header class="bg-navy/95 border-navy-600 sticky top-0 z-30 border-b px-4 py-3 backdrop-blur">
	<div class="flex items-center gap-3">
		<a href="/" class="text-gray-400 hover:text-white">←</a>
		<div class="flex-1">
			{#if project}
				<div class="flex items-center gap-2">
					<span class="font-semibold text-white">{project.name}</span>
					<span class="bg-navy-600 rounded px-2 py-0.5 text-xs text-gray-400">{typeLabel}</span>
					{#if project.version}
						<span class="rounded bg-blue-900 px-2 py-0.5 text-xs text-blue-300">v{project.version}</span>
					{/if}
				</div>
			{:else}
				<span class="text-gray-400">Project not found</span>
			{/if}
		</div>
	</div>
</header>

<div class="mx-auto max-w-lg space-y-6 px-4 py-6">

	{#if !project}
		<div class="rounded-xl border border-red-700 bg-red-950 p-6 text-center text-red-300">
			Project not found.
			<a href="/" class="mt-2 block text-sm underline">← Back to Dashboard</a>
		</div>

	{:else if project.status === 'in_development'}
		<!-- Status Badge -->
		<div class="flex items-center gap-2">
			<span class="rounded-full bg-blue-900 px-3 py-1 text-xs font-semibold text-blue-300">
				IN DEVELOPMENT
			</span>
		</div>

		<!-- Progress -->
		<div class="bg-navy-700 rounded-xl p-4">
			<div class="mb-1 flex items-center justify-between text-sm">
				<span class="text-gray-400">Overall Progress</span>
				<span class="font-mono text-white">{Math.round(project.progress)}%</span>
			</div>
			<div class="bg-navy-600 mb-3 h-3 w-full overflow-hidden rounded-full">
				<div
					class="bg-neon h-full rounded-full transition-all"
					style="width: {project.progress}%"
				></div>
			</div>
			<div class="flex justify-between text-xs text-gray-500">
				<span>{project.features.reduce((s, f) => s + f.progressWu, 0)} / {project.totalWuRequired} WU</span>
				<span>~{weeksRemaining} weeks remaining</span>
			</div>
		</div>

		<!-- Current Feature -->
		{#if currentFeature}
			<div class="bg-navy-700 rounded-xl p-4">
				<div class="mb-2 text-xs font-semibold uppercase tracking-widest text-gray-500">
					Current Feature
				</div>
				<div class="mb-1 flex items-center justify-between text-sm">
					<span class="text-white">{currentFeature.name}</span>
					<span class="font-mono text-xs text-gray-400">
						{currentFeature.progressWu}/{currentFeature.wuCost} WU
					</span>
				</div>
				<div class="bg-navy-600 h-2 w-full overflow-hidden rounded-full">
					<div
						class="bg-neon h-full rounded-full transition-all"
						style="width: {(currentFeature.progressWu / currentFeature.wuCost) * 100}%"
					></div>
				</div>
			</div>
		{/if}

		<!-- Feature List -->
		<div class="bg-navy-700 rounded-xl p-4">
			<div class="mb-3 text-xs font-semibold uppercase tracking-widest text-gray-500">Features</div>
			<FeatureProgress features={project.features} />
		</div>

		<!-- Info -->
		<div class="bg-navy-700 rounded-xl p-4">
			<div class="mb-3 text-xs font-semibold uppercase tracking-widest text-gray-500">Info</div>
			<div class="space-y-2 text-sm">
				<div class="flex justify-between">
					<span class="text-gray-400">Quality Score</span>
					<span class="font-mono text-white">{project.quality} / 100</span>
				</div>
				<div class="flex justify-between">
					<span class="text-gray-400">Pricing</span>
					<span class="font-mono text-white">
						${project.price}
						{project.pricingModel === 'subscription' ? '/mo' : ' one-time'}
					</span>
				</div>
			</div>
		</div>

		<!-- Cancel -->
		<div class="pt-2">
			{#if showCancelConfirm}
				<div class="rounded-xl border border-red-700 bg-red-950 p-4 text-center">
					<p class="mb-3 text-sm text-red-300">Are you sure? This cannot be undone.</p>
					<div class="flex gap-3">
						<button
							onclick={() => (showCancelConfirm = false)}
							class="flex-1 rounded-lg border border-gray-600 py-2 text-sm text-gray-300"
						>
							Keep Working
						</button>
						<button
							onclick={cancelProject}
							class="flex-1 rounded-lg bg-red-700 py-2 text-sm font-semibold text-white"
						>
							Cancel Project
						</button>
					</div>
				</div>
			{:else}
				<button
					onclick={() => (showCancelConfirm = true)}
					class="w-full rounded-xl border border-red-900 py-3 text-sm text-red-400 transition-colors hover:bg-red-950"
				>
					Cancel Project
				</button>
			{/if}
		</div>

	{:else if project.status === 'shipped' || project.status === 'dead'}
		<!-- Status Badge -->
		<div class="flex items-center gap-2">
			{#if project.status === 'dead'}
				<span class="rounded-full bg-gray-800 px-3 py-1 text-xs font-semibold text-gray-400">
					💀 DEAD
				</span>
			{:else}
				<span class="rounded-full bg-green-900 px-3 py-1 text-xs font-semibold text-green-300">
					LIVE 🟢
				</span>
			{/if}
			<span class="text-xs text-gray-500">{project.weeksOnMarket} weeks on market</span>
		</div>

		<!-- Active Patch Banner -->
		{#if activePatch}
			<div class="rounded-xl border border-blue-700 bg-blue-950 p-4">
				<div class="mb-2 flex items-center justify-between">
					<span class="text-sm font-semibold text-blue-300">🩹 PATCH IN PROGRESS</span>
					<span class="font-mono text-xs text-gray-400">
						{activePatch.wuInvested} / {activePatch.wuRequired} WU
					</span>
				</div>
				<div class="bg-navy-600 mb-3 h-2 w-full overflow-hidden rounded-full">
					<div
						class="h-full rounded-full bg-blue-500 transition-all"
						style="width: {Math.min(100, (activePatch.wuInvested / activePatch.wuRequired) * 100)}%"
					></div>
				</div>
				<div class="mb-3 text-xs text-gray-400">
					Fixing {activePatch.bugIdsToFix.length} bug(s) ·
					~{$availableWu > 0 ? Math.ceil((activePatch.wuRequired - activePatch.wuInvested) / $availableWu) : '?'} weeks remaining
				</div>
				<button
					onclick={cancelPatch}
					class="text-xs text-red-400 hover:text-red-300 transition-colors"
				>
					Cancel Patch (WU lost)
				</button>
			</div>
		{/if}

		<!-- Revenue -->
		{#if project.status === 'shipped'}
			<div class="bg-navy-700 rounded-xl p-4">
				<div class="mb-3 text-xs font-semibold uppercase tracking-widest text-gray-500">Revenue</div>
				<div class="mb-1 flex items-baseline gap-1">
					<span class="text-neon font-mono text-3xl font-bold">
						${Math.round(project.weeklyRevenue).toLocaleString()}
					</span>
					<span class="text-gray-400">/wk</span>
					{#if project.adRevenue > 0}
						<span class="ml-1 text-sm text-amber-400">+ ${Math.round(project.adRevenue).toLocaleString()} ads</span>
					{/if}
				</div>
				<div class="space-y-2 text-sm">
					<div class="flex justify-between">
						<span class="text-gray-400">Lifetime Revenue</span>
						<span class="font-mono text-white">${Math.round(project.totalRevenue).toLocaleString()}</span>
					</div>
					<div class="flex justify-between">
						<span class="text-gray-400">Pricing</span>
						<div class="flex items-center gap-1">
							<span
								class="rounded px-1.5 py-0.5 text-xs font-semibold"
								class:bg-blue-900={project.pricingModel === 'subscription'}
								class:text-blue-300={project.pricingModel === 'subscription'}
								class:bg-purple-900={project.pricingModel === 'one_time'}
								class:text-purple-300={project.pricingModel === 'one_time'}
							>
								{project.pricingModel === 'subscription' ? 'SUB' : 'ONE-TIME'}
							</span>
							<span class="font-mono text-white">${project.price}</span>
						</div>
					</div>
					<div class="flex justify-between">
						<span class="text-gray-400">Revenue Decay</span>
						<span class="font-mono text-amber-400">↘ -{project.revenueDecayRate}%/wk</span>
					</div>
					{#if project.pricingModel === 'subscription'}
						<div class="flex justify-between">
							<span class="text-gray-400">Active Subscribers</span>
							<span class="font-mono text-white">{project.activeSubscribers.toLocaleString()}</span>
						</div>
					{/if}
				</div>
			</div>
		{:else}
			<div class="rounded-xl border border-gray-700 bg-gray-900 p-4">
				<div class="mb-1 text-sm font-semibold text-gray-400">Revenue halted — product is dead</div>
				<div class="text-xs text-gray-600">Fix all critical/major bugs to revive it, or plan a major release.</div>
				<div class="mt-2 text-xs text-gray-500">
					Lifetime Revenue: <span class="font-mono text-gray-400">${Math.round(project.totalRevenue).toLocaleString()}</span>
				</div>
			</div>
		{/if}

		<!-- Hosting -->
		{#if project.hostingType !== 'none' && project.status === 'shipped'}
			<div class="bg-navy-700 rounded-xl p-4">
				<div class="mb-3 flex items-center justify-between">
					<div class="text-xs font-semibold uppercase tracking-widest text-gray-500">Hosting</div>
					<button
						onclick={() => (showHostingSwitch = !showHostingSwitch)}
						class="text-xs text-gray-400 hover:text-white transition-colors"
					>
						Switch →
					</button>
				</div>

				{#if project.hostingType === 'external'}
					<div class="flex items-center justify-between text-sm">
						<span class="text-white">☁️ External Hosting</span>
						<span class="font-mono text-amber-400">-${project.hostingCostPerWeek}/wk</span>
					</div>
					<p class="mt-1 text-xs text-gray-500">No maintenance, no outage risk.</p>
				{:else}
					<div class="flex items-center justify-between text-sm">
						<span class="text-white">🖥️ Self-Hosted</span>
						<span class="font-mono text-orange-400">-{project.hostingWuDrainPerWeek} WU/wk</span>
					</div>
					<p class="mt-1 text-xs text-gray-500">5% outage risk per week (2% with DevOps).</p>
				{/if}

				{#if showHostingSwitch}
					<div class="mt-4 space-y-2 border-t border-gray-700 pt-4">
						<p class="mb-2 text-xs text-gray-400">Switch hosting (takes effect immediately):</p>
						<button
							onclick={() => switchHosting('external')}
							disabled={project.hostingType === 'external'}
							class="w-full rounded-xl border px-4 py-3 text-left text-sm transition-all"
							class:border-neon={project.hostingType === 'external'}
							class:border-gray-600={project.hostingType !== 'external'}
							class:opacity-50={project.hostingType === 'external'}
						>
							<div class="font-medium text-white">☁️ External Hosting</div>
							<div class="text-xs text-amber-400">${externalCost}/wk cash cost</div>
						</button>
						<button
							onclick={() => switchHosting('self')}
							disabled={project.hostingType === 'self'}
							class="w-full rounded-xl border px-4 py-3 text-left text-sm transition-all"
							class:border-neon={project.hostingType === 'self'}
							class:border-gray-600={project.hostingType !== 'self'}
							class:opacity-50={project.hostingType === 'self'}
						>
							<div class="font-medium text-white">🖥️ Self-Hosted</div>
							<div class="text-xs text-orange-400">{selfWuDrain} WU/wk drain · leaves you {wuAfterSwitch} WU for dev</div>
						</button>
					</div>
				{/if}
			</div>
		{/if}

		<!-- Revenue Chart -->
		{#if project.revenueHistory.length > 0 && project.status === 'shipped'}
			<div class="bg-navy-700 rounded-xl p-4">
				<div class="mb-3 text-xs font-semibold uppercase tracking-widest text-gray-500">
					Revenue History (last 8 weeks)
				</div>
				<RevenueChart history={project.revenueHistory} />
			</div>
		{/if}

		<!-- Bug Report -->
		<div class="bg-navy-700 rounded-xl p-4">
			<div class="mb-3 flex items-center justify-between">
				<div class="text-xs font-semibold uppercase tracking-widest text-gray-500">Bug Report</div>
				{#if unfixedBugs.length > 0}
					<span class="font-mono text-xs text-red-400">{unfixedBugs.length} unfixed</span>
				{/if}
			</div>

			{#if unfixedBugs.length === 0}
				<p class="text-sm text-green-400">✅ No active bugs — all clear!</p>
			{:else}
				<!-- Escalation stage -->
				{@const stage = escalationStage}
				{#if stage >= 3}
					<div class="mb-3 rounded-lg bg-red-950 px-3 py-2 text-xs font-semibold text-red-400">💀 STAGE 3 — Product Dead</div>
				{:else if stage >= 2}
					<div class="mb-3 rounded-lg bg-red-900/40 px-3 py-2 text-xs font-semibold text-red-300">🔴 STAGE 2 — Reputation Damage</div>
				{:else if stage >= 1}
					<div class="mb-3 rounded-lg bg-yellow-950 px-3 py-2 text-xs font-semibold text-yellow-400">⚠️ STAGE 1 — Users Grumbling</div>
				{/if}

				<!-- Bug count summary -->
				<div class="mb-3 flex gap-3 text-xs">
					{#if criticalCount > 0}<span class="rounded bg-red-900 px-2 py-0.5 text-red-300">{criticalCount} critical</span>{/if}
					{#if majorCount > 0}<span class="rounded bg-orange-900 px-2 py-0.5 text-orange-300">{majorCount} major</span>{/if}
					{#if minorCount > 0}<span class="rounded bg-yellow-900 px-2 py-0.5 text-yellow-300">{minorCount} minor</span>{/if}
				</div>

				<!-- Bug list -->
				<div class="mb-4 space-y-2">
					{#each unfixedBugs as bug (bug.id)}
						<div class="flex items-start justify-between gap-2 rounded-lg bg-navy-600 px-3 py-2">
							<div class="flex-1">
								<span class="mr-2 rounded px-1.5 py-0.5 text-xs {severityColor(bug.severity)}">{bug.severity}</span>
								<span class="text-sm text-gray-300">{bug.description}</span>
							</div>
							<span class="shrink-0 font-mono text-xs text-red-400">-${bug.revenueImpact}/wk</span>
						</div>
					{/each}
				</div>

				<!-- Release patch button -->
				{#if !activePatch && !$game.activePatchJob}
					<button
						onclick={() => { showPatchModal = true; patchSelectedBugIds = []; }}
						class="bg-neon text-white w-full rounded-xl py-2.5 text-sm font-semibold"
					>
						🩹 Release Patch →
					</button>
				{:else if $game.activePatchJob && $game.activePatchJob.projectId !== id}
					<p class="text-xs text-gray-500">A patch is active on another product. Complete it first.</p>
				{/if}
			{/if}
		</div>

		<!-- Features -->
		<div class="bg-navy-700 rounded-xl p-4">
			<div class="mb-2 flex items-center justify-between">
				<div class="text-xs font-semibold uppercase tracking-widest text-gray-500">Features</div>
				<span class="font-mono text-sm text-white">Quality: {project.quality}/100</span>
			</div>
			<div class="space-y-1">
				{#each project.features as feat (feat.id)}
					<div class="flex items-center gap-2 text-sm text-gray-300">
						<span>✅</span>
						<span>{feat.name}</span>
						{#if feat.id === 'advertising'}
							<span class="ml-auto text-xs text-amber-400">ads</span>
						{:else}
							<span class="ml-auto text-xs text-green-400">+${feat.revenueBoost}/wk</span>
						{/if}
					</div>
				{/each}
			</div>
		</div>

		<!-- Major Release -->
		<div class="bg-navy-700 rounded-xl p-4">
			<div class="mb-2 text-xs font-semibold uppercase tracking-widest text-gray-500">Major Release</div>
			{#if hasMajorReleaseInDev}
				<p class="text-xs text-gray-500">A major release is already in development.</p>
			{:else if $game.activePatchJob !== null}
				<p class="text-xs text-gray-500">Complete the active patch before planning a major release.</p>
			{:else}
				<a
					href="/projects/new?majorFrom={project.id}"
					class="block w-full rounded-xl border border-purple-700 py-2.5 text-center text-sm font-semibold text-purple-300 transition-colors hover:bg-purple-950"
				>
					📦 Plan Major Release →
				</a>
			{/if}
		</div>

	{:else if project.status === 'archived'}
		<div class="rounded-xl border border-gray-700 bg-gray-950 p-6 text-center text-gray-500">
			<div class="mb-1 text-2xl">📦</div>
			<div class="mb-1 text-sm font-semibold text-gray-400">Archived — superseded by a newer version</div>
			<div class="text-xs">Lifetime Revenue: ${Math.round(project.totalRevenue).toLocaleString()}</div>
		</div>

		<!-- Major Release from archived product -->
		<div class="bg-navy-700 rounded-xl p-4">
			<div class="mb-2 text-xs font-semibold uppercase tracking-widest text-gray-500">Major Release</div>
			{#if hasMajorReleaseInDev}
				<p class="text-xs text-gray-500">A major release is already in development.</p>
			{:else if $game.activePatchJob !== null}
				<p class="text-xs text-gray-500">Complete the active patch before planning a major release.</p>
			{:else}
				<a
					href="/projects/new?majorFrom={project.id}"
					class="block w-full rounded-xl border border-purple-700 py-2.5 text-center text-sm font-semibold text-purple-300 transition-colors hover:bg-purple-950"
				>
					📦 Plan Major Release →
				</a>
			{/if}
		</div>

	{:else}
		<div class="rounded-xl border border-gray-700 bg-gray-950 p-6 text-center text-gray-500">
			This project was cancelled.
		</div>
	{/if}

</div>

<!-- Patch Modal -->
{#if showPatchModal && project}
	<div class="fixed inset-0 z-50 flex items-end bg-black/70 pb-8">
		<div class="bg-navy-800 border-navy-600 mx-4 w-full max-w-lg rounded-2xl border p-6">
			<h3 class="mb-1 text-base font-semibold text-white">Release Patch for "{project.name}"</h3>
			<p class="mb-4 text-xs text-gray-400">Select bugs to fix. WU is consumed from your weekly budget.</p>

			<div class="mb-4 max-h-64 space-y-2 overflow-y-auto">
				{#each unfixedBugs as bug (bug.id)}
					<button
						onclick={() => togglePatchBug(bug.id)}
						class="w-full rounded-xl border px-4 py-3 text-left transition-all {patchSelectedBugIds.includes(bug.id) ? 'border-neon bg-neon/10' : 'border-gray-600'}"
					>
						<div class="flex items-center justify-between">
							<div class="flex items-center gap-2">
								<span class="text-xs {severityColor(bug.severity)} rounded px-1.5 py-0.5">{bug.severity}</span>
								<span class="text-sm text-white">{bug.description}</span>
							</div>
							<div class="ml-2 shrink-0 text-right text-xs">
								<div class="text-red-400">-${bug.revenueImpact}/wk</div>
								<div class="text-gray-400">{bugWuCost(bug)} WU</div>
							</div>
						</div>
					</button>
				{/each}
			</div>

			<div class="mb-4 rounded-xl bg-navy-700 p-3 text-sm">
				<div class="flex justify-between">
					<span class="text-gray-400">WU required</span>
					<span class="font-mono text-white">{patchWuCost} WU</span>
				</div>
				<div class="flex justify-between">
					<span class="text-gray-400">Estimated weeks</span>
					<span class="font-mono text-white">{patchWeeksEstimate} wk</span>
				</div>
			</div>

			<div class="flex gap-3">
				<button
					onclick={() => (showPatchModal = false)}
					class="flex-1 rounded-xl border border-gray-600 py-3 text-sm text-gray-300"
				>
					Cancel
				</button>
				<button
					onclick={startPatch}
					disabled={patchSelectedBugIds.length === 0}
					class="flex-1 rounded-xl py-3 text-sm font-semibold transition-colors"
					class:bg-neon={patchSelectedBugIds.length > 0}
					class:text-white={patchSelectedBugIds.length > 0}
					class:bg-navy-600={patchSelectedBugIds.length === 0}
					class:text-gray-500={patchSelectedBugIds.length === 0}
					class:cursor-not-allowed={patchSelectedBugIds.length === 0}
				>
					Start Patch
				</button>
			</div>
		</div>
	</div>
{/if}
