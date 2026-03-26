<script lang="ts">
	import { game, resetGame } from '$lib/stores/gameStore';
	import {
		totalWeeklyRevenue,
		shippedProjects,
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

	const lifestyleTier = $derived(SELF_COST_TIERS[$game.expenses.selfCostTier]);

	// Hosting choice modal
	const pendingProject = $derived(
		$game.pendingHostingChoiceId
			? $game.projects.find((p) => p.id === $game.pendingHostingChoiceId)
			: null
	);
	const pendingExternalCost = $derived(pendingProject ? (HOSTING_EXTERNAL_COST[pendingProject.type] ?? 0) : 0);
	const pendingSelfWuDrain = $derived(pendingProject ? (HOSTING_WU_DRAIN[pendingProject.type] ?? 0) : 0);
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
			notifications: ([
				{
					id: crypto.randomUUID(),
					week: s.meta.week,
					message: type === 'external'
						? `☁️ "${pendingProject.name}" on external hosting — $${cost}/wk.`
						: `🖥️ "${pendingProject.name}" self-hosted — ${drain} WU/wk drain.`,
					type: 'info'
				} satisfies Notification,
				...s.notifications
			] as Notification[]).slice(0, 50)
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
</script>

<!-- Sticky Header -->
<header class="bg-navy/95 border-navy-600 sticky top-0 z-30 border-b px-4 py-3 backdrop-blur">
	<div class="flex items-center justify-between">
		<div>
			<div class="font-mono text-xs text-gray-500">
				Week {$game.meta.week} · Year {$game.meta.year}
			</div>
			<div class="flex items-center gap-2">
				<span class="text-sm font-semibold text-white">{$game.meta.companyName}</span>
				<span class="rounded-full bg-navy-700 px-2 py-0.5 font-mono text-xs text-gray-400">
					{lifestyleTier.emoji} {lifestyleTier.label}
				</span>
			</div>
		</div>
		<div class="text-right">
			<div class="text-neon font-mono text-xl font-bold">
				${$game.meta.cash.toLocaleString(undefined, { maximumFractionDigits: 0 })}
			</div>
			<div class="text-xs text-gray-500">cash</div>
		</div>
	</div>
</header>

<div class="mx-auto max-w-lg px-4 py-4 space-y-6">

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

	<!-- Active Projects -->
	<section>
		<h2 class="mb-3 text-xs font-semibold uppercase tracking-widest text-gray-500">
			In Development
		</h2>
		<div class="space-y-3">
			{#each inDevProjects as project (project.id)}
				<ProjectCard {project} />
			{/each}
			<a
				href="/projects/new"
				class="bg-navy-700 hover:border-neon/50 flex items-center justify-center rounded-xl border border-dashed border-gray-600 p-4 text-sm text-gray-400 transition-all hover:text-gray-200"
			>
				+ New Project
			</a>
		</div>
	</section>

	<!-- Shipped Products -->
	{#if $shippedProjects.length > 0}
		<section>
			<h2 class="mb-3 text-xs font-semibold uppercase tracking-widest text-gray-500">
				Shipped Products
			</h2>
			<div class="space-y-3">
				{#each $shippedProjects as project (project.id)}
					<ShippedProductCard {project} />
				{/each}
			</div>
		</section>
	{/if}

	<!-- Research -->
	<section>
		<div class="mb-3 flex items-center justify-between">
			<h2 class="text-xs font-semibold uppercase tracking-widest text-gray-500">Research</h2>
			<a href="/research" class="text-neon text-xs">View Tree →</a>
		</div>
		{#if $activeResearch}
			<div class="bg-navy-700 rounded-xl p-4">
				<div class="mb-2 flex items-center justify-between">
					<span class="text-sm font-medium text-white">{$activeResearch.name}</span>
					<span class="font-mono text-xs text-gray-400">{$researchWeeksRemaining}wk left</span>
				</div>
				<div class="bg-navy-600 h-2 w-full overflow-hidden rounded-full">
					<div
						class="bg-neon h-full rounded-full transition-all"
						style="width: {Math.min(100, ($game.research.progressWu / ($activeResearch.weeksToComplete * 2)) * 100)}%"
					></div>
				</div>
			</div>
		{:else}
			<a
				href="/research"
				class="bg-navy-700 hover:border-neon/50 flex items-center justify-center rounded-xl border border-dashed border-gray-600 p-4 text-sm text-gray-400 transition-all hover:text-gray-200"
			>
				Start Research →
			</a>
		{/if}
	</section>

	<!-- Notifications -->
	{#if $game.notifications.length > 0}
		<section>
			<h2 class="mb-3 text-xs font-semibold uppercase tracking-widest text-gray-500">
				Events
			</h2>
			<NotificationLog notifications={$game.notifications} />
		</section>
	{/if}

	<!-- Reset -->
	<section class="pb-4 text-center">
		<button
			onclick={handleReset}
			class="text-xs text-gray-600 hover:text-red-400 transition-colors"
		>
			{showReset ? '⚠️ Tap again to reset save' : 'Reset Game'}
		</button>
	</section>

</div>

<!-- Hosting Choice Modal -->
{#if pendingProject}
	<div class="fixed inset-0 z-50 flex items-end bg-black/70 pb-8">
		<div class="bg-navy-800 border-navy-600 mx-4 w-full max-w-lg rounded-2xl border p-6">
			<h3 class="mb-1 text-base font-semibold text-white">Where will you host "{pendingProject.name}"?</h3>
			<p class="mb-4 text-xs text-gray-400">Choose your hosting strategy. You can switch later from the project page.</p>
			<div class="space-y-3">
				<button
					onclick={() => chooseHosting('external')}
					class="border-navy-600 hover:border-neon w-full rounded-xl border p-4 text-left transition-all"
				>
					<div class="flex items-center justify-between">
						<span class="font-medium text-white">☁️ External Hosting</span>
						<span class="font-mono text-sm text-amber-400">-${pendingExternalCost}/wk</span>
					</div>
					<p class="mt-1 text-xs text-gray-400">Zero maintenance, no outage risk.</p>
				</button>
				<button
					onclick={() => chooseHosting('self')}
					class="border-navy-600 hover:border-neon w-full rounded-xl border p-4 text-left transition-all"
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
