<script lang="ts">
	import './layout.css';
	import BottomNav from '$lib/components/BottomNav.svelte';
	import favicon from '$lib/assets/favicon.svg';

	let { children } = $props();
</script>

<svelte:head>
	<link rel="icon" href={favicon} />
	<link rel="preconnect" href="https://fonts.googleapis.com" />
	<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin="anonymous" />
	<link
		href="https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;600;700&family=Inter:wght@400;500;600&display=swap"
		rel="stylesheet"
	/>
</svelte:head>

<div class="bg-navy min-h-screen pb-32 text-gray-100">
	{@render children()}
	<BottomNav />
</div>
