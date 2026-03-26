<script lang="ts">
	import { page } from '$app/state';
</script>

<nav
	class="bg-navy-800 border-navy-600 fixed bottom-0 left-0 right-0 z-50 flex border-t"
	style="padding-bottom: env(safe-area-inset-bottom);"
>
	<a
		href="/"
		class="flex flex-1 flex-col items-center gap-0.5 py-2 text-[10px] transition-colors"
		class:text-neon={page.url.pathname === '/'}
		class:text-gray-500={page.url.pathname !== '/'}
	>
		<svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
			<path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z" />
		</svg>
		Dash
	</a>

	<a
		href="/projects/new"
		class="flex flex-1 flex-col items-center gap-0.5 py-2 text-[10px] transition-colors"
		class:text-neon={page.url.pathname.startsWith('/projects')}
		class:text-gray-500={!page.url.pathname.startsWith('/projects')}
	>
		<svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
			<path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-7 14H7v-2h5v2zm5-4H7v-2h10v2zm0-4H7V7h10v2z" />
		</svg>
		Projects
	</a>

	<a
		href="/platforms"
		class="flex flex-1 flex-col items-center gap-0.5 py-2 text-[10px] transition-colors"
		class:text-neon={page.url.pathname.startsWith('/platforms')}
		class:text-gray-500={!page.url.pathname.startsWith('/platforms')}
	>
		<svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
			<path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.95-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z" />
		</svg>
		Platforms
	</a>

	<a
		href="/research"
		class="flex flex-1 flex-col items-center gap-0.5 py-2 text-[10px] transition-colors"
		class:text-neon={page.url.pathname.startsWith('/research')}
		class:text-gray-500={!page.url.pathname.startsWith('/research')}
	>
		<svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
			<path d="M9.5 3A6.5 6.5 0 0 1 16 9.5c0 1.61-.59 3.09-1.56 4.23l.27.27h.79l5 5-1.5 1.5-5-5v-.79l-.27-.27A6.516 6.516 0 0 1 9.5 16 6.5 6.5 0 0 1 3 9.5 6.5 6.5 0 0 1 9.5 3m0 2C7 5 5 7 5 9.5S7 14 9.5 14 14 12 14 9.5 12 5 9.5 5z" />
		</svg>
		Research
	</a>

	<a
		href="/setup"
		class="flex flex-1 flex-col items-center gap-0.5 py-2 text-[10px] transition-colors"
		class:text-neon={page.url.pathname.startsWith('/setup')}
		class:text-gray-500={!page.url.pathname.startsWith('/setup')}
	>
		<svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
			<path d="M21 14H3a1 1 0 0 1-1-1V5a1 1 0 0 1 1-1h18a1 1 0 0 1 1 1v8a1 1 0 0 1-1 1zm-1-8H4v6h16V6zM14 19H4v-2h10v2zm6-2h-4v2h4v-2zM2 17h20v2H2v-2z" />
		</svg>
		Setup
	</a>
</nav>
