<script lang="ts">
	import { page } from '$app/state';
	import { goto } from '$app/navigation';
	import { game } from '$lib/stores/gameStore';
	import { availableWu } from '$lib/stores/derived';
	import { PROJECT_TYPES, HOSTING_EXTERNAL_COST, HOSTING_WU_DRAIN } from '$lib/engine/projects';
	import FeatureProgress from '$lib/components/FeatureProgress.svelte';
	import RevenueChart from '$lib/components/RevenueChart.svelte';
	import type { Notification } from '$lib/types';

	const id = $derived(page.params.id);
	const project = $derived($game.projects.find((p) => p.id === id));
	const typeLabel = $derived(project ? (PROJECT_TYPES[project.type]?.label ?? project.type) : '');

	let showCancelConfirm = $state(false);
	let showHostingSwitch = $state(false);

	const currentFeature = $derived(
		project?.features.find((f) => f.status === 'in_progress') ?? null
	);

	const weeksRemaining = $derived(
		project && project.status === 'in_development'
			? Math.ceil(
					(project.features.reduce((s, f) => s + (f.wuCost - f.progressWu), 0)) /
						$availableWu
				)
			: 0
	);

	const externalCost = $derived(
		project ? (HOSTING_EXTERNAL_COST[project.type] ?? 0) : 0
	);
	const selfWuDrain = $derived(
		project ? (HOSTING_WU_DRAIN[project.type] ?? 0) : 0
	);
	const wuAfterSwitch = $derived($availableWu - selfWuDrain);

	function cancelProject() {
		if (!project) return;
		game.update((s) => ({
			...s,
			projects: s.projects.map((p) =>
				p.id === id ? { ...p, status: 'cancelled' } : p
			),
			notifications: ([
				{
					id: crypto.randomUUID(),
					week: s.meta.week,
					message: `❌ "${project.name}" cancelled.`,
					type: 'warning'
				} satisfies Notification,
				...s.notifications
			] as Notification[]).slice(0, 50)
		}));
		goto('/');
	}

	function switchHosting(newType: 'external' | 'self') {
		if (!project) return;
		const newCost = newType === 'external' ? externalCost : 0;
		const newDrain = newType === 'self' ? selfWuDrain : 0;
		game.update((s) => ({
			...s,
			projects: s.projects.map((p) =>
				p.id === id
					? { ...p, hostingType: newType, hostingCostPerWeek: newCost, hostingWuDrainPerWeek: newDrain }
					: p
			),
			notifications: ([
				{
					id: crypto.randomUUID(),
					week: s.meta.week,
					message: newType === 'external'
						? `☁️ "${project.name}" switched to external hosting — $${newCost}/wk.`
						: `🖥️ "${project.name}" switched to self-hosting — ${newDrain} WU/wk drain.`,
					type: 'info'
				} satisfies Notification,
				...s.notifications
			] as Notification[]).slice(0, 50)
		}));
		showHostingSwitch = false;
	}
</script>

<header class="bg-navy/95 border-navy-600 sticky top-0 z-30 border-b px-4 py-3 backdrop-blur">
	<div class="flex items-center gap-3">
		<a href="/" class="text-gray-400 hover:text-white">←</a>
		<div class="flex-1">
			{#if project}
				<div class="flex items-center gap-2">
					<span class="font-semibold text-white">{project.name}</span>
					<span class="bg-navy-600 rounded px-2 py-0.5 text-xs text-gray-400">{typeLabel}</span>
				</div>
			{:else}
				<span class="text-gray-400">Project not found</span>
			{/if}
		</div>
	</div>
</header>

<div class="mx-auto max-w-lg space-y-6 px-4 py-6">

	{#if !project}
		<div class="rounded-xl border border-red-700 bg-red-950 p-6 text-center text-red-300">
			Project not found.
			<a href="/" class="mt-2 block text-sm underline">← Back to Dashboard</a>
		</div>

	{:else if project.status === 'in_development'}
		<!-- Status Badge -->
		<div class="flex items-center gap-2">
			<span class="rounded-full bg-blue-900 px-3 py-1 text-xs font-semibold text-blue-300">
				IN DEVELOPMENT
			</span>
		</div>

		<!-- Progress -->
		<div class="bg-navy-700 rounded-xl p-4">
			<div class="mb-1 flex items-center justify-between text-sm">
				<span class="text-gray-400">Overall Progress</span>
				<span class="font-mono text-white">{Math.round(project.progress)}%</span>
			</div>
			<div class="bg-navy-600 mb-3 h-3 w-full overflow-hidden rounded-full">
				<div
					class="bg-neon h-full rounded-full transition-all"
					style="width: {project.progress}%"
				></div>
			</div>
			<div class="flex justify-between text-xs text-gray-500">
				<span>{project.features.reduce((s, f) => s + f.progressWu, 0)} / {project.totalWuRequired} WU</span>
				<span>~{weeksRemaining} weeks remaining</span>
			</div>
		</div>

		<!-- Current Feature -->
		{#if currentFeature}
			<div class="bg-navy-700 rounded-xl p-4">
				<div class="mb-2 text-xs font-semibold uppercase tracking-widest text-gray-500">
					Current Feature
				</div>
				<div class="mb-1 flex items-center justify-between text-sm">
					<span class="text-white">{currentFeature.name}</span>
					<span class="font-mono text-xs text-gray-400">
						{currentFeature.progressWu}/{currentFeature.wuCost} WU
					</span>
				</div>
				<div class="bg-navy-600 h-2 w-full overflow-hidden rounded-full">
					<div
						class="bg-neon h-full rounded-full transition-all"
						style="width: {(currentFeature.progressWu / currentFeature.wuCost) * 100}%"
					></div>
				</div>
			</div>
		{/if}

		<!-- Feature List -->
		<div class="bg-navy-700 rounded-xl p-4">
			<div class="mb-3 text-xs font-semibold uppercase tracking-widest text-gray-500">Features</div>
			<FeatureProgress features={project.features} />
		</div>

		<!-- Info -->
		<div class="bg-navy-700 rounded-xl p-4">
			<div class="mb-3 text-xs font-semibold uppercase tracking-widest text-gray-500">Info</div>
			<div class="space-y-2 text-sm">
				<div class="flex justify-between">
					<span class="text-gray-400">Quality Score</span>
					<span class="font-mono text-white">{project.quality} / 100</span>
				</div>
				<div class="flex justify-between">
					<span class="text-gray-400">Pricing</span>
					<span class="font-mono text-white">
						${project.price}
						{project.pricingModel === 'subscription' ? '/mo' : ' one-time'}
					</span>
				</div>
			</div>
		</div>

		<!-- Cancel -->
		<div class="pt-2">
			{#if showCancelConfirm}
				<div class="rounded-xl border border-red-700 bg-red-950 p-4 text-center">
					<p class="mb-3 text-sm text-red-300">Are you sure? This cannot be undone.</p>
					<div class="flex gap-3">
						<button
							onclick={() => (showCancelConfirm = false)}
							class="flex-1 rounded-lg border border-gray-600 py-2 text-sm text-gray-300"
						>
							Keep Working
						</button>
						<button
							onclick={cancelProject}
							class="flex-1 rounded-lg bg-red-700 py-2 text-sm font-semibold text-white"
						>
							Cancel Project
						</button>
					</div>
				</div>
			{:else}
				<button
					onclick={() => (showCancelConfirm = true)}
					class="w-full rounded-xl border border-red-900 py-3 text-sm text-red-400 transition-colors hover:bg-red-950"
				>
					Cancel Project
				</button>
			{/if}
		</div>

	{:else if project.status === 'shipped'}
		<!-- Status Badge -->
		<div class="flex items-center gap-2">
			<span class="rounded-full bg-green-900 px-3 py-1 text-xs font-semibold text-green-300">
				LIVE 🟢
			</span>
			<span class="text-xs text-gray-500">{project.weeksOnMarket} weeks on market</span>
		</div>

		<!-- Revenue -->
		<div class="bg-navy-700 rounded-xl p-4">
			<div class="mb-3 text-xs font-semibold uppercase tracking-widest text-gray-500">Revenue</div>
			<div class="mb-1 flex items-baseline gap-1">
				<span class="text-neon font-mono text-3xl font-bold">
					${Math.round(project.weeklyRevenue).toLocaleString()}
				</span>
				<span class="text-gray-400">/wk</span>
			</div>
			<div class="space-y-2 text-sm">
				<div class="flex justify-between">
					<span class="text-gray-400">Lifetime Revenue</span>
					<span class="font-mono text-white">${Math.round(project.totalRevenue).toLocaleString()}</span>
				</div>
				<div class="flex justify-between">
					<span class="text-gray-400">Pricing</span>
					<div class="flex items-center gap-1">
						<span
							class="rounded px-1.5 py-0.5 text-xs font-semibold"
							class:bg-blue-900={project.pricingModel === 'subscription'}
							class:text-blue-300={project.pricingModel === 'subscription'}
							class:bg-purple-900={project.pricingModel === 'one_time'}
							class:text-purple-300={project.pricingModel === 'one_time'}
						>
							{project.pricingModel === 'subscription' ? 'SUB' : 'ONE-TIME'}
						</span>
						<span class="font-mono text-white">${project.price}</span>
					</div>
				</div>
				<div class="flex justify-between">
					<span class="text-gray-400">Revenue Decay</span>
					<span class="font-mono text-amber-400">↘ -{project.revenueDecayRate}%/wk</span>
				</div>
				{#if project.pricingModel === 'subscription'}
					<div class="flex justify-between">
						<span class="text-gray-400">Active Subscribers</span>
						<span class="font-mono text-white">{project.activeSubscribers.toLocaleString()}</span>
					</div>
				{/if}
			</div>
		</div>

		<!-- Hosting (only for products that need hosting) -->
		{#if project.hostingType !== 'none'}
			<div class="bg-navy-700 rounded-xl p-4">
				<div class="mb-3 flex items-center justify-between">
					<div class="text-xs font-semibold uppercase tracking-widest text-gray-500">Hosting</div>
					<button
						onclick={() => (showHostingSwitch = !showHostingSwitch)}
						class="text-xs text-gray-400 hover:text-white transition-colors"
					>
						Switch →
					</button>
				</div>

				{#if project.hostingType === 'external'}
					<div class="flex items-center justify-between text-sm">
						<span class="text-white">☁️ External Hosting</span>
						<span class="font-mono text-amber-400">-${project.hostingCostPerWeek}/wk</span>
					</div>
					<p class="mt-1 text-xs text-gray-500">No maintenance, no outage risk.</p>
				{:else}
					<div class="flex items-center justify-between text-sm">
						<span class="text-white">🖥️ Self-Hosted</span>
						<span class="font-mono text-orange-400">-{project.hostingWuDrainPerWeek} WU/wk</span>
					</div>
					<p class="mt-1 text-xs text-gray-500">5% outage risk per week (2% with DevOps).</p>
				{/if}

				{#if showHostingSwitch}
					<div class="mt-4 space-y-2 border-t border-gray-700 pt-4">
						<p class="mb-2 text-xs text-gray-400">Switch hosting (takes effect immediately):</p>
						<button
							onclick={() => switchHosting('external')}
							disabled={project.hostingType === 'external'}
							class="w-full rounded-xl border px-4 py-3 text-left text-sm transition-all"
							class:border-neon={project.hostingType === 'external'}
							class:border-gray-600={project.hostingType !== 'external'}
							class:opacity-50={project.hostingType === 'external'}
						>
							<div class="font-medium text-white">☁️ External Hosting</div>
							<div class="text-xs text-amber-400">${externalCost}/wk cash cost</div>
						</button>
						<button
							onclick={() => switchHosting('self')}
							disabled={project.hostingType === 'self'}
							class="w-full rounded-xl border px-4 py-3 text-left text-sm transition-all"
							class:border-neon={project.hostingType === 'self'}
							class:border-gray-600={project.hostingType !== 'self'}
							class:opacity-50={project.hostingType === 'self'}
						>
							<div class="font-medium text-white">🖥️ Self-Hosted</div>
							<div class="text-xs text-orange-400">{selfWuDrain} WU/wk drain · leaves you {wuAfterSwitch} WU for dev</div>
						</button>
					</div>
				{/if}
			</div>
		{/if}

		<!-- Revenue Chart -->
		{#if project.revenueHistory.length > 0}
			<div class="bg-navy-700 rounded-xl p-4">
				<div class="mb-3 text-xs font-semibold uppercase tracking-widest text-gray-500">
					Revenue History (last 8 weeks)
				</div>
				<RevenueChart history={project.revenueHistory} />
			</div>
		{/if}

		<!-- Features -->
		<div class="bg-navy-700 rounded-xl p-4">
			<div class="mb-2 flex items-center justify-between">
				<div class="text-xs font-semibold uppercase tracking-widest text-gray-500">Features</div>
				<span class="font-mono text-sm text-white">Quality: {project.quality}/100</span>
			</div>
			<div class="space-y-1">
				{#each project.features as feat (feat.id)}
					<div class="flex items-center gap-2 text-sm text-gray-300">
						<span>✅</span>
						<span>{feat.name}</span>
						<span class="ml-auto text-xs text-green-400">+${feat.revenueBoost}/wk</span>
					</div>
				{/each}
			</div>
		</div>

	{:else}
		<div class="rounded-xl border border-gray-700 bg-gray-950 p-6 text-center text-gray-500">
			This project was cancelled.
		</div>
	{/if}

</div>
