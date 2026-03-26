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

	<a
		href="/settings"
		class="flex flex-1 flex-col items-center gap-1 py-3 text-xs transition-colors"
		class:text-neon={page.url.pathname.startsWith('/settings')}
		class:text-gray-500={!page.url.pathname.startsWith('/settings')}
	>
		<svg
			xmlns="http://www.w3.org/2000/svg"
			class="h-5 w-5"
			viewBox="0 0 24 24"
			fill="currentColor"
		>
			<path
				d="M19.14 12.94c.04-.3.06-.61.06-.94 0-.32-.02-.64-.07-.94l2.03-1.58a.49.49 0 0 0 .12-.61l-1.92-3.32a.488.488 0 0 0-.59-.22l-2.39.96a7.01 7.01 0 0 0-1.62-.94l-.36-2.54a.484.484 0 0 0-.48-.41h-3.84c-.24 0-.43.17-.47.41l-.36 2.54c-.59.24-1.13.57-1.62.94l-2.39-.96a.488.488 0 0 0-.59.22L2.74 8.87c-.12.21-.08.47.12.61l2.03 1.58c-.05.3-.07.62-.07.94s.02.64.07.94L2.86 14.52a.49.49 0 0 0-.12.61l1.92 3.32c.12.22.37.29.59.22l2.39-.96c.5.38 1.03.7 1.62.94l.36 2.54c.05.24.24.41.48.41h3.84c.24 0 .44-.17.47-.41l.36-2.54c.59-.24 1.13-.56 1.62-.94l2.39.96c.22.08.47 0 .59-.22l1.92-3.32c.12-.22.07-.47-.12-.61l-2.01-1.58zM12 15.6c-1.98 0-3.6-1.62-3.6-3.6s1.62-3.6 3.6-3.6 3.6 1.62 3.6 3.6-1.62 3.6-3.6 3.6z"
			/>
		</svg>
		Settings
	</a>
</nav>
