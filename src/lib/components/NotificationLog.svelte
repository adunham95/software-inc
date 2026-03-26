<script lang="ts">
	import type { Notification } from '$lib/types';

	interface Props {
		notifications: Notification[];
	}
	let { notifications }: Props = $props();

	function typeStyles(type: Notification['type']): string {
		switch (type) {
			case 'success':
				return 'border-green-700 bg-green-950 text-green-300';
			case 'warning':
				return 'border-yellow-700 bg-yellow-950 text-yellow-300';
			case 'danger':
				return 'border-red-700 bg-red-950 text-red-300';
			default:
				return 'border-blue-700 bg-blue-950 text-blue-300';
		}
	}
</script>

<div class="space-y-2">
	{#each notifications.slice(0, 8) as notif (notif.id)}
		<div class="rounded-lg border px-3 py-2 text-sm {typeStyles(notif.type)}">
			<span class="font-mono text-xs opacity-60">Wk {notif.week}</span>
			<span class="ml-2">{notif.message}</span>
		</div>
	{/each}
</div>
