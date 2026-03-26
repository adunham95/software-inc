<script lang="ts">
	import { page } from '$app/state';
	import { goto } from '$app/navigation';
	import { game } from '$lib/stores/gameStore';
	import type { Project } from '$lib/types';

	const platformId = $derived(page.params.id);
	const platform = $derived(($game.platforms ?? []).find((p) => p.id === platformId));

	const apiProject = $derived(
		platform?.apiProjectId
			? $game.projects.find((p) => p.id === platform.apiProjectId) ?? null
			: null
	);

	const subProducts = $derived(
		platform
			? $game.projects.filter(
					(p) => platform.subProductIds.includes(p.id) && !p.isLandingPage
				)
			: []
	);

	const landingPage = $derived(
		platform
			? $game.projects.find((p) => p.platformId === platform.id && p.isLandingPage) ?? null
			: null
	);

	const totalRevenue = $derived(
		[...(apiProject ? [apiProject] : []), ...subProducts]
			.filter((p) => p.status === 'shipped')
			.reduce((sum, p) => sum + p.weeklyRevenue, 0)
	);

	const STATUS_CHIP: Record<string, { label: string; cls: string }> = {
		building: { label: 'BUILDING', cls: 'bg-gray-700 text-gray-300' },
		live: { label: 'LIVE 🟢', cls: 'bg-green-900 text-green-300' },
		degraded: { label: 'DEGRADED ⚠️', cls: 'bg-yellow-900 text-yellow-300' },
		offline: { label: 'OFFLINE 🔴', cls: 'bg-red-900 text-red-400' }
	};

	const API_CATEGORY_LABELS: Record<string, string> = {
		social_network: 'Social Network',
		developer_platform: 'Developer Platform',
		ecommerce: 'E-commerce',
		media_streaming: 'Media Streaming',
		productivity_suite: 'Productivity Suite',
		fintech: 'Fintech'
	};

	const canAddProduct = $derived(
		platform &&
			apiProject?.status === 'shipped' &&
			subProducts.filter((p) => !p.isLandingPage).length < 3 &&
			!$game.projects.some((p) => p.status === 'in_development')
	);

	const canAddLandingPage = $derived(
		platform &&
			apiProject?.status === 'shipped' &&
			!landingPage &&
			!$game.projects.some((p) => p.status === 'in_development')
	);

	// Bug spread risk indicator
	const spreadRisk = $derived(() => {
		if (!platform) return 0;
		const allBugs = subProducts
			.flatMap((p) => p.bugs)
			.filter((b) => !b.fixed && (b.severity === 'major' || b.severity === 'critical'));
		return allBugs.length;
	});

	// Churn contagion warning
	const escalatedProducts = $derived(
		subProducts.filter((p) => p.bugs.filter((b) => !b.fixed).length >= 6)
	);

	function bugCount(p: Project): number {
		return p.bugs.filter((b) => !b.fixed).length;
	}

	function buildApi() {
		if (!platform) return;
		goto(`/projects/new?platformId=${platform.id}&platformApi=true`);
	}

	function addProduct() {
		if (!platform) return;
		goto(`/projects/new?platformId=${platform.id}`);
	}

	function addLandingPage() {
		if (!platform) return;
		goto(`/projects/new?platformId=${platform.id}&landingPage=true`);
	}

	const apiCallsEstimate = $derived(
		platform && apiProject?.status === 'shipped'
			? `~${Math.round(platform.sharedUsers * (platform.pricePerCall ?? 0)).toLocaleString()}/wk`
			: '—'
	);
</script>

{#if !platform}
	<div class="bg-navy-900 min-h-screen pb-24 pt-4 px-4 text-center text-gray-400">
		Platform not found.
	</div>
{:else}
	<div class="bg-navy-900 min-h-screen pb-24 pt-4">
		<div class="mx-auto max-w-xl px-4 space-y-4">
			<!-- Header -->
			<button onclick={() => goto('/platforms')} class="text-gray-400 text-sm flex items-center gap-1">
				← Platforms
			</button>
			<div class="flex items-start justify-between">
				<div>
					<h1 class="text-white text-2xl font-bold">{platform.name}</h1>
					<p class="text-gray-400 text-sm mt-0.5">{platform.description}</p>
					<span class="text-xs text-gray-500">{API_CATEGORY_LABELS[platform.apiCategory] ?? platform.apiCategory}</span>
				</div>
				{#if STATUS_CHIP[platform.status]}
					<span class="text-[10px] font-bold px-2 py-1 rounded-full {STATUS_CHIP[platform.status].cls}">
						{STATUS_CHIP[platform.status].label}
					</span>
				{/if}
			</div>

			<!-- Shared Stats Row -->
			<div class="grid grid-cols-4 gap-2">
				<div class="rounded-lg bg-gray-800 p-2 text-center">
					<p class="text-[10px] text-gray-500">Users</p>
					<p class="text-white text-sm font-bold">{platform.sharedUsers.toLocaleString()}</p>
				</div>
				<div class="rounded-lg bg-gray-800 p-2 text-center">
					<p class="text-[10px] text-gray-500">Brand</p>
					<p class="text-purple-400 text-sm font-bold">{Math.round(platform.brandStrength)}</p>
				</div>
				<div class="rounded-lg bg-gray-800 p-2 text-center">
					<p class="text-[10px] text-gray-500">Mkt Bonus</p>
					<p class="text-yellow-400 text-sm font-bold">+{Math.round(platform.marketingBonus * 100)}%</p>
				</div>
				<div class="rounded-lg bg-gray-800 p-2 text-center">
					<p class="text-[10px] text-gray-500">Rev/wk</p>
					<p class="text-green-400 text-sm font-bold">${totalRevenue.toLocaleString()}</p>
				</div>
			</div>

			<!-- API Card -->
			<div>
				<h2 class="text-gray-400 text-xs font-semibold uppercase tracking-wider mb-2">Platform API</h2>
				{#if !apiProject}
					<div class="rounded-xl border border-dashed border-gray-600 bg-gray-800/40 p-4 text-center">
						<p class="text-gray-400 text-sm mb-3">No API built yet. The API is the backbone of your platform.</p>
						{#if !$game.projects.some((p) => p.status === 'in_development')}
							<button
								onclick={buildApi}
								class="bg-neon text-navy-900 rounded-lg px-4 py-2 text-sm font-bold"
							>
								Build API (50 WU)
							</button>
						{:else}
							<p class="text-yellow-400 text-xs">Another project is in development. Finish it first.</p>
						{/if}
					</div>
				{:else}
					<button
						onclick={() => goto(`/projects/${apiProject.id}`)}
						class="w-full text-left rounded-xl border border-gray-700 bg-gray-800/60 p-4 transition hover:border-gray-500"
					>
						<div class="flex items-center justify-between mb-1">
							<p class="text-white font-semibold">{apiProject.name}</p>
							<span class="text-xs px-2 py-0.5 rounded-full {apiProject.status === 'shipped' ? 'bg-green-900 text-green-300' : 'bg-blue-900 text-blue-300'}">
								{apiProject.status === 'shipped' ? 'LIVE' : 'BUILDING'}
							</span>
						</div>
						<div class="flex gap-4 text-xs text-gray-400 mt-1">
							<span>Rev: <span class="text-green-400">${apiProject.weeklyRevenue.toLocaleString()}/wk</span></span>
							<span>Bugs: <span class="{bugCount(apiProject) > 0 ? 'text-red-400' : 'text-gray-400'}">{bugCount(apiProject)}</span></span>
							<span>v{apiProject.version}</span>
						</div>
						{#if apiProject.status === 'in_development'}
							<div class="mt-2 h-1.5 w-full rounded-full bg-gray-700">
								<div class="h-1.5 rounded-full bg-neon" style="width:{apiProject.progress}%"></div>
							</div>
						{/if}
					</button>
				{/if}
			</div>

			<!-- Sub-Products -->
			{#if apiProject?.status === 'shipped'}
				<div>
					<h2 class="text-gray-400 text-xs font-semibold uppercase tracking-wider mb-2">
						Products ({subProducts.length}/3)
					</h2>
					<div class="space-y-2">
						{#each subProducts as p (p.id)}
							<button
								onclick={() => goto(`/projects/${p.id}`)}
								class="w-full text-left rounded-xl border border-gray-700 bg-gray-800/60 p-4 transition hover:border-gray-500"
							>
								<div class="flex items-center justify-between mb-1">
									<p class="text-white font-medium">{p.name}</p>
									<span class="text-xs text-gray-500 capitalize">{p.type.replace('_', ' ')}</span>
								</div>
								<div class="flex gap-4 text-xs text-gray-400">
									<span>Rev: <span class="text-green-400">${p.weeklyRevenue.toLocaleString()}/wk</span></span>
									{#if p.platformBonus > 0}
										<span>Bonus: <span class="text-yellow-400">+${p.platformBonus.toLocaleString()}</span></span>
									{/if}
									<span>Bugs: <span class="{bugCount(p) > 0 ? 'text-red-400' : 'text-gray-400'}">{bugCount(p)}</span></span>
								</div>
							</button>
						{/each}

						{#if canAddProduct}
							<button
								onclick={addProduct}
								class="w-full rounded-xl border border-dashed border-gray-600 bg-gray-800/30 p-3 text-sm text-gray-400 transition hover:border-neon hover:text-neon"
							>
								+ Add Product
							</button>
						{:else if subProducts.length >= 3}
							<p class="text-gray-600 text-xs text-center py-2">Max 3 products reached</p>
						{/if}
					</div>
				</div>

				<!-- Landing Page -->
				<div>
					<h2 class="text-gray-400 text-xs font-semibold uppercase tracking-wider mb-2">Landing Page</h2>
					{#if landingPage}
						<button
							onclick={() => goto(`/projects/${landingPage.id}`)}
							class="w-full text-left rounded-xl border border-gray-700 bg-gray-800/60 p-4 transition hover:border-gray-500"
						>
							<div class="flex items-center justify-between mb-1">
								<p class="text-white font-medium">{landingPage.name}</p>
								<span class="text-xs text-green-400">$0 · Marketing only</span>
							</div>
							<div class="flex gap-4 text-xs text-gray-400">
								<span>Quality: <span class="text-white">{landingPage.quality}</span></span>
								<span>Brand Boost: <span class="text-purple-400">+{Math.round((landingPage.quality / 100) * 20)}</span></span>
								<span>Mkt Bonus: <span class="text-yellow-400">+{Math.round((landingPage.quality / 100) * 25)}%</span></span>
							</div>
						</button>
					{:else if canAddLandingPage}
						<button
							onclick={addLandingPage}
							class="w-full rounded-xl border border-dashed border-gray-600 bg-gray-800/30 p-3 text-sm text-gray-400 transition hover:border-neon hover:text-neon"
						>
							+ Add Landing Page
						</button>
					{:else if $game.projects.some((p) => p.status === 'in_development')}
						<p class="text-gray-600 text-xs">Another project is in development.</p>
					{/if}
				</div>

				<!-- Platform Health -->
				<div>
					<h2 class="text-gray-400 text-xs font-semibold uppercase tracking-wider mb-2">Platform Health</h2>
					<div class="rounded-xl border border-gray-700 bg-gray-800/50 p-4 space-y-2 text-sm">
						<div class="flex items-center justify-between">
							<span class="text-gray-400">Bug Spread Risk</span>
							<span class="{spreadRisk() > 0 ? 'text-orange-400' : 'text-green-400'}">
								{spreadRisk() > 0 ? `${spreadRisk()} active spreaders` : 'None'}
							</span>
						</div>
						<div class="flex items-center justify-between">
							<span class="text-gray-400">Churn Contagion</span>
							<span class="{escalatedProducts.length > 0 ? 'text-red-400' : 'text-green-400'}">
								{escalatedProducts.length > 0
									? `${escalatedProducts.length} escalated product${escalatedProducts.length > 1 ? 's' : ''}`
									: 'None'}
							</span>
						</div>
						<div class="flex items-center justify-between">
							<span class="text-gray-400">API Health</span>
							<span class="{platform.status === 'offline' ? 'text-red-400' : platform.status === 'degraded' ? 'text-yellow-400' : 'text-green-400'}">
								{platform.status === 'offline' ? 'Offline' : platform.status === 'degraded' ? 'Degraded' : 'Healthy'}
							</span>
						</div>
					</div>
				</div>
			{/if}
		</div>
	</div>
{/if}
