<script lang="ts">
	import { goto } from '$app/navigation';
	import { game } from '$lib/stores/gameStore';

	const hasPlatformArch = $derived($game.research.completed.includes('platform_architecture'));
	const platforms = $derived($game.platforms ?? []);

	const STATUS_LABEL: Record<string, string> = {
		building: 'BUILDING',
		live: 'LIVE',
		degraded: 'DEGRADED',
		offline: 'OFFLINE'
	};

	const STATUS_CLASS: Record<string, string> = {
		building: 'bg-gray-700 text-gray-300',
		live: 'bg-green-900 text-green-300',
		degraded: 'bg-yellow-900 text-yellow-300',
		offline: 'bg-red-900 text-red-400'
	};

	function totalRevenue(platformId: string): number {
		return $game.projects
			.filter((p) => p.platformId === platformId && p.status === 'shipped')
			.reduce((sum, p) => sum + p.weeklyRevenue, 0);
	}
</script>

<div class="bg-navy-900 min-h-screen pb-24 pt-4">
	<div class="mx-auto max-w-xl px-4">
		<div class="mb-6 flex items-center justify-between">
			<h1 class="text-neon text-2xl font-bold">Platforms</h1>
			{#if hasPlatformArch}
				<button
					onclick={() => goto('/platforms/new')}
					class="bg-neon text-navy-900 rounded-lg px-4 py-2 text-sm font-bold"
				>
					+ New Platform
				</button>
			{/if}
		</div>

		{#if !hasPlatformArch}
			<div class="rounded-xl border border-yellow-700 bg-yellow-900/20 p-4 text-center">
				<p class="text-yellow-300 font-semibold mb-1">Locked</p>
				<p class="text-gray-400 text-sm">
					Complete <span class="text-white font-medium">Platform Architecture</span> research to unlock
					platform creation. Requires Cloud Hosting + Security Hardening.
				</p>
			</div>
		{:else if platforms.length === 0}
			<div class="rounded-xl border border-gray-700 bg-gray-800/50 p-6 text-center">
				<p class="text-gray-400 mb-3">No platforms yet.</p>
				<button
					onclick={() => goto('/platforms/new')}
					class="bg-neon text-navy-900 rounded-lg px-4 py-2 text-sm font-bold"
				>
					Create your first platform
				</button>
			</div>
		{:else}
			<div class="space-y-3">
				{#each platforms as platform (platform.id)}
					<button
						class="w-full text-left rounded-xl border border-gray-700 bg-gray-800/60 p-4 transition hover:border-gray-500"
						onclick={() => goto(`/platforms/${platform.id}`)}
					>
						<div class="flex items-start justify-between mb-2">
							<div>
								<p class="text-white font-semibold">{platform.name}</p>
								<p class="text-gray-400 text-xs mt-0.5">{platform.description}</p>
							</div>
							<span class="text-[10px] font-bold px-2 py-0.5 rounded-full {STATUS_CLASS[platform.status]}">
								{STATUS_LABEL[platform.status]}
							</span>
						</div>
						<div class="flex gap-4 text-sm">
							<div>
								<span class="text-gray-500 text-xs">Revenue/wk</span>
								<p class="text-green-400 font-medium">${totalRevenue(platform.id).toLocaleString()}</p>
							</div>
							<div>
								<span class="text-gray-500 text-xs">Users</span>
								<p class="text-white font-medium">{platform.sharedUsers.toLocaleString()}</p>
							</div>
							<div>
								<span class="text-gray-500 text-xs">Brand</span>
								<p class="text-purple-400 font-medium">{Math.round(platform.brandStrength)}</p>
							</div>
						</div>
					</button>
				{/each}
			</div>
		{/if}
	</div>
</div>
