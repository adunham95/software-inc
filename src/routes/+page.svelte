<script lang="ts">
	import { game, resetGame } from '$lib/stores/gameStore';
	import {
		totalWeeklyRevenue,
		shippedProjects,
		archivedProjects,
		activeResearch,
		researchWeeksRemaining,
		totalWeeklyExpenses,
		availableWu
	} from '$lib/stores/derived';
	import StatChip from '$lib/components/StatChip.svelte';
	import ProjectCard from '$lib/components/ProjectCard.svelte';
	import ShippedProductCard from '$lib/components/ShippedProductCard.svelte';
	import NotificationLog from '$lib/components/NotificationLog.svelte';
	import AdvanceWeekButton from '$lib/components/AdvanceWeekButton.svelte';
	import { SELF_COST_TIERS, HOSTING_EXTERNAL_COST, HOSTING_WU_DRAIN } from '$lib/engine/projects';
	import type { Notification } from '$lib/types';

	const inDevProjects = $derived($game.projects.filter((p) => p.status === 'in_development'));
	const activeCount = $derived(inDevProjects.length + $shippedProjects.length);
	const liveProjects = $derived($shippedProjects.filter((p) => p.status === 'shipped'));
	const deadProjects = $derived($shippedProjects.filter((p) => p.status === 'dead'));

	const lifestyleTier = $derived(SELF_COST_TIERS[$game.expenses.selfCostTier]);

	let showArchivedSection = $state(false);

	// Hosting choice modal
	const pendingProject = $derived(
		$game.pendingHostingChoiceId
			? $game.projects.find((p) => p.id === $game.pendingHostingChoiceId)
			: null
	);
	const pendingExternalCost = $derived(
		pendingProject ? (HOSTING_EXTERNAL_COST[pendingProject.type] ?? 0) : 0
	);
	const pendingSelfWuDrain = $derived(
		pendingProject ? (HOSTING_WU_DRAIN[pendingProject.type] ?? 0) : 0
	);
	const wuAfterSelf = $derived($availableWu - pendingSelfWuDrain);

	function chooseHosting(type: 'external' | 'self') {
		if (!pendingProject) return;
		const cost = type === 'external' ? pendingExternalCost : 0;
		const drain = type === 'self' ? pendingSelfWuDrain : 0;
		game.update((s) => ({
			...s,
			pendingHostingChoiceId: null,
			projects: s.projects.map((p) =>
				p.id === pendingProject.id
					? { ...p, hostingType: type, hostingCostPerWeek: cost, hostingWuDrainPerWeek: drain }
					: p
			),
			notifications: (
				[
					{
						id: crypto.randomUUID(),
						week: s.meta.week,
						message:
							type === 'external'
								? `☁️ "${pendingProject.name}" on external hosting — $${cost}/wk.`
								: `🖥️ "${pendingProject.name}" self-hosted — ${drain} WU/wk drain.`,
						type: 'info'
					} satisfies Notification,
					...s.notifications
				] as Notification[]
			).slice(0, 50)
		}));
	}

	let showReset = $state(false);

	function handleReset() {
		if (showReset) {
			resetGame();
			showReset = false;
		} else {
			showReset = true;
		}
	}

	// Active patch job info
	const activePatch = $derived($game.activePatchJob);
	const patchProject = $derived(
		activePatch ? $game.projects.find((p) => p.id === activePatch.projectId) : null
	);
</script>

<!-- Sticky Header -->
<header class="sticky top-0 z-30 border-b border-navy-600 bg-navy/95 px-4 py-3 backdrop-blur">
	<div class="flex items-center justify-between">
		<div>
			<div class="font-mono text-xs text-gray-500">
				Week {$game.meta.week} · Year {$game.meta.year}
			</div>
			<div class="flex items-center gap-2">
				<span class="text-sm font-semibold text-white">{$game.meta.companyName}</span>
				<span class="rounded-full bg-navy-700 px-2 py-0.5 font-mono text-xs text-gray-400">
					{lifestyleTier.emoji}
					{lifestyleTier.label}
				</span>
			</div>
		</div>
		<div class="text-right">
			<div class="font-mono text-xl font-bold text-neon">
				${$game.meta.cash.toLocaleString(undefined, { maximumFractionDigits: 0 })}
			</div>
			<div class="text-xs text-gray-500">cash</div>
		</div>
	</div>
</header>

<div class="mx-auto max-w-lg space-y-6 px-4 py-4">
	<!-- Stats Row (4-col) -->
	<div class="grid grid-cols-4 gap-2">
		<StatChip
			label="Revenue/wk"
			value="${Math.round($totalWeeklyRevenue).toLocaleString()}"
			accent
		/>
		<StatChip label="Projects" value={String(activeCount)} />
		<StatChip label="Reputation" value={String($game.meta.reputation)} />
		<StatChip label="Expenses/wk" value="-${$totalWeeklyExpenses.toLocaleString()}" />
	</div>

	<!-- WU Warning -->
	{#if $availableWu <= 0}
		<div class="rounded-xl border border-red-700 bg-red-950 px-4 py-3 text-sm text-red-300">
			⚠️ No WU available — self-hosting overhead is consuming all your time.
		</div>
	{/if}

	<!-- Active Projects + Patch -->
	<section>
		<h2 class="mb-3 text-xs font-semibold tracking-widest text-gray-500 uppercase">
			In Development
		</h2>
		<div class="space-y-3">
			{#each inDevProjects as project (project.id)}
				<ProjectCard {project} />
			{/each}

			<!-- Active Patch Job Card -->
			{#if activePatch && patchProject}
				<a
					href="/projects/{patchProject.id}"
					class="block rounded-xl border border-navy-600 bg-navy-700 p-4 transition-all hover:border-blue-600"
				>
					<div class="mb-2 flex items-center justify-between">
						<span class="text-sm font-semibold text-blue-300"
							>🩹 Patching "{patchProject.name}"</span
						>
						<span class="font-mono text-xs text-gray-400">
							{activePatch.wuInvested}/{activePatch.wuRequired} WU
						</span>
					</div>
					<div class="mb-1 h-1.5 w-full overflow-hidden rounded-full bg-navy-600">
						<div
							class="h-full rounded-full bg-blue-500 transition-all"
							style="width: {Math.min(
								100,
								(activePatch.wuInvested / activePatch.wuRequired) * 100
							)}%"
						></div>
					</div>
					<div class="text-xs text-gray-500">
						Fixing {activePatch.bugIdsToFix.length} bug(s)
					</div>
				</a>
			{/if}

			{#if !inDevProjects.length && !activePatch}
				<a
					href="/projects/new"
					class="flex items-center justify-center rounded-xl border border-dashed border-gray-600 bg-navy-700 p-4 text-sm text-gray-400 transition-all hover:border-neon/50 hover:text-gray-200"
				>
					+ New Project
				</a>
			{:else if !inDevProjects.length && activePatch}
				<!-- Show new project link disabled while patch is active -->
				<div
					class="flex items-center justify-center rounded-xl border border-dashed border-gray-700 p-4 text-sm text-gray-600"
				>
					Complete patch to start a new project
				</div>
			{:else}
				<a
					href="/projects/new"
					class="flex items-center justify-center rounded-xl border border-dashed border-gray-600 bg-navy-700 p-4 text-sm text-gray-400 transition-all hover:border-neon/50 hover:text-gray-200"
				>
					+ New Project
				</a>
			{/if}
		</div>
	</section>

	<!-- Live Products -->
	{#if liveProjects.length > 0}
		<section>
			<h2 class="mb-3 text-xs font-semibold tracking-widest text-gray-500 uppercase">
				Shipped Products
			</h2>
			<div class="space-y-3">
				{#each liveProjects as project (project.id)}
					<ShippedProductCard {project} />
				{/each}
			</div>
		</section>
	{/if}

	<!-- Dead Products -->
	{#if deadProjects.length > 0}
		<section>
			<h2 class="mb-3 text-xs font-semibold tracking-widest text-gray-500 uppercase">
				Dead Products
			</h2>
			<div class="space-y-3">
				{#each deadProjects as project (project.id)}
					<a
						href="/projects/{project.id}"
						class="block rounded-xl border border-gray-700 bg-gray-900 p-4 opacity-70 transition-all hover:opacity-100"
					>
						<div class="flex items-center justify-between">
							<div class="flex items-center gap-2">
								<span class="text-sm font-semibold text-gray-400">{project.name}</span>
								<span class="rounded bg-gray-800 px-1.5 py-0.5 text-xs text-gray-500">💀 DEAD</span>
								<span class="rounded bg-gray-800 px-1.5 py-0.5 font-mono text-xs text-gray-600"
									>v{project.version}</span
								>
							</div>
							<span class="text-xs text-gray-600">→</span>
						</div>
						<div class="mt-1 text-xs text-gray-600">
							{project.bugs.filter((b) => !b.fixed).length} unfixed bugs · ${Math.round(
								project.totalRevenue
							).toLocaleString()} lifetime
						</div>
					</a>
				{/each}
			</div>
		</section>
	{/if}

	<!-- Research -->
	<section>
		<div class="mb-3 flex items-center justify-between">
			<h2 class="text-xs font-semibold tracking-widest text-gray-500 uppercase">Research</h2>
			<a href="/research" class="text-xs text-neon">View Tree →</a>
		</div>
		{#if $activeResearch}
			<div class="rounded-xl bg-navy-700 p-4">
				<div class="mb-2 flex items-center justify-between">
					<span class="text-sm font-medium text-white">{$activeResearch.name}</span>
					<span class="font-mono text-xs text-gray-400">{$researchWeeksRemaining}wk left</span>
				</div>
				<div class="h-2 w-full overflow-hidden rounded-full bg-navy-600">
					<div
						class="h-full rounded-full bg-neon transition-all"
						style="width: {Math.min(
							100,
							($game.research.progressWu / ($activeResearch.weeksToComplete * 2)) * 100
						)}%"
					></div>
				</div>
			</div>
		{:else}
			<a
				href="/research"
				class="flex items-center justify-center rounded-xl border border-dashed border-gray-600 bg-navy-700 p-4 text-sm text-gray-400 transition-all hover:border-neon/50 hover:text-gray-200"
			>
				Start Research →
			</a>
		{/if}
	</section>

	<!-- Archived Products (collapsed) -->
	{#if $archivedProjects.length > 0}
		<section>
			<button
				onclick={() => (showArchivedSection = !showArchivedSection)}
				class="mb-3 flex w-full items-center justify-between text-xs font-semibold tracking-widest text-gray-600 uppercase transition-colors hover:text-gray-400"
			>
				<span>Archived ({$archivedProjects.length})</span>
				<span>{showArchivedSection ? '▲' : '▼'}</span>
			</button>
			{#if showArchivedSection}
				<div class="space-y-2">
					{#each $archivedProjects as project (project.id)}
						<a
							href="/projects/{project.id}"
							class="block rounded-xl border border-gray-800 bg-gray-950 p-3 transition-all hover:border-gray-600"
						>
							<div class="flex items-center justify-between text-sm">
								<div class="flex items-center gap-2">
									<span class="text-gray-500">📦 {project.name}</span>
									<span class="font-mono text-xs text-gray-700">v{project.version}</span>
								</div>
								<span class="font-mono text-xs text-gray-600"
									>${Math.round(project.totalRevenue).toLocaleString()} total</span
								>
							</div>
						</a>
					{/each}
				</div>
			{/if}
		</section>
	{/if}

	<!-- Notifications -->
	{#if $game.notifications.length > 0}
		<section>
			<h2 class="mb-3 text-xs font-semibold tracking-widest text-gray-500 uppercase">Events</h2>
			<NotificationLog notifications={$game.notifications} />
		</section>
	{/if}

	<!-- Reset -->
	<section class="pb-4 text-center">
		<button
			onclick={handleReset}
			class="text-xs text-gray-600 transition-colors hover:text-red-400"
		>
			{showReset ? '⚠️ Tap again to reset save' : 'Reset Game'}
		</button>
	</section>
</div>

<!-- Hosting Choice Modal -->
{#if pendingProject}
	<div class="fixed inset-0 z-50 flex items-end bg-black/70 pb-[70px]">
		<div class="mx-4 w-full max-w-lg rounded-2xl border border-navy-600 bg-navy-800 p-6">
			<h3 class="mb-1 text-base font-semibold text-white">
				Where will you host "{pendingProject.name}"?
			</h3>
			<p class="mb-4 text-xs text-gray-400">
				Choose your hosting strategy. You can switch later from the project page.
			</p>
			<div class="space-y-3">
				<button
					onclick={() => chooseHosting('external')}
					class="w-full rounded-xl border border-navy-600 p-4 text-left transition-all hover:border-neon"
				>
					<div class="flex items-center justify-between">
						<span class="font-medium text-white">☁️ External Hosting</span>
						<span class="font-mono text-sm text-amber-400">-${pendingExternalCost}/wk</span>
					</div>
					<p class="mt-1 text-xs text-gray-400">Zero maintenance, no outage risk.</p>
				</button>
				<button
					onclick={() => chooseHosting('self')}
					class="w-full rounded-xl border border-navy-600 p-4 text-left transition-all hover:border-neon"
				>
					<div class="flex items-center justify-between">
						<span class="font-medium text-white">🖥️ Self-Hosted</span>
						<span class="font-mono text-sm text-orange-400">-{pendingSelfWuDrain} WU/wk</span>
					</div>
					<p class="mt-1 text-xs text-gray-400">
						Free, but drains {pendingSelfWuDrain} WU/wk. Leaves you {wuAfterSelf} WU for development.
						5% weekly outage risk.
					</p>
				</button>
			</div>
		</div>
	</div>
{/if}

<AdvanceWeekButton />
