<script lang="ts">
	import { goto } from '$app/navigation';
	import { game } from '$lib/stores/gameStore';
	import type { ApiCategory, Platform } from '$lib/types';

	const API_CATEGORIES: { id: ApiCategory; label: string; callRate: number; hint: string }[] = [
		{ id: 'social_network', label: 'Social Network', callRate: 120, hint: 'Mobile chat/entertainment, SaaS analytics, Desktop media' },
		{ id: 'developer_platform', label: 'Developer Platform', callRate: 80, hint: 'SaaS devtools, Desktop developer tools, Mobile education' },
		{ id: 'ecommerce', label: 'E-commerce', callRate: 50, hint: 'SaaS finance/CRM, Mobile entertainment, Desktop productivity' },
		{ id: 'media_streaming', label: 'Media Streaming', callRate: 200, hint: 'Mobile entertainment, Desktop media player, SaaS analytics' },
		{ id: 'productivity_suite', label: 'Productivity Suite', callRate: 40, hint: 'SaaS productivity, Desktop productivity, Mobile education' },
		{ id: 'fintech', label: 'Fintech', callRate: 60, hint: 'SaaS finance, Mobile fitness, Desktop security' }
	];

	let name = $state('');
	let description = $state('');
	let apiCategory = $state<ApiCategory>('social_network');
	let pricePerCall = $state(0.01);

	const selectedCategory = $derived(API_CATEGORIES.find((c) => c.id === apiCategory)!);

	// Demand curve hint: lower price = higher volume, higher price = lower volume
	const demandHint = $derived(() => {
		if (pricePerCall <= 0.005) return 'Very high volume — low margin per call';
		if (pricePerCall <= 0.015) return 'High volume — moderate margin';
		if (pricePerCall <= 0.025) return 'Balanced demand';
		if (pricePerCall <= 0.035) return 'Lower volume — good margin';
		return 'Low volume — high margin per call';
	});

	const weeklyEstimate = $derived(() => {
		// Assume 1000 initial users for estimate
		return Math.round(1000 * selectedCategory.callRate * pricePerCall);
	});

	function create() {
		if (!name.trim()) return;
		const platform: Platform = {
			id: crypto.randomUUID(),
			name: name.trim(),
			description: description.trim(),
			weekCreated: $game.meta.week,
			apiCategory,
			pricePerCall,
			apiProjectId: null,
			subProductIds: [],
			sharedUsers: 0,
			weeklyNewUsers: 0,
			weeklyChurnedUsers: 0,
			brandStrength: 0,
			marketingBonus: 0,
			status: 'building'
		};
		game.update((s) => ({
			...s,
			platforms: [...(s.platforms ?? []), platform],
			notifications: [
				{
					id: crypto.randomUUID(),
					week: s.meta.week,
					message: `🏗️ Platform "${platform.name}" created. Build your API to get started.`,
					type: 'info' as const
				},
				...s.notifications
			].slice(0, 50)
		}));
		goto(`/platforms/${platform.id}`);
	}
</script>

<div class="bg-navy-900 min-h-screen pb-24 pt-4">
	<div class="mx-auto max-w-xl px-4">
		<button onclick={() => goto('/platforms')} class="mb-4 text-gray-400 text-sm flex items-center gap-1">
			← Platforms
		</button>

		<h1 class="text-neon text-2xl font-bold mb-2">Create Platform</h1>
		<p class="text-gray-400 text-sm mb-6">
			A platform groups a backend API with up to 3 client products and a landing page. All products share one user base — and if your API goes down, everything goes down.
			<br /><br />
			This is a significant investment: 6 weeks of research + 50 WU to build the API. Make sure you're ready.
		</p>

		<div class="space-y-4">
			<!-- Platform name -->
			<div>
				<label class="text-gray-300 text-sm font-medium block mb-1" for="plat-name">Platform Name</label>
				<input
					id="plat-name"
					class="w-full rounded-lg border border-gray-600 bg-gray-800 px-3 py-2 text-white placeholder-gray-500 focus:border-neon focus:outline-none"
					placeholder="e.g. SocialSphere"
					bind:value={name}
				/>
			</div>

			<!-- Tagline -->
			<div>
				<label class="text-gray-300 text-sm font-medium block mb-1" for="plat-desc">Tagline / Description</label>
				<input
					id="plat-desc"
					class="w-full rounded-lg border border-gray-600 bg-gray-800 px-3 py-2 text-white placeholder-gray-500 focus:border-neon focus:outline-none"
					placeholder="Short description of what this platform does"
					bind:value={description}
				/>
			</div>

			<!-- API Category -->
			<div>
				<div class="text-gray-300 text-sm font-medium block mb-1">API Category</div>
				<div class="grid grid-cols-2 gap-2">
					{#each API_CATEGORIES as cat}
						<button
							class="rounded-lg border p-3 text-left text-sm transition {apiCategory === cat.id ? 'border-neon bg-neon/10 text-white' : 'border-gray-600 bg-gray-800 text-gray-400'}"
							onclick={() => (apiCategory = cat.id)}
						>
							<p class="font-medium">{cat.label}</p>
							<p class="text-[10px] text-gray-500 mt-0.5">{cat.callRate} calls/user/wk</p>
						</button>
					{/each}
				</div>
				{#if selectedCategory}
					<p class="text-gray-500 text-xs mt-1">Suggested products: {selectedCategory.hint}</p>
				{/if}
			</div>

			<!-- Price per API call -->
			<div>
				<label class="text-gray-300 text-sm font-medium block mb-1" for="plat-price">
					Price per API Call: <span class="text-neon">${pricePerCall.toFixed(4)}</span>
				</label>
				<input
					id="plat-price"
					type="range"
					min="0.001"
					max="0.05"
					step="0.001"
					bind:value={pricePerCall}
					class="w-full accent-neon"
				/>
				<div class="flex justify-between text-xs text-gray-500 mt-1">
					<span>$0.001</span>
					<span class="text-yellow-400">{demandHint()}</span>
					<span>$0.050</span>
				</div>
				<p class="text-gray-500 text-xs mt-1">
					Estimated at 1,000 users: <span class="text-green-400">${weeklyEstimate()}/wk</span>
				</p>
			</div>

			<button
				class="w-full rounded-xl bg-neon text-navy-900 font-bold py-3 text-sm disabled:opacity-40"
				disabled={!name.trim()}
				onclick={create}
			>
				Create Platform
			</button>
		</div>
	</div>
</div>
