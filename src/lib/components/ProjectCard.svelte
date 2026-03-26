<script lang="ts">
	import type { Project } from '$lib/types';
	import { PROJECT_TYPES } from '$lib/engine/projects';

	interface Props {
		project: Project;
	}
	let { project }: Props = $props();

	const currentFeature = $derived(
		project.features.find((f) => f.status === 'in_progress' || f.status === 'not_started') ?? null
	);
	const typeLabel = $derived(PROJECT_TYPES[project.type]?.label ?? project.type);
</script>

<a
	href="/projects/{project.id}"
	class="bg-navy-700 hover:border-neon/50 block rounded-xl border border-transparent p-4 transition-all"
>
	<div class="mb-2 flex items-start justify-between gap-2">
		<span class="font-semibold text-white">{project.name}</span>
		<span class="bg-navy-600 shrink-0 rounded px-2 py-0.5 text-xs text-gray-400">{typeLabel}</span>
	</div>

	<div class="mb-1 flex items-center justify-between text-xs text-gray-400">
		<span>Progress</span>
		<span class="font-mono">{Math.round(project.progress)}%</span>
	</div>
	<div class="bg-navy-600 mb-3 h-2 w-full overflow-hidden rounded-full">
		<div
			class="bg-neon h-full rounded-full transition-all"
			style="width: {project.progress}%"
		></div>
	</div>

	{#if currentFeature}
		<div class="text-xs text-gray-500">
			Working on: <span class="text-gray-300">{currentFeature.name}</span>
		</div>
	{/if}
</a>
