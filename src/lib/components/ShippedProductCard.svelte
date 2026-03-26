<script lang="ts">
	import type { Project } from '$lib/types';
	import { PROJECT_TYPES } from '$lib/engine/projects';

	interface Props {
		project: Project;
	}
	let { project }: Props = $props();

	const typeLabel = $derived(PROJECT_TYPES[project.type]?.label ?? project.type);
</script>

<a
	href="/projects/{project.id}"
	class="bg-navy-700 hover:border-neon/50 block rounded-xl border border-transparent p-4 transition-all"
>
	<div class="mb-2 flex items-start justify-between gap-2">
		<span class="font-semibold text-white">{project.name}</span>
		<div class="flex shrink-0 gap-1">
			<span class="bg-navy-600 rounded px-2 py-0.5 text-xs text-gray-400">{typeLabel}</span>
			<span
				class="rounded px-2 py-0.5 text-xs font-semibold"
				class:bg-blue-900={project.pricingModel === 'subscription'}
				class:text-blue-300={project.pricingModel === 'subscription'}
				class:bg-purple-900={project.pricingModel === 'one_time'}
				class:text-purple-300={project.pricingModel === 'one_time'}
			>
				{project.pricingModel === 'subscription' ? 'SUB' : 'ONE-TIME'}
			</span>
		</div>
	</div>

	<div class="flex items-baseline gap-1">
		<span class="text-neon font-mono text-lg font-bold">
			${Math.round(project.weeklyRevenue).toLocaleString()}
		</span>
		<span class="text-xs text-gray-400">/wk</span>
	</div>

	<div class="mt-1 text-xs text-gray-500">
		{project.weeksOnMarket} week{project.weeksOnMarket !== 1 ? 's' : ''} on market
	</div>
</a>
