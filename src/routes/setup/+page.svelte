<script lang="ts">
	import { game } from '$lib/stores/gameStore';
	import { availableWu } from '$lib/stores/derived';
	import { LAPTOP_TIERS, SELF_COST_TIERS } from '$lib/engine/projects';
	import type { LaptopTier, SelfCostTier, Notification } from '$lib/types';

	const laptopTier = $derived($game.expenses.laptopTier);
	const currentLaptop = $derived(LAPTOP_TIERS[laptopTier]);
	const nextTier = $derived(laptopTier < 4 ? ((laptopTier + 1) as LaptopTier) : null);
	const nextLaptop = $derived(nextTier ? LAPTOP_TIERS[nextTier] : null);
	const canAffordUpgrade = $derived(nextLaptop ? $game.meta.cash >= nextLaptop.purchasePrice : false);

	const selfCostTier = $derived($game.expenses.selfCostTier);

	const selfCostOrder: SelfCostTier[] = ['bedroom', 'apartment', 'home_office', 'coworking'];

	function upgradeLaptop() {
		if (!nextTier || !nextLaptop || !canAffordUpgrade) return;
		game.update((s) => ({
			...s,
			meta: { ...s.meta, cash: s.meta.cash - nextLaptop.purchasePrice },
			expenses: {
				...s.expenses,
				laptopTier: nextTier
			},
			notifications: ([
				{
					id: crypto.randomUUID(),
					week: s.meta.week,
					message: `💻 Upgraded to ${nextLaptop.name}! Now ${nextLaptop.wuPerWeek} WU/week base.`,
					type: 'success'
				} satisfies Notification,
				...s.notifications
			] as Notification[]).slice(0, 50)
		}));
	}

	function switchLifestyle(tier: SelfCostTier) {
		if (tier === selfCostTier) return;
		const tierData = SELF_COST_TIERS[tier];
		game.update((s) => ({
			...s,
			expenses: {
				...s.expenses,
				selfCostTier: tier,
				weeklySelfCost: tierData.weeklyCost
			},
			notifications: ([
				{
					id: crypto.randomUUID(),
					week: s.meta.week,
					message: `${tierData.emoji} Lifestyle upgraded to ${tierData.label} — $${tierData.weeklyCost}/wk.`,
					type: 'info'
				} satisfies Notification,
				...s.notifications
			] as Notification[]).slice(0, 50)
		}));
	}
</script>

<header class="bg-navy/95 border-navy-600 sticky top-0 z-30 border-b px-4 py-3 backdrop-blur">
	<div class="flex items-center gap-3">
		<a href="/" class="text-gray-400 hover:text-white">←</a>
		<h1 class="font-semibold text-white">Setup</h1>
	</div>
</header>

<div class="mx-auto max-w-lg space-y-8 px-4 py-6">

	<!-- Gear Section -->
	<section>
		<h2 class="mb-4 text-xs font-semibold uppercase tracking-widest text-gray-500">Gear</h2>

		<!-- Current Laptop -->
		<div class="bg-navy-700 border-neon/30 mb-3 rounded-xl border p-4">
			<div class="mb-1 flex items-center justify-between">
				<span class="font-semibold text-white">💻 {currentLaptop.name}</span>
				<span class="rounded bg-navy-600 px-2 py-0.5 font-mono text-xs text-gray-400">Tier {laptopTier}</span>
			</div>
			<div class="space-y-1 text-sm">
				<div class="flex justify-between">
					<span class="text-gray-400">Base WU/week</span>
					<span class="text-neon font-mono font-bold">{currentLaptop.wuPerWeek} WU</span>
				</div>
				<div class="flex justify-between">
					<span class="text-gray-400">Available WU/week</span>
					<span
						class="font-mono font-bold"
						class:text-neon={$availableWu > 0}
						class:text-red-400={$availableWu <= 0}
					>
						{$availableWu} WU
					</span>
				</div>
				<div class="flex justify-between">
					<span class="text-gray-400">Description</span>
					<span class="text-gray-300">{currentLaptop.description}</span>
				</div>
			</div>
		</div>

		<!-- Upgrade Card -->
		{#if nextTier && nextLaptop}
			<div class="bg-navy-700 border-navy-600 rounded-xl border p-4">
				<div class="mb-3 flex items-center justify-between">
					<div>
						<div class="font-semibold text-white">🚀 {nextLaptop.name}</div>
						<div class="text-xs text-gray-400">Tier {nextTier} · {nextLaptop.wuPerWeek} WU/week</div>
					</div>
					<div class="text-right">
						<div class="font-mono text-sm font-bold text-white">${nextLaptop.purchasePrice.toLocaleString()}</div>
						<div class="text-xs text-gray-500">one-time</div>
					</div>
				</div>
				<button
					onclick={upgradeLaptop}
					disabled={!canAffordUpgrade}
					class="w-full rounded-xl py-3 text-sm font-bold transition-colors"
					class:bg-neon={canAffordUpgrade}
					class:text-white={canAffordUpgrade}
					class:bg-navy-600={!canAffordUpgrade}
					class:text-gray-500={!canAffordUpgrade}
					class:cursor-not-allowed={!canAffordUpgrade}
				>
					{canAffordUpgrade ? 'Upgrade Hardware' : `Need $${nextLaptop.purchasePrice.toLocaleString()}`}
				</button>
			</div>
		{:else}
			<div class="rounded-xl border border-neon/30 bg-neon/5 p-4 text-center text-sm text-neon">
				🏆 Max hardware tier reached!
			</div>
		{/if}
	</section>

	<!-- Lifestyle Section -->
	<section>
		<h2 class="mb-1 text-xs font-semibold uppercase tracking-widest text-gray-500">Lifestyle</h2>
		<p class="mb-4 text-xs text-gray-500">Weekly living costs — deducted automatically each week.</p>

		<div class="space-y-2">
			{#each selfCostOrder as tier (tier)}
				{@const tierData = SELF_COST_TIERS[tier]}
				{@const isActive = tier === selfCostTier}
				<button
					onclick={() => switchLifestyle(tier)}
					class="w-full rounded-xl border p-4 text-left transition-all {isActive ? 'border-neon bg-neon/10' : 'border-navy-600 bg-navy-700 hover:border-gray-500'}"
				>
					<div class="flex items-center justify-between">
						<div class="flex items-center gap-2">
							<span class="text-base">{tierData.emoji}</span>
							<div>
								<div class="font-medium" class:text-neon={isActive} class:text-white={!isActive}>
									{tierData.label}
									{#if isActive}
										<span class="ml-2 text-xs font-normal text-gray-400">✓ current</span>
									{/if}
								</div>
								<div class="text-xs text-gray-500">{tierData.flavour}</div>
							</div>
						</div>
						<span class="font-mono text-sm font-bold" class:text-neon={isActive} class:text-amber-400={!isActive}>
							${tierData.weeklyCost}/wk
						</span>
					</div>
				</button>
			{/each}
		</div>
	</section>

</div>
