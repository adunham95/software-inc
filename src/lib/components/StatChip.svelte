<script lang="ts">
	interface Props {
		label: string;
		value: string;
		accent?: boolean;
	}
	let { label, value, accent = false }: Props = $props();
</script>

<div class="bg-navy-700 rounded-lg px-3 py-2 text-center">
	<div class="font-mono text-sm font-bold" class:text-neon={accent} class:text-white={!accent}>
		{value}
	</div>
	<div class="mt-0.5 text-xs text-gray-400">{label}</div>
</div>
