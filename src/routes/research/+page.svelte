<script lang="ts">
	import { game } from '$lib/stores/gameStore';
	import { activeResearch, researchWeeksRemaining } from '$lib/stores/derived';
	import ResearchNode from '$lib/components/ResearchNode.svelte';
	import type { ResearchNode as ResearchNodeType } from '$lib/types';

	type Category = ResearchNodeType['category'];

	const categories: { id: Category; label: string }[] = [
		{ id: 'frontend', label: 'Frontend' },
		{ id: 'backend', label: 'Backend' },
		{ id: 'mobile', label: 'Mobile' },
		{ id: 'ai', label: 'AI' },
		{ id: 'infrastructure', label: 'Infrastructure' }
	];

	let activeTab = $state<Category>('frontend');

	const filteredNodes = $derived(
		$game.research.tree.filter((n) => n.category === activeTab)
	);

	let pendingResearchId = $state<string | null>(null);

	function handleStart(id: string) {
		if ($game.research.inProgress && $game.research.inProgress !== id) {
			pendingResearchId = id;
		} else {
			startResearch(id);
		}
	}

	function startResearch(id: string) {
		const node = $game.research.tree.find((n) => n.id === id);
		if (!node) return;

		game.update((s) => ({
			...s,
			meta: { ...s.meta, cash: s.meta.cash - node.upfrontCost },
			research: {
				...s.research,
				inProgress: id,
				progressWu: 0
			},
			notifications: [
				{
					id: crypto.randomUUID(),
					week: s.meta.week,
					message: `🔬 Started "${node.name}" research — $${node.upfrontCost.toLocaleString()} paid.`,
					type: 'info' as const
				},
				...s.notifications
			].slice(0, 50)
		}));
		pendingResearchId = null;
	}
</script>

<header class="bg-navy/95 border-navy-600 sticky top-0 z-30 border-b px-4 py-3 backdrop-blur">
	<div class="flex items-center gap-3">
		<a href="/" class="text-gray-400 hover:text-white">←</a>
		<h1 class="font-semibold text-white">Research Tree</h1>
	</div>
</header>

<!-- Active Research Banner -->
{#if $activeResearch}
	<div class="border-b border-green-900 bg-green-950 px-4 py-3">
		<div class="mx-auto max-w-lg">
			<div class="flex items-center justify-between text-sm">
				<span class="text-green-300">
					🔬 Researching: <strong>{$activeResearch.name}</strong>
				</span>
				<span class="font-mono text-xs text-green-400">
					{$researchWeeksRemaining} weeks left
				</span>
			</div>
			<div class="bg-navy-600 mt-2 h-1.5 w-full overflow-hidden rounded-full">
				<div
					class="bg-neon h-full rounded-full transition-all"
					style="width: {Math.min(100, ($game.research.progressWu / ($activeResearch.weeksToComplete * 2)) * 100)}%"
				></div>
			</div>
		</div>
	</div>
{/if}

<!-- Replace Research Confirmation -->
{#if pendingResearchId}
	{@const pending = $game.research.tree.find((n) => n.id === pendingResearchId)}
	<div class="fixed inset-0 z-50 flex items-end bg-black/60 pb-8">
		<div class="bg-navy-800 mx-4 w-full max-w-lg rounded-2xl p-6">
			<h3 class="mb-2 text-base font-semibold text-white">Replace Current Research?</h3>
			<p class="mb-4 text-sm text-gray-400">
				Switching to <strong class="text-white">{pending?.name}</strong> will reset your current
				progress on <strong class="text-white">{$activeResearch?.name}</strong>. You will pay
				<strong class="text-amber-400">${pending?.upfrontCost.toLocaleString()}</strong> upfront.
			</p>
			<div class="flex gap-3">
				<button
					onclick={() => (pendingResearchId = null)}
					class="border-navy-600 flex-1 rounded-xl border py-3 text-sm text-gray-300"
				>
					Keep Current
				</button>
				<button
					onclick={() => pendingResearchId && startResearch(pendingResearchId)}
					class="bg-neon text-white flex-1 rounded-xl py-3 text-sm font-bold"
				>
					Switch Research
				</button>
			</div>
		</div>
	</div>
{/if}

<div class="mx-auto max-w-lg px-4 py-4">

	<!-- Category Tabs -->
	<div class="mb-4 flex gap-1 overflow-x-auto pb-1">
		{#each categories as cat (cat.id)}
			<button
				onclick={() => (activeTab = cat.id)}
				class="shrink-0 rounded-lg px-3 py-1.5 text-xs font-medium transition-colors"
				class:bg-neon={activeTab === cat.id}
				class:text-white={activeTab === cat.id}
				class:bg-navy-700={activeTab !== cat.id}
				class:text-gray-400={activeTab !== cat.id}
			>
				{cat.label}
			</button>
		{/each}
	</div>

	<!-- Research Nodes -->
	<div class="space-y-3">
		{#each filteredNodes as node (node.id)}
			<ResearchNode
				{node}
				completed={$game.research.completed}
				inProgress={$game.research.inProgress}
				progressWu={$game.research.progressWu}
				cash={$game.meta.cash}
				onStart={handleStart}
			/>
		{/each}
		{#if filteredNodes.length === 0}
			<div class="rounded-xl border border-gray-700 p-6 text-center text-gray-500 text-sm">
				No research nodes in this category yet.
			</div>
		{/if}
	</div>

</div>
