<script lang="ts">
	import { RESEARCH_TREE } from '$lib/engine/research';

	interface FeatureTemplate {
		id: string;
		name: string;
		description: string;
		wuCost: number;
		revenueBoost: number;
		qualityBoost: number;
		unlockRequires: string[];
	}

	interface Props {
		features: FeatureTemplate[];
		selected: string[];
		completedResearch: string[];
		onToggle: (id: string) => void;
	}
	let { features, selected, completedResearch, onToggle }: Props = $props();

	function isLocked(feat: { unlockRequires: string[] }): boolean {
		return feat.unlockRequires.some((r) => !completedResearch.includes(r));
	}

	function getResearchName(id: string): string {
		return RESEARCH_TREE.find((n) => n.id === id)?.name ?? id;
	}
</script>

<div class="space-y-2">
	{#each features as feat (feat.id)}
		{@const locked = isLocked(feat)}
		{@const checked = selected.includes(feat.id)}
		<label
			class="flex cursor-pointer items-start gap-3 rounded-lg border p-3 transition-all
				{checked && !locked ? 'border-neon bg-neon/5' : 'border-navy-600 bg-navy-700'}
				{locked ? 'cursor-not-allowed opacity-50' : ''}"
		>
			<input
				type="checkbox"
				class="border-navy-500 mt-0.5 shrink-0 rounded bg-navy-600 checked:border-neon checked:bg-neon"
				{checked}
				disabled={locked}
				onchange={() => !locked && onToggle(feat.id)}
			/>
			<div class="min-w-0 flex-1">
				<div class="flex items-center justify-between gap-2">
					<span class="text-sm font-medium text-white">{feat.name}</span>
					<div class="flex shrink-0 gap-2 text-xs text-gray-400">
						<span class="font-mono">{feat.wuCost} WU</span>
						<span class="text-blue-400">+{feat.qualityBoost} Q</span>
					</div>
				</div>
				<div class="mt-0.5 text-xs text-gray-500">{feat.description}</div>
				{#if locked}
					<div class="mt-1 text-xs text-amber-500">
						Requires: {feat.unlockRequires.map(getResearchName).join(', ')}
					</div>
				{/if}
			</div>
		</label>
	{/each}
</div>
