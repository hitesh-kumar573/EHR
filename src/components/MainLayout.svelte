<script>
	//@ts-nocheck
	import { onMount } from 'svelte';
	import DesktopView from './DesktopView.svelte';
	import MobileView from './MobileView.svelte';
	import { user } from '$lib/stores/ChatStores';

	// Optional – sync localStorage and store if user refreshes
	onMount(() => {
		const userId = localStorage.getItem('user_id');

		if (userId) {
			user.set({
				id: userId,
				phone: localStorage.getItem(`user_phone-${userId}`),
				age: localStorage.getItem(`user_age-${userId}`) || '',
				gender: localStorage.getItem(`user_gender-${userId}`) || '',
				address: localStorage.getItem(`user_address-${userId}`) || '',
				name: localStorage.getItem(`user_name-${userId}`),
				email: localStorage.getItem(`user_email-${userId}`),
				token: localStorage.getItem(`token-${userId}`)
			});
		}
	});
</script>

<!-- {#if isMobile} -->
<MobileView />
<!-- {:else} -->
<DesktopView />
<!-- {/if} -->
