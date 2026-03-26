<script lang="ts">
	import type { ProjectFeature } from '$lib/types';

	interface Props {
		features: ProjectFeature[];
	}
	let { features }: Props = $props();
</script>

<div class="space-y-2">
	{#each features as feat (feat.id)}
		<div class="flex items-center gap-3">
			<span class="text-lg leading-none">
				{#if feat.status === 'complete'}
					✅
				{:else if feat.status === 'in_progress'}
					🔄
				{:else}
					⏳
				{/if}
			</span>
			<div class="min-w-0 flex-1">
				<div class="flex items-center justify-between text-sm">
					<span class:text-white={feat.status !== 'complete'} class:text-gray-500={feat.status === 'complete'}>
						{feat.name}
					</span>
					{#if feat.status === 'in_progress'}
						<span class="font-mono text-xs text-gray-400">
							{feat.progressWu}/{feat.wuCost} WU
						</span>
					{/if}
				</div>
				{#if feat.status === 'in_progress'}
					<div class="bg-navy-600 mt-1 h-1 w-full overflow-hidden rounded-full">
						<div
							class="bg-neon h-full rounded-full transition-all"
							style="width: {(feat.progressWu / feat.wuCost) * 100}%"
						></div>
					</div>
				{/if}
			</div>
		</div>
	{/each}
</div>
