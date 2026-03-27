<script lang="ts">
	import { page } from '$app/state';
	import { goto } from '$app/navigation';
	import { game } from '$lib/stores/gameStore';
	import { PROJECT_TYPES, FEATURE_POOLS, PRICE_RANGES, LAPTOP_TIERS, ADVERTISING_FEATURE, CATEGORY_FEATURE_POOLS, CATEGORIES_FOR_TYPE, CATEGORY_LABELS, ALL_API_GATED_FEATURE_IDS, getUnlockedSubProductFeatures } from '$lib/engine/projects';
	import { estimateWeeklyRevenue } from '$lib/engine/pricing';
	import { availableWu } from '$lib/stores/derived';
	import FeatureCheckList from '$lib/components/FeatureCheckList.svelte';
	import type { ProjectType, ProjectCategory, ProjectFeature, Notification, Bug } from '$lib/types';

	// Major release mode
	const majorFromId = $derived(page.url.searchParams.get('majorFrom'));
	const parentProject = $derived(
		majorFromId ? ($game.projects.find((p) => p.id === majorFromId) ?? null) : null
	);
	const isMajorRelease = $derived(parentProject !== null);

	// Compute next major version: "1.2" → "2.0"
	const nextMajorVersion = $derived(
		parentProject
			? `${Math.floor(parseFloat(parentProject.version)) + 1}.0`
			: '1.0'
	);

	// Platform modes
	const platformIdParam = $derived(page.url.searchParams.get('platformId'));
	const isPlatformApiMode = $derived(
		platformIdParam !== null && page.url.searchParams.get('platformApi') === 'true'
	);
	const isLandingPageMode = $derived(
		platformIdParam !== null && page.url.searchParams.get('landingPage') === 'true'
	);
	const isSubProductMode = $derived(
		platformIdParam !== null && !isPlatformApiMode && !isLandingPageMode
	);

	const hostPlatform = $derived(
		platformIdParam ? ($game.platforms ?? []).find((p) => p.id === platformIdParam) ?? null : null
	);
	const platformApiProject = $derived(
		hostPlatform?.apiProjectId
			? $game.projects.find((p) => p.id === hostPlatform!.apiProjectId) ?? null
			: null
	);
	const completedApiFeatureIds = $derived(
		platformApiProject
			? platformApiProject.features.filter((f) => f.status === 'complete').map((f) => f.id)
			: []
	);

	let name = $state('');
	let type = $state<ProjectType>('basic_website');
	let category = $state<ProjectCategory | null>(null);
	let showAllTypes = $state(false);
	let pricingModel = $state<'one_time' | 'subscription'>('one_time');
	let price = $state(5);
	let selectedFeatureIds = $state<string[]>([]);

	// Force type and category for platform modes
	$effect(() => {
		if (isPlatformApiMode) {
			type = 'api';
			category = null;
		} else if (isLandingPageMode) {
			type = 'basic_website';
			category = 'landing_page' as ProjectCategory;
		}
	});

	// Pre-fill from parent when in major release mode
	$effect(() => {
		if (parentProject) {
			name = `${parentProject.name} ${nextMajorVersion.split('.')[0]}.0`;
			type = parentProject.type;
			category = parentProject.category;
			pricingModel = parentProject.pricingModel;
			price = parentProject.price;
			// Pre-select all carried-over features + bug fix features
			const carriedIds = parentProject.features
				.filter((f) => f.status === 'complete')
				.map((f) => f.id);
			const bugFixIds = parentProject.bugs
				.filter((b) => !b.fixed)
				.map((b) => `bugfix_${b.id}`);
			selectedFeatureIds = [...carriedIds, ...bugFixIds];
		}
	});

	const completedResearch = $derived($game.research.completed);
	const laptopTier = $derived($game.expenses.laptopTier);
	const wu = $derived($availableWu);

	const SUB_PRODUCT_TYPES: ProjectType[] = ['mobile_app', 'saas', 'desktop_app'];

	// All types split into available and locked (by research or hardware)
	const allTypes = $derived(
		(Object.keys(PROJECT_TYPES) as ProjectType[])
			.filter((t) => {
				if (isPlatformApiMode) return t === 'api';
				if (isLandingPageMode) return t === 'basic_website';
				if (isSubProductMode) return SUB_PRODUCT_TYPES.includes(t);
				// Normal mode: exclude 'api' type
				return t !== 'api';
			})
			.map((t) => {
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

	// Reset category when type changes (skip in forced platform modes)
	$effect(() => {
		if (isPlatformApiMode || isLandingPageMode) return;
		type;
		category = null;
		selectedFeatureIds = [];
		const range = PRICE_RANGES[type][pricingModel === 'one_time' ? 'oneTime' : 'subscription'];
		price = Math.round((range[0] + range[1]) / 2);
	});

	const categoriesForType = $derived(CATEGORIES_FOR_TYPE[type] ?? []);

	// Whether a category selection is required
	const needsCategory = $derived(!isPlatformApiMode && !isLandingPageMode);

	// Bug fix WU cost helper
	function bugFixWuCost(bug: Bug): number {
		return bug.severity === 'critical' ? 10 : bug.severity === 'major' ? 5 : 2;
	}

	// API-unlocked feature IDs for sub-product mode
	const apiUnlockedFeatureIds = $derived(
		isSubProductMode && platformApiProject
			? getUnlockedSubProductFeatures(completedApiFeatureIds, type)
			: new Set<string>()
	);

	const API_FEATURE_NAMES: Record<string, string> = {
		api_auth: 'Auth',
		api_rate_limit: 'Rate Limiting',
		api_analytics: 'Analytics',
		api_webhooks: 'Webhooks',
		api_sdks: 'SDKs',
		api_graphql: 'GraphQL',
		api_admin: 'Admin Console'
	};

	const activeApiFeatureNames = $derived(
		completedApiFeatureIds.map((id) => API_FEATURE_NAMES[id]).filter((n): n is string => !!n)
	);

	// Merge base + category + advertising features, with major release modifications
	const features = $derived.by(() => {
		if (isPlatformApiMode) {
			return FEATURE_POOLS['api'] ?? [];
		}

		const base = FEATURE_POOLS[type] ?? [];
		const catFeatures = category ? (CATEGORY_FEATURE_POOLS[type]?.[category] ?? []) : [];
		let allFeatures = [...base, ...catFeatures, ADVERTISING_FEATURE];

		if (isSubProductMode) {
			// Filter out API-gated features that haven't been unlocked
			allFeatures = allFeatures.filter(
				(f) => !ALL_API_GATED_FEATURE_IDS.has(f.id) || apiUnlockedFeatureIds.has(f.id)
			);
		}

		if (isMajorRelease && parentProject) {
			const completedIds = new Set(
				parentProject.features.filter((f) => f.status === 'complete').map((f) => f.id)
			);
			// Halve WU cost for carried-over features
			allFeatures = allFeatures.map((f) =>
				completedIds.has(f.id) ? { ...f, wuCost: Math.max(1, Math.ceil(f.wuCost / 2)) } : f
			);
			// Add bug fix line items for each unfixed bug in parent
			const bugFixFeatures = parentProject.bugs
				.filter((b) => !b.fixed)
				.map((b) => ({
					id: `bugfix_${b.id}`,
					name: `Fix: ${b.description}`,
					description: `Bug fix (${b.severity}) — -${(b.revenueImpact * 100).toFixed(1)}%/wk removed`,
					wuCost: bugFixWuCost(b),
					revenueBoost: 0,
					qualityBoost: 1,
					unlockRequires: [] as string[]
				}));
			allFeatures = [...allFeatures, ...bugFixFeatures];
		}

		return allFeatures;
	});

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
		isPlatformApiMode || isLandingPageMode
			? 0
			: estimateWeeklyRevenue(
					type,
					pricingModel,
					price,
					selectedFeatureRevenue,
					$game.meta.reputation,
					$game.meta.reputation
				)
	);

	const hasPatchJob = $derived($game.activePatchJobs.length > 0);
	const hasMajorReleaseInDev = $derived(
		$game.projects.some((p) => p.isMajorRelease && p.status === 'in_development')
	);

	const canStart = $derived(
		name.trim().length > 0 &&
			selectedFeatureIds.length > 0 &&
			(!needsCategory || category !== null) &&
			!hasPatchJob &&
			wu > 0 &&
			(!isMajorRelease || !hasMajorReleaseInDev)
	);

	function toggleFeature(id: string) {
		if (selectedFeatureIds.includes(id)) {
			selectedFeatureIds = selectedFeatureIds.filter((f) => f !== id);
		} else {
			selectedFeatureIds = [...selectedFeatureIds, id];
		}
	}

	$effect(() => {
		pricingModel;
		if (isPlatformApiMode || isLandingPageMode) return;
		const range = PRICE_RANGES[type][pricingModel === 'one_time' ? 'oneTime' : 'subscription'];
		price = Math.round((range[0] + range[1]) / 2);
	});

	function laptopTierLabel(tier: number): string {
		return LAPTOP_TIERS[tier as 1 | 2 | 3 | 4]?.name ?? `Tier ${tier}`;
	}

	function startProject() {
		if (!canStart) return;
		if (needsCategory && !category) return;

		const allFeatures = features;
		const selectedFeatures: ProjectFeature[] = allFeatures
			.filter((f) => selectedFeatureIds.includes(f.id))
			.map((f) => ({
				...f,
				status: 'not_started' as const,
				progressWu: 0
			}));

		const id = crypto.randomUUID();
		const version = isMajorRelease ? nextMajorVersion : '1.0';
		const parentId = isMajorRelease ? (majorFromId ?? null) : null;

		game.update((s) => {
			const newProject = {
				id,
				name: name.trim(),
				type,
				category: category,
				status: 'in_development' as const,
				pricingModel,
				price,
				progress: 0,
				totalWuRequired: totalWu,
				quality: completedResearch.includes('ui_ux') ? 10 : 0,
				bugsFound: 0,
				bugsFixed: 0,
				features: selectedFeatures,
				weeklyRevenue: 0,
				adRevenue: 0,
				activeSubscribers: 0,
				revenueDecayRate: 0.5,
				weeksOnMarket: 0,
				totalRevenue: 0,
				revenueHistory: [],
				hostingType: 'none' as const,
				hostingCostPerWeek: 0,
				hostingWuDrainPerWeek: 0,
				weekStarted: s.meta.week,
				weekShipped: null,
				techRequired: PROJECT_TYPES[type].requires,
				bugs: [],
				bugAccumulator: 0,
				totalBugsFixed: 0,
				lastPatchedWeek: null,
				version,
				parentProjectId: parentId,
				isMajorRelease,
				archivedWeek: null,
				marketing: {
					passiveLevel: 'none' as const,
					activeCampaign: null,
					campaignHistory: []
				},
				// Platform fields
				platformId: platformIdParam ?? null,
				isPlatformApi: isPlatformApiMode,
				isLandingPage: isLandingPageMode,
				platformBonus: 0
			};

			// Update the host platform's project references
			let updatedPlatforms = s.platforms ?? [];
			if (platformIdParam) {
				updatedPlatforms = updatedPlatforms.map((plat) => {
					if (plat.id !== platformIdParam) return plat;
					if (isPlatformApiMode) {
						return { ...plat, apiProjectId: id };
					} else {
						return { ...plat, subProductIds: [...plat.subProductIds, id] };
					}
				});
			}

			return {
				...s,
				projects: [...s.projects, newProject],
				platforms: updatedPlatforms,
				notifications: ([
					{
						id: crypto.randomUUID(),
						week: s.meta.week,
						message: isPlatformApiMode
							? `🔧 Building API for "${hostPlatform?.name}" — ${estimatedWeeks} weeks estimated.`
							: isLandingPageMode
								? `🌐 Building landing page for "${hostPlatform?.name}".`
								: isMajorRelease
									? `📦 Major Release "${name.trim()}" started — ${estimatedWeeks} weeks estimated.`
									: `🛠 Started "${name.trim()}" — ${estimatedWeeks} weeks estimated.`,
						type: 'info'
					} satisfies Notification,
					...s.notifications
				] as Notification[]).slice(0, 50)
			};
		});

		if (platformIdParam) {
			goto(`/platforms/${platformIdParam}`);
		} else {
			goto(`/projects/${id}`);
		}
	}
</script>

<header class="bg-navy/95 border-navy-600 sticky top-0 z-30 border-b px-4 py-3 backdrop-blur">
	<div class="flex items-center gap-3">
		<a
			href={platformIdParam
				? `/platforms/${platformIdParam}`
				: isMajorRelease && parentProject
					? `/projects/${parentProject.id}`
					: '/'}
			class="text-gray-400 hover:text-white"
		>←</a>
		<h1 class="font-semibold text-white">
			{isPlatformApiMode
				? 'Build Platform API'
				: isLandingPageMode
					? 'Add Landing Page'
					: isSubProductMode
						? 'Add Product'
						: isMajorRelease
							? 'Plan Major Release'
							: 'New Project'}
		</h1>
	</div>
</header>

<div class="mx-auto max-w-lg space-y-6 px-4 py-6">

	<!-- Platform mode banners -->
	{#if isPlatformApiMode && hostPlatform}
		<div class="rounded-xl border border-blue-700 bg-blue-950 p-4">
			<div class="mb-1 text-sm font-semibold text-blue-300">
				🔧 Building API for "{hostPlatform.name}"
			</div>
			<div class="text-xs text-blue-400">
				The API is the backbone of your platform. Build and ship it first to unlock sub-products.
				Costs 50 WU base + selected features.
			</div>
		</div>
	{:else if isLandingPageMode && hostPlatform}
		<div class="rounded-xl border border-purple-700 bg-purple-950 p-4">
			<div class="mb-1 text-sm font-semibold text-purple-300">
				🌐 Landing Page for "{hostPlatform.name}"
			</div>
			<div class="text-xs text-purple-400">
				Earns $0 revenue but boosts brand strength and marketing bonus for the whole platform.
			</div>
		</div>
	{:else if isSubProductMode && hostPlatform}
		<div class="rounded-xl border border-cyan-700 bg-cyan-950 p-4">
			<div class="mb-1 text-sm font-semibold text-cyan-300">
				📱 Adding product to "{hostPlatform.name}"
			</div>
			<div class="text-xs text-cyan-400">
				This product shares the platform user base. Revenue is driven by shared users, not standalone demand.
				{#if platformApiProject}
					API features unlocked: {completedApiFeatureIds.length}
				{/if}
			</div>
		</div>
	{/if}

	{#if isMajorRelease && parentProject}
		<div class="rounded-xl border border-purple-700 bg-purple-950 p-4">
			<div class="mb-1 text-sm font-semibold text-purple-300">
				📦 Major Release — from "{parentProject.name}" v{parentProject.version}
			</div>
			<div class="text-xs text-purple-400">
				Previously completed features cost half WU. Unfixed bugs are included as fix items.
			</div>
		</div>
	{/if}
	{#if hasPatchJob}
		<div class="rounded-xl border border-yellow-700 bg-yellow-950 p-4 text-sm text-yellow-300">
			⚠️ A patch is in progress. Wait for it to complete before starting a new project.
		</div>
	{/if}
	{#if isMajorRelease && hasMajorReleaseInDev}
		<div class="rounded-xl border border-yellow-700 bg-yellow-950 p-4 text-sm text-yellow-300">
			⚠️ A major release is already in development. Only one at a time.
		</div>
	{/if}

	<!-- Name -->
	<div>
		<label for="proj-name" class="mb-2 block text-sm font-medium text-gray-300">
			{isPlatformApiMode ? 'API Name' : isLandingPageMode ? 'Landing Page Name' : 'Project Name'}
		</label>
		<input
			id="proj-name"
			type="text"
			placeholder={isPlatformApiMode
				? `e.g. ${hostPlatform?.name ?? 'Platform'} API`
				: isLandingPageMode
					? `e.g. ${hostPlatform?.name ?? 'Platform'} Site`
					: 'e.g. TaskFlow Pro'}
			bind:value={name}
			class="bg-navy-700 border-navy-600 focus:border-neon w-full rounded-xl border px-4 py-3 text-white placeholder-gray-600 outline-none transition-colors"
		/>
	</div>

	<!-- Type (hidden in forced platform modes) -->
	{#if !isPlatformApiMode && !isLandingPageMode}
		<div>
			{#if isMajorRelease || isSubProductMode}
				<div class="mb-2 text-sm font-medium text-gray-300">Project Type</div>
				{#if isMajorRelease}
					<div class="bg-navy-700 border-navy-600 rounded-xl border px-4 py-3 text-sm text-gray-400">
						{PROJECT_TYPES[type]?.label ?? type}
						<span class="ml-2 text-xs text-gray-600">(locked — same as original)</span>
					</div>
				{:else}
					<div class="space-y-2">
						{#each allTypes as entry (entry.type)}
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
				{/if}
			{:else}
				<div class="mb-2 flex items-center justify-between">
					<span class="text-sm font-medium text-gray-300">Project Type</span>
					<div class="bg-navy-700 border-navy-600 flex rounded-lg border p-0.5">
						<button
							onclick={() => (showAllTypes = false)}
							class="rounded px-3 py-1 text-xs font-medium transition-colors"
							class:bg-neon={!showAllTypes}
							class:text-white={!showAllTypes}
							class:text-gray-400={showAllTypes}
						>Available</button>
						<button
							onclick={() => (showAllTypes = true)}
							class="rounded px-3 py-1 text-xs font-medium transition-colors"
							class:bg-neon={showAllTypes}
							class:text-white={showAllTypes}
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
			{/if}
		</div>
	{/if}

	<!-- Category (hidden for API mode and landing page mode) -->
	{#if !isPlatformApiMode && !isLandingPageMode}
		<div>
			<div class="mb-2 text-sm font-medium text-gray-300">
				Category <span class="font-normal text-gray-500">(required)</span>
			</div>
			<div class="grid grid-cols-2 gap-2">
				{#each categoriesForType as cat (cat)}
					<button
						onclick={() => { category = cat; selectedFeatureIds = []; }}
						class="rounded-xl border px-3 py-2.5 text-sm font-medium transition-all text-left"
						class:border-neon={category === cat}
						class:bg-neon={category === cat}
						class:text-white={category === cat}
						class:border-navy-600={category !== cat}
						class:bg-navy-700={category !== cat}
						class:text-gray-300={category !== cat}
					>
						{CATEGORY_LABELS[cat] ?? cat}
					</button>
				{/each}
			</div>
		</div>
	{/if}

	<!-- Pricing Model (hidden for platform modes) -->
	{#if !isPlatformApiMode && !isLandingPageMode}
		<div>
			<div class="mb-2 text-sm font-medium text-gray-300">Pricing Model</div>
			<div class="bg-navy-700 border-navy-600 flex rounded-xl border p-1">
				<button
					onclick={() => (pricingModel = 'one_time')}
					class="flex-1 rounded-lg py-2 text-sm font-medium transition-colors"
					class:bg-neon={pricingModel === 'one_time'}
					class:text-white={pricingModel === 'one_time'}
					class:text-gray-400={pricingModel !== 'one_time'}
				>
					One-Time
				</button>
				<button
					onclick={() => (pricingModel = 'subscription')}
					class="flex-1 rounded-lg py-2 text-sm font-medium transition-colors"
					class:bg-neon={pricingModel === 'subscription'}
					class:text-white={pricingModel === 'subscription'}
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
	{/if}

	<!-- Features -->
	{#if isPlatformApiMode || category !== null}
		<div>
			<div class="mb-2 text-sm font-medium text-gray-300">
				Features
				<span class="ml-1 font-normal text-gray-500">(select at least 1)</span>
			</div>

			<!-- Sub-product: Powered by API banner -->
			{#if isSubProductMode && platformApiProject}
				<div class="mb-3 rounded-lg border border-gray-700 bg-gray-800/60 px-3 py-2">
					<div class="mb-1.5 text-xs font-semibold text-gray-400">
						🔌 Powered by {hostPlatform?.name} API
					</div>
					{#if activeApiFeatureNames.length > 0}
						<div class="flex flex-wrap gap-1">
							{#each activeApiFeatureNames as feat}
								<span class="rounded bg-blue-900/60 px-1.5 py-0.5 text-[10px] text-blue-300">{feat}</span>
							{/each}
						</div>
					{:else}
						<p class="text-[11px] text-gray-500">No API features built yet — only unrestricted features are available.</p>
					{/if}
				</div>
			{/if}

			{#if features.length === 0}
				<div class="rounded-xl border border-dashed border-gray-600 bg-navy-700/50 p-4 text-center text-sm text-gray-500">
					{#if isSubProductMode}
						Build more API features first to unlock options for this product.
					{:else}
						No features available for this type.
					{/if}
				</div>
			{:else if isMajorRelease && parentProject}
				{@const completedParentIds = new Set(parentProject.features.filter(f => f.status === 'complete').map(f => f.id))}
				<div class="space-y-2">
					{#each features as feat (feat.id)}
						{@const isCarriedOver = completedParentIds.has(feat.id)}
						{@const isBugFix = feat.id.startsWith('bugfix_')}
						{@const checked = selectedFeatureIds.includes(feat.id)}
						<label class="flex cursor-pointer items-start gap-3 rounded-lg border p-3 transition-all
							{checked ? 'border-neon bg-neon/5' : 'border-navy-600 bg-navy-700'}">
							<input
								type="checkbox"
								class="border-navy-500 bg-navy-600 checked:bg-neon checked:border-neon mt-0.5 shrink-0 rounded"
								checked={checked}
								onchange={() => toggleFeature(feat.id)}
							/>
							<div class="min-w-0 flex-1">
								<div class="flex flex-wrap items-center gap-2">
									<span class="text-sm font-medium text-white">{feat.name}</span>
									{#if isCarriedOver}
										<span class="rounded bg-green-900 px-1.5 py-0.5 text-xs text-green-300">✅ Carried over · ½ WU</span>
									{:else if isBugFix}
										<span class="rounded bg-red-900 px-1.5 py-0.5 text-xs text-red-300">🐛 Bug Fix</span>
									{/if}
								</div>
								<div class="mt-0.5 flex gap-3 text-xs text-gray-400">
									<span class="font-mono">{feat.wuCost} WU</span>
									{#if feat.revenueBoost > 0}
										<span class="text-green-400">+${feat.revenueBoost}/wk</span>
									{/if}
									<span class="text-blue-400">+{feat.qualityBoost} Q</span>
								</div>
								{#if feat.description}
									<div class="mt-0.5 text-xs text-gray-500">{feat.description}</div>
								{/if}
							</div>
						</label>
					{/each}
				</div>
			{:else if isSubProductMode}
				<div class="space-y-2">
					{#each features as feat (feat.id)}
						{@const isApiUnlocked = apiUnlockedFeatureIds.has(feat.id)}
						{@const checked = selectedFeatureIds.includes(feat.id)}
						<label class="flex cursor-pointer items-start gap-3 rounded-lg border p-3 transition-all
							{checked ? 'border-neon bg-neon/5' : 'border-navy-600 bg-navy-700'}">
							<input
								type="checkbox"
								class="border-navy-500 bg-navy-600 checked:bg-neon checked:border-neon mt-0.5 shrink-0 rounded"
								checked={checked}
								onchange={() => toggleFeature(feat.id)}
							/>
							<div class="min-w-0 flex-1">
								<div class="flex flex-wrap items-center gap-2">
									<span class="text-sm font-medium text-white">{feat.name}</span>
									{#if isApiUnlocked}
										<span class="rounded bg-blue-900/60 px-1.5 py-0.5 text-[10px] text-blue-300">🔌 API</span>
									{/if}
								</div>
								<div class="mt-0.5 flex gap-3 text-xs text-gray-400">
									<span class="font-mono">{feat.wuCost} WU</span>
									{#if feat.revenueBoost > 0}
										<span class="text-green-400">+${feat.revenueBoost}/wk</span>
									{/if}
									<span class="text-blue-400">+{feat.qualityBoost} Q</span>
								</div>
								{#if feat.description}
									<div class="mt-0.5 text-xs text-gray-500">{feat.description}</div>
								{/if}
							</div>
						</label>
					{/each}
				</div>
			{:else}
				<FeatureCheckList
					features={features}
					selected={selectedFeatureIds}
					{completedResearch}
					onToggle={toggleFeature}
				/>
			{/if}
		</div>
	{:else}
		<div class="rounded-xl border border-dashed border-gray-600 bg-navy-700/50 p-4 text-center text-sm text-gray-500">
			Select a category to see available features
		</div>
	{/if}

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
			{#if isPlatformApiMode}
				<div class="flex justify-between text-sm">
					<span class="text-gray-400">Revenue model</span>
					<span class="text-blue-400 font-mono text-xs">Via platform API calls</span>
				</div>
			{:else if isLandingPageMode}
				<div class="flex justify-between text-sm">
					<span class="text-gray-400">Revenue</span>
					<span class="text-purple-400 font-mono">$0 · marketing only</span>
				</div>
			{:else}
				<div class="flex justify-between text-sm">
					<span class="text-gray-400">Projected revenue</span>
					<span class="text-neon font-mono font-bold">${Math.round(projectedRevenue).toLocaleString()}/wk</span>
				</div>
			{/if}
		</div>
	</div>

	<!-- Submit -->
	<button
		onclick={startProject}
		disabled={!canStart}
		class="w-full rounded-xl py-4 font-mono font-bold transition-colors"
		class:bg-neon={canStart}
		class:text-white={canStart}
		class:hover:bg-neon-dim={canStart}
		class:bg-navy-600={!canStart}
		class:text-gray-500={!canStart}
		class:cursor-not-allowed={!canStart}
	>
		{isPlatformApiMode
			? 'Build Platform API'
			: isLandingPageMode
				? 'Add Landing Page'
				: isSubProductMode
					? 'Add Product to Platform'
					: isMajorRelease
						? `Plan Major Release v${nextMajorVersion}`
						: 'Start Project'}
	</button>

</div>
