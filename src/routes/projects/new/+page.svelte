<script lang="ts">
	import { goto } from '$app/navigation';
	import { game } from '$lib/stores/gameStore';
	import { PROJECT_TYPES, FEATURE_POOLS, PRICE_RANGES, LAPTOP_TIERS } from '$lib/engine/projects';
	import { estimateWeeklyRevenue } from '$lib/engine/pricing';
	import { availableWu } from '$lib/stores/derived';
	import FeatureCheckList from '$lib/components/FeatureCheckList.svelte';
	import type { ProjectType, ProjectFeature, Notification } from '$lib/types';

	let name = $state('');
	let type = $state<ProjectType>('basic_website');
	let showAllTypes = $state(false);
	let pricingModel = $state<'one_time' | 'subscription'>('one_time');
	let price = $state(5);
	let selectedFeatureIds = $state<string[]>([]);

	const completedResearch = $derived($game.research.completed);
	const laptopTier = $derived($game.expenses.laptopTier);
	const wu = $derived($availableWu);

	// All types split into available and locked (by research or hardware)
	const allTypes = $derived(
		(Object.keys(PROJECT_TYPES) as ProjectType[]).map((t) => {
			const researchMet = PROJECT_TYPES[t].requires.every((r) => completedResearch.includes(r));
			const hardwareMet = laptopTier >= PROJECT_TYPES[t].laptopTierMin;
			return {
				type: t,
				researchMet,
				hardwareMet,
				available: researchMet && hardwareMet
			};
		})
	);

	const availableTypes = $derived(allTypes.filter((t) => t.available).map((t) => t.type));

	// Ensure selected type is always in available list
	$effect(() => {
		if (!availableTypes.includes(type) && availableTypes.length > 0) {
			type = availableTypes[0];
		}
	});

	const features = $derived(FEATURE_POOLS[type] ?? []);

	const priceRange = $derived(PRICE_RANGES[type][pricingModel === 'one_time' ? 'oneTime' : 'subscription']);

	const totalWu = $derived(
		PROJECT_TYPES[type].baseWu +
			features
				.filter((f) => selectedFeatureIds.includes(f.id))
				.reduce((s, f) => s + f.wuCost, 0)
	);

	const estimatedWeeks = $derived(wu > 0 ? Math.ceil(totalWu / wu) : 0);

	const selectedFeatureRevenue = $derived(
		features
			.filter((f) => selectedFeatureIds.includes(f.id))
			.reduce((s, f) => s + f.revenueBoost, 0)
	);

	const projectedRevenue = $derived(
		estimateWeeklyRevenue(
			type,
			pricingModel,
			price,
			selectedFeatureRevenue,
			$game.meta.reputation,
			$game.meta.reputation
		)
	);

	const hasActiveProject = $derived($game.projects.some((p) => p.status === 'in_development'));

	const canStart = $derived(
		name.trim().length > 0 && selectedFeatureIds.length > 0 && !hasActiveProject && wu > 0
	);

	function toggleFeature(id: string) {
		if (selectedFeatureIds.includes(id)) {
			selectedFeatureIds = selectedFeatureIds.filter((f) => f !== id);
		} else {
			selectedFeatureIds = [...selectedFeatureIds, id];
		}
	}

	// Reset selections when type changes
	$effect(() => {
		type;
		selectedFeatureIds = [];
		const range = PRICE_RANGES[type][pricingModel === 'one_time' ? 'oneTime' : 'subscription'];
		price = Math.round((range[0] + range[1]) / 2);
	});

	$effect(() => {
		pricingModel;
		const range = PRICE_RANGES[type][pricingModel === 'one_time' ? 'oneTime' : 'subscription'];
		price = Math.round((range[0] + range[1]) / 2);
	});

	function laptopTierLabel(tier: number): string {
		return LAPTOP_TIERS[tier as 1 | 2 | 3 | 4]?.name ?? `Tier ${tier}`;
	}

	function startProject() {
		if (!canStart) return;

		const selectedFeatures: ProjectFeature[] = features
			.filter((f) => selectedFeatureIds.includes(f.id))
			.map((f) => ({
				...f,
				status: 'not_started',
				progressWu: 0
			}));

		const id = crypto.randomUUID();

		game.update((s) => ({
			...s,
			projects: [
				...s.projects,
				{
					id,
					name: name.trim(),
					type,
					status: 'in_development',
					pricingModel,
					price,
					progress: 0,
					totalWuRequired: totalWu,
					quality: completedResearch.includes('ui_ux') ? 10 : 0,
					bugsFound: 0,
					bugsFixed: 0,
					features: selectedFeatures,
					weeklyRevenue: 0,
					activeSubscribers: 0,
					revenueDecayRate: 0.5,
					weeksOnMarket: 0,
					totalRevenue: 0,
					revenueHistory: [],
					hostingType: 'none',
					hostingCostPerWeek: 0,
					hostingWuDrainPerWeek: 0,
					weekStarted: s.meta.week,
					weekShipped: null,
					techRequired: PROJECT_TYPES[type].requires
				}
			],
			notifications: ([
				{
					id: crypto.randomUUID(),
					week: s.meta.week,
					message: `🛠 Started "${name.trim()}" — ${estimatedWeeks} weeks estimated.`,
					type: 'info'
				} satisfies Notification,
				...s.notifications
			] as Notification[]).slice(0, 50)
		}));

		goto(`/projects/${id}`);
	}
</script>

<header class="bg-navy/95 border-navy-600 sticky top-0 z-30 border-b px-4 py-3 backdrop-blur">
	<div class="flex items-center gap-3">
		<a href="/" class="text-gray-400 hover:text-white">←</a>
		<h1 class="font-semibold text-white">New Project</h1>
	</div>
</header>

<div class="mx-auto max-w-lg space-y-6 px-4 py-6">

	{#if hasActiveProject}
		<div class="rounded-xl border border-yellow-700 bg-yellow-950 p-4 text-sm text-yellow-300">
			⚠️ You already have a project in development. Complete or cancel it before starting a new one.
		</div>
	{/if}

	<!-- Name -->
	<div>
		<label for="proj-name" class="mb-2 block text-sm font-medium text-gray-300">
			Project Name
		</label>
		<input
			id="proj-name"
			type="text"
			placeholder="e.g. TaskFlow Pro"
			bind:value={name}
			class="bg-navy-700 border-navy-600 focus:border-neon w-full rounded-xl border px-4 py-3 text-white placeholder-gray-600 outline-none transition-colors"
		/>
	</div>

	<!-- Type -->
	<div>
		<div class="mb-2 flex items-center justify-between">
			<label class="text-sm font-medium text-gray-300">Project Type</label>
			<div class="bg-navy-700 border-navy-600 flex rounded-lg border p-0.5">
				<button
					onclick={() => (showAllTypes = false)}
					class="rounded px-3 py-1 text-xs font-medium transition-colors"
					class:bg-neon={!showAllTypes}
					class:text-navy={!showAllTypes}
					class:text-gray-400={showAllTypes}
				>Available</button>
				<button
					onclick={() => (showAllTypes = true)}
					class="rounded px-3 py-1 text-xs font-medium transition-colors"
					class:bg-neon={showAllTypes}
					class:text-navy={showAllTypes}
					class:text-gray-400={!showAllTypes}
				>All</button>
			</div>
		</div>
		<div class="space-y-2">
			{#each allTypes.filter(e => showAllTypes || e.available) as entry (entry.type)}
				{@const typeInfo = PROJECT_TYPES[entry.type]}
				{@const isSelected = type === entry.type}
				{@const locked = !entry.available}
				<button
					onclick={() => entry.available && (type = entry.type)}
					disabled={locked}
					class="w-full rounded-xl border px-4 py-3 text-left text-sm transition-all {isSelected && !locked ? 'border-neon bg-neon/10' : (!isSelected ? 'border-navy-600 bg-navy-700' : 'border-navy-600')} {!locked ? 'text-white' : 'opacity-50 cursor-not-allowed'}"
				>
					<div class="flex items-center justify-between">
						<span class:text-neon={isSelected && !locked} class:font-semibold={isSelected && !locked}>
							{typeInfo.label}
						</span>
						{#if !entry.hardwareMet}
							<span class="rounded bg-orange-900 px-2 py-0.5 text-xs text-orange-300">
								Requires: {laptopTierLabel(typeInfo.laptopTierMin)}
							</span>
						{:else if !entry.researchMet}
							<span class="rounded bg-navy-600 px-2 py-0.5 text-xs text-gray-500">
								🔒 Research required
							</span>
						{/if}
					</div>
				</button>
			{/each}
		</div>
	</div>

	<!-- Pricing Model -->
	<div>
		<div class="mb-2 text-sm font-medium text-gray-300">Pricing Model</div>
		<div class="bg-navy-700 border-navy-600 flex rounded-xl border p-1">
			<button
				onclick={() => (pricingModel = 'one_time')}
				class="flex-1 rounded-lg py-2 text-sm font-medium transition-colors"
				class:bg-neon={pricingModel === 'one_time'}
				class:text-navy={pricingModel === 'one_time'}
				class:text-gray-400={pricingModel !== 'one_time'}
			>
				One-Time
			</button>
			<button
				onclick={() => (pricingModel = 'subscription')}
				class="flex-1 rounded-lg py-2 text-sm font-medium transition-colors"
				class:bg-neon={pricingModel === 'subscription'}
				class:text-navy={pricingModel === 'subscription'}
				class:text-gray-400={pricingModel !== 'subscription'}
			>
				Subscription
			</button>
		</div>
	</div>

	<!-- Price -->
	<div>
		<label for="proj-price" class="mb-2 block text-sm font-medium text-gray-300">
			Price
			<span class="ml-1 font-normal text-gray-500">
				(suggested: ${priceRange[0]}–${priceRange[1]}{pricingModel === 'subscription' ? '/mo' : ''})
			</span>
		</label>
		<div class="relative">
			<span class="absolute left-4 top-1/2 -translate-y-1/2 font-mono text-gray-400">$</span>
			<input
				id="proj-price"
				type="number"
				min="0.01"
				step="0.01"
				bind:value={price}
				class="bg-navy-700 border-navy-600 focus:border-neon w-full rounded-xl border py-3 pl-8 pr-4 font-mono text-white outline-none transition-colors"
			/>
		</div>
		{#if price < priceRange[0] || price > priceRange[1]}
			<p class="mt-1 text-xs text-amber-400">⚠️ Price outside suggested range — demand penalty applied</p>
		{/if}
	</div>

	<!-- Features -->
	<div>
		<div class="mb-2 text-sm font-medium text-gray-300">
			Features
			<span class="ml-1 font-normal text-gray-500">(select at least 1)</span>
		</div>
		<FeatureCheckList
			{features}
			selected={selectedFeatureIds}
			{completedResearch}
			onToggle={toggleFeature}
		/>
	</div>

	<!-- Live Summary -->
	<div class="bg-navy-700 border-navy-600 rounded-xl border p-4">
		<h3 class="mb-3 text-xs font-semibold uppercase tracking-widest text-gray-500">Summary</h3>
		<div class="space-y-2">
			<div class="flex justify-between text-sm">
				<span class="text-gray-400">Total WU required</span>
				<span class="font-mono text-white">{totalWu} WU</span>
			</div>
			<div class="flex justify-between text-sm">
				<span class="text-gray-400">Available WU/wk</span>
				<span class="font-mono" class:text-neon={wu > 0} class:text-red-400={wu <= 0}>{wu} WU</span>
			</div>
			<div class="flex justify-between text-sm">
				<span class="text-gray-400">Estimated weeks</span>
				<span class="font-mono text-white">{wu > 0 ? estimatedWeeks : '∞'} wk</span>
			</div>
			<div class="flex justify-between text-sm">
				<span class="text-gray-400">Projected revenue</span>
				<span class="text-neon font-mono font-bold">${Math.round(projectedRevenue).toLocaleString()}/wk</span>
			</div>
		</div>
	</div>

	<!-- Submit -->
	<button
		onclick={startProject}
		disabled={!canStart}
		class="w-full rounded-xl py-4 font-mono font-bold transition-colors"
		class:bg-neon={canStart}
		class:text-navy={canStart}
		class:hover:bg-neon-dim={canStart}
		class:bg-navy-600={!canStart}
		class:text-gray-500={!canStart}
		class:cursor-not-allowed={!canStart}
	>
		Start Project
	</button>

</div>
