<script lang="ts">
	import type { ResearchNode } from '$lib/types';
	import { RESEARCH_TREE } from '$lib/engine/research';

	interface Props {
		node: ResearchNode;
		completed: string[];
		inProgress: string | null;
		progressWu: number;
		cash: number;
		onStart: (id: string) => void;
	}
	let { node, completed, inProgress, progressWu, cash, onStart }: Props = $props();

	const isComplete = $derived(completed.includes(node.id));
	const isInProgress = $derived(inProgress === node.id);
	const prereqsMet = $derived(node.requires.every((r) => completed.includes(r)));
	const canAfford = $derived(cash >= node.upfrontCost);
	const isPrereqLocked = $derived(!prereqsMet && !isComplete && !isInProgress);
	const isCashLocked = $derived(prereqsMet && !isComplete && !isInProgress && !canAfford);
	const isAvailable = $derived(prereqsMet && !isComplete && !isInProgress && canAfford);

	const rpPerWeek = 2;
	const totalRp = $derived(node.weeksToComplete * rpPerWeek);
	const progressPct = $derived(isInProgress ? Math.min(100, (progressWu / totalRp) * 100) : 0);
	const weeksLeft = $derived(
		isInProgress ? Math.ceil((totalRp - progressWu) / rpPerWeek) : node.weeksToComplete
	);

	function getReqName(id: string): string {
		return RESEARCH_TREE.find((n) => n.id === id)?.name ?? id;
	}

	const cardClass = $derived(() => {
		if (isComplete) return 'border-neon bg-neon/10';
		if (isInProgress) return 'border-neon bg-navy-700';
		if (isCashLocked) return 'border-amber-700 bg-navy-700 opacity-75';
		if (isAvailable) return 'border-gray-500 bg-navy-700 hover:border-neon cursor-pointer';
		return 'border-navy-600 bg-navy-700 opacity-50';
	});
</script>

<div class="rounded-xl border p-4 transition-all {cardClass()}">
	<div class="mb-1 flex items-start justify-between gap-2">
		<span class="font-semibold text-white">{node.name}</span>
		<div class="flex shrink-0 items-center gap-1">
			{#if isComplete}
				<span class="text-sm">✅</span>
			{:else if isInProgress}
				<span class="text-neon font-mono text-xs">{weeksLeft}wk left</span>
			{:else if isCashLocked}
				<span class="font-mono text-xs text-amber-400">💰 ${node.upfrontCost.toLocaleString()}</span>
			{:else}
				<span class="font-mono text-xs text-gray-400">{node.weeksToComplete}wk</span>
			{/if}
		</div>
	</div>

	<p class="mb-2 text-xs text-gray-400">{node.description}</p>
	<p class="mb-2 text-xs text-green-400">{node.unlocks}</p>

	<!-- Cost row -->
	{#if !isComplete && !isInProgress}
		<div class="mb-2 flex items-center gap-2">
			<span class="font-mono text-xs" class:text-amber-400={isCashLocked} class:text-gray-500={!isCashLocked}>
				💸 ${node.upfrontCost.toLocaleString()} upfront · {node.weeksToComplete}wk
			</span>
		</div>
	{/if}

	{#if node.requires.length > 0}
		<div class="mb-2 flex flex-wrap gap-1">
			{#each node.requires as req (req)}
				<span
					class="rounded px-1.5 py-0.5 text-xs"
					class:bg-green-900={completed.includes(req)}
					class:text-green-400={completed.includes(req)}
					class:bg-navy-600={!completed.includes(req)}
					class:text-gray-500={!completed.includes(req)}
				>
					{getReqName(req)}
				</span>
			{/each}
		</div>
	{/if}

	{#if isInProgress}
		<div class="bg-navy-600 mt-2 h-1.5 w-full overflow-hidden rounded-full">
			<div
				class="bg-neon h-full rounded-full transition-all"
				style="width: {progressPct}%"
			></div>
		</div>
	{/if}

	{#if isCashLocked}
		<div class="mt-3 flex items-center gap-2 rounded-lg border border-amber-800 bg-amber-950 px-3 py-2">
			<span class="text-xs text-amber-400">💰 Need ${node.upfrontCost.toLocaleString()} to start — earn more revenue first</span>
		</div>
	{/if}

	{#if isPrereqLocked && node.requires.length > 0}
		<div class="mt-3 flex items-center gap-2 rounded-lg bg-navy-600 px-3 py-2">
			<span class="text-xs text-gray-500">🔒 Requires: {node.requires.map(getReqName).join(', ')}</span>
		</div>
	{/if}

	{#if isAvailable}
		<button
			class="border-neon text-neon hover:bg-neon hover:text-navy mt-3 w-full rounded-lg border py-1.5 text-xs font-semibold transition-colors"
			onclick={() => onStart(node.id)}
		>
			Start Research — ${node.upfrontCost.toLocaleString()}
		</button>
	{/if}
</div>
