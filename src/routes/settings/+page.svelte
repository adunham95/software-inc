<script lang="ts">
	import { game, resetGame } from '$lib/stores/gameStore';
	import { goto } from '$app/navigation';

	let companyName = $state($game.meta.companyName);
	let showConfirm = $state(false);

	function saveName() {
		game.update((s) => ({ ...s, meta: { ...s.meta, companyName: companyName.trim() || s.meta.companyName } }));
	}

	async function handleReset() {
		resetGame();
		showConfirm = false;
		await goto('/');
	}
</script>

<div class="mx-auto max-w-lg px-4 py-8">
	<h1 class="mb-8 font-mono text-2xl font-bold text-white">Settings</h1>

	<section class="bg-navy-800 border-navy-600 mb-4 rounded-xl border p-5">
		<h2 class="mb-4 font-mono text-sm font-semibold tracking-widest text-gray-400 uppercase">Company</h2>
		<label class="mb-2 block text-sm text-gray-300" for="company-name">Company Name</label>
		<div class="flex gap-2">
			<input
				id="company-name"
				type="text"
				bind:value={companyName}
				maxlength="40"
				class="bg-navy border-navy-600 focus:border-neon flex-1 rounded-lg border px-3 py-2 font-mono text-sm text-white outline-none transition-colors"
			/>
			<button
				onclick={saveName}
				class="bg-neon text-navy rounded-lg px-4 py-2 font-mono text-sm font-semibold transition-opacity hover:opacity-80"
			>
				Save
			</button>
		</div>
	</section>

	<section class="bg-navy-800 border-navy-600 rounded-xl border p-5">
		<h2 class="mb-1 font-mono text-sm font-semibold tracking-widest text-gray-400 uppercase">Danger Zone</h2>
		<p class="mb-4 text-sm text-gray-500">This will erase all progress and cannot be undone.</p>

		{#if showConfirm}
			<div class="border-red-800 bg-red-950/40 mb-4 rounded-lg border p-4">
				<p class="mb-3 text-sm text-red-300">Are you sure? All data will be permanently deleted.</p>
				<div class="flex gap-2">
					<button
						onclick={handleReset}
						class="rounded-lg bg-red-600 px-4 py-2 font-mono text-sm font-semibold text-white transition-opacity hover:opacity-80"
					>
						Yes, Reset Everything
					</button>
					<button
						onclick={() => (showConfirm = false)}
						class="bg-navy-600 rounded-lg px-4 py-2 font-mono text-sm text-gray-300 transition-opacity hover:opacity-80"
					>
						Cancel
					</button>
				</div>
			</div>
		{:else}
			<button
				onclick={() => (showConfirm = true)}
				class="rounded-lg border border-red-700 px-4 py-2 font-mono text-sm text-red-400 transition-colors hover:bg-red-900/30"
			>
				Reset All Progress
			</button>
		{/if}
	</section>
</div>
