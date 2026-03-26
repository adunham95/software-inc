<script lang="ts">
	import { page } from '$app/state';
</script>

<nav
	class="bg-navy-800 border-navy-600 fixed bottom-0 left-0 right-0 z-50 flex border-t"
	style="padding-bottom: env(safe-area-inset-bottom);"
>
	<a
		href="/"
		class="flex flex-1 flex-col items-center gap-1 py-3 text-xs transition-colors"
		class:text-neon={page.url.pathname === '/'}
		class:text-gray-500={page.url.pathname !== '/'}
	>
		<svg
			xmlns="http://www.w3.org/2000/svg"
			class="h-5 w-5"
			viewBox="0 0 24 24"
			fill="currentColor"
		>
			<path
				d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z"
			/>
		</svg>
		Dashboard
	</a>

	<a
		href="/projects/new"
		class="flex flex-1 flex-col items-center gap-1 py-3 text-xs transition-colors"
		class:text-neon={page.url.pathname.startsWith('/projects')}
		class:text-gray-500={!page.url.pathname.startsWith('/projects')}
	>
		<svg
			xmlns="http://www.w3.org/2000/svg"
			class="h-5 w-5"
			viewBox="0 0 24 24"
			fill="currentColor"
		>
			<path
				d="M20 6h-2.18c.07-.44.18-.88.18-1.36C18 2.53 15.47 0 12.36 0c-1.73 0-3.27.93-4.36 2.33C6.91.93 5.37 0 3.64 0 .53 0-2 2.53-2 5.64c0 .48.11.92.18 1.36H-2v14h24V6zm-8.36-4c1.12 0 2 .88 2 2 0 .48-.24.96-.63 1.37l-1.37 1.63-1.37-1.63C9.88 4.96 9.64 4.48 9.64 4c0-1.12.88-2 2-2z"
			/>
		</svg>
		Projects
	</a>

	<a
		href="/research"
		class="flex flex-1 flex-col items-center gap-1 py-3 text-xs transition-colors"
		class:text-neon={page.url.pathname.startsWith('/research')}
		class:text-gray-500={!page.url.pathname.startsWith('/research')}
	>
		<svg
			xmlns="http://www.w3.org/2000/svg"
			class="h-5 w-5"
			viewBox="0 0 24 24"
			fill="currentColor"
		>
			<path
				d="M9.5 3A6.5 6.5 0 0 1 16 9.5c0 1.61-.59 3.09-1.56 4.23l.27.27h.79l5 5-1.5 1.5-5-5v-.79l-.27-.27A6.516 6.516 0 0 1 9.5 16 6.5 6.5 0 0 1 3 9.5 6.5 6.5 0 0 1 9.5 3m0 2C7 5 5 7 5 9.5S7 14 9.5 14 14 12 14 9.5 12 5 9.5 5z"
			/>
		</svg>
		Research
	</a>
</nav>
