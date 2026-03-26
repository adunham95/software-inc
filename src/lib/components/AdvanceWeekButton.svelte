<script lang="ts">
	import { game } from '$lib/stores/gameStore';
	import { advanceWeek } from '$lib/engine/weekTick';

	let advancing = $state(false);

	function handleAdvance() {
		if (advancing) return;
		advancing = true;
		game.update((s) => advanceWeek(s));
		setTimeout(() => (advancing = false), 300);
	}
</script>

<div class="bg-navy-800 border-navy-600 fixed bottom-16 left-0 right-0 z-40 border-t px-4 py-2">
	<button
		onclick={handleAdvance}
		disabled={advancing}
		class="bg-neon text-navy hover:bg-neon-dim w-full rounded-xl py-3.5 font-mono text-base font-bold transition-colors disabled:opacity-60"
	>
		{advancing ? '...' : '⏭ Advance Week'}
	</button>
</div>
