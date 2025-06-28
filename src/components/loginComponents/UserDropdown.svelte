<script>
	//@ts-nocheck
	import { goto } from '$app/navigation';
	import { user } from '$lib/stores/ChatStores';
	export let showDropdown;
	export let toggleDropdown = () => {};

	function logout() {
		let userId = localStorage.getItem('user_id');
		console.log('Logging out user with ID:', userId);

		if (userId) {
			localStorage.removeItem('user_id');
			localStorage.removeItem(`user_age-${userId}`);
			localStorage.removeItem(`user_phone-${userId}`);

			localStorage.removeItem(`user_gender-${userId}`);
			localStorage.removeItem(`user_address-${userId}`);

			localStorage.removeItem(`last_active_chat_id-${userId}`);
		}

		user.set({
			id: null,
			name: null,
			phone: null,
			age: null,
			gender: null,
			address: null,
			email: null,
			token: null
		});
		showDropdown = false;
		goto('/');
	}
</script>

{#if $user}
	<!-- Logged-in View -->
	<div class="relative">
		<button
			on:click={toggleDropdown}
			class="rounded-md bg-blue-500 px-2 py-2 text-sm text-white hover:bg-blue-600"
		>
			<span class="flex max-w-[60px] items-center justify-between gap-1 truncate">
				<i class="fas fa-user text-xs text-white"></i>
				<span class="truncate overflow-hidden whitespace-nowrap">
					{$user?.phone}
				</span>
			</span>
		</button>

		{#if showDropdown}
			<div class="absolute right-0 z-50 mt-2 w-48 rounded-md bg-white shadow-lg dark:bg-gray-700">
				<div class="flex flex-col gap-2 px-4 py-2 text-sm text-gray-700 dark:text-white">
					{#if $user?.phone && $user.phone !== 'null' && $user.phone !== ''}
						<p class="max-w-[180px] truncate overflow-hidden whitespace-nowrap">
							• {$user.phone}
						</p>
					{/if}
					{#if $user?.gender && $user.gender !== 'null' && $user.gender !== ''}
						<p class="max-w-[180px] truncate overflow-hidden whitespace-nowrap">
							• {$user.gender}
						</p>
					{/if}
					{#if $user?.age && $user.age !== 'null' && $user.age !== ''}
						<p class="max-w-[180px] truncate overflow-hidden whitespace-nowrap">
							• {$user.age}
						</p>
					{/if}
					{#if $user?.address && $user.address !== 'null' && $user.address !== ''}
						<p class="max-w-[180px] truncate overflow-hidden whitespace-nowrap">
							• {$user.address}
						</p>
					{/if}
				</div>
				<hr class="my-1" />
				<button
					on:click={logout}
					class="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 dark:text-white dark:hover:bg-gray-700"
				>
					Logout
				</button>
			</div>
		{/if}
	</div>
{:else}
	<button
		on:click={() => goto('/')}
		class="rounded-md bg-blue-500 px-2 py-2 text-sm text-gray-700 hover:bg-blue-600 active:bg-blue-600 dark:text-white"
	>
		<i class="fas fa-user text-white"></i>
		Login
	</button>
{/if}
