<script lang="ts">
	interface Props {
		history: number[];
	}
	let { history }: Props = $props();

	const BARS = ['▁', '▂', '▃', '▄', '▅', '▆', '▇', '█'];

	const chart = $derived(() => {
		if (!history.length) return '─ ─ ─ ─ ─ ─ ─ ─';
		const max = Math.max(...history, 1);
		return history
			.map((v) => {
				const idx = Math.floor((v / max) * (BARS.length - 1));
				return BARS[Math.max(0, idx)];
			})
			.join(' ');
	});

	const peak = $derived(history.length ? Math.max(...history) : 0);
</script>

<div>
	<div class="text-neon font-mono text-xl tracking-widest">{chart()}</div>
	<div class="mt-1 text-xs text-gray-500">
		Peak: <span class="font-mono text-gray-300">${Math.round(peak).toLocaleString()}/wk</span>
	</div>
</div>
