<script lang="ts">
	import { game, resetGame } from '$lib/stores/gameStore';
	import {
		totalWeeklyRevenue,
		shippedProjects,
		activeResearch,
		researchWeeksRemaining
	} from '$lib/stores/derived';
	import StatChip from '$lib/components/StatChip.svelte';
	import ProjectCard from '$lib/components/ProjectCard.svelte';
	import ShippedProductCard from '$lib/components/ShippedProductCard.svelte';
	import NotificationLog from '$lib/components/NotificationLog.svelte';
	import AdvanceWeekButton from '$lib/components/AdvanceWeekButton.svelte';

	const inDevProjects = $derived($game.projects.filter((p) => p.status === 'in_development'));
	const activeCount = $derived(inDevProjects.length + $shippedProjects.length);

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
			<div class="text-sm font-semibold text-white">{$game.meta.companyName}</div>
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

	<!-- Stats Row -->
	<div class="grid grid-cols-3 gap-2">
		<StatChip
			label="Revenue/wk"
			value="${Math.round($totalWeeklyRevenue).toLocaleString()}"
			accent
		/>
		<StatChip label="Projects" value={String(activeCount)} />
		<StatChip label="Reputation" value={String($game.meta.reputation)} />
	</div>

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

<AdvanceWeekButton />
