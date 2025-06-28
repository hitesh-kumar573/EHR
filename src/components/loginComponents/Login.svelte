<script>
	//@ts-nocheck
	import { goto } from '$app/navigation';
	import {
		failedNotificationMessage,
		failedNotificationVisible,
		user
	} from '$lib/stores/ChatStores';
	import FailedNotification from '../FailedNotification.svelte';

	const baseUrl = import.meta.env.VITE_API_BASE_URL;

	let step = 1;
	let phone = '';
	let otp = '';
	let message = '';
	let showOtp = false;

	let isSendingOtp = false;
	let isVerifyingOtp = false;

	function showFailure(msg) {
		failedNotificationMessage.set(msg);
		failedNotificationVisible.set(true);
		setTimeout(() => failedNotificationVisible.set(false), 4000);
	}

	async function sendOtp() {
		isSendingOtp = true;
		console.log('phone:', phone);
		const sanitizedPhone = phone.replace(/\D/g, '');

		// 📌 1. Validate phone
		if (sanitizedPhone.length !== 10) {
			message = 'Please enter a valid 10-digit phone number.';
			showFailure(message);
			isSendingOtp = false;
			return;
		}

		const fullPhone = `+91${sanitizedPhone}`;

		// 📌 2. Check if user exists
		let userData;

		try {
			const res = await fetch(`${baseUrl}/user/${sanitizedPhone}`); // <-- GET call
			userData = await res.json();

			if (!res.ok || !userData.user_id) {
				message = 'No user found with this phone number.';
				showFailure(message);
				isSendingOtp = false;
				return;
			}
		} catch (err) {
			console.error('User fetch failed:', err);
			message = 'Server error. Try again.';
			showFailure(message);
			isSendingOtp = false;
			return;
		}

		console.log('✅ User exists:', userData);
		if (userData) {
			message = 'Sending OTP...';
		}

		// 📌 3. Send OTP
		try {
			const otpRes = await fetch('/api/send-otp', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ phone: fullPhone })
			});

			const otpData = await otpRes.json();
			console.log('otpData:', otpData);

			if (otpData.status === 'pending') {
				step = 2;
				message = 'OTP sent successfully!';
				// 📦 Store userData temporarily (until OTP verify)
				localStorage.setItem('temp_user_data', JSON.stringify(userData));
			} else {
				message = otpData.error || 'Failed to send OTP';
				showFailure(message);
			}
		} catch (err) {
			console.error('OTP sending failed:', err);
			message = 'Something went wrong while sending OTP.';
			showFailure(message);
			isSendingOtp = false;
		}
		isSendingOtp = false;
	}

	async function verifyOtp() {
		isVerifyingOtp = true;
		const sanitizedPhone = phone.replace(/\D/g, '');
		const fullPhone = `+91${sanitizedPhone}`;

		try {
			const res = await fetch('/api/verify-otp', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ phone: fullPhone, code: otp })
			});
			console.log('res:', res);

			const data = await res.json();
			console.log('data:', data);

			if (data.success) {
				message = 'Phone number verified successfully!';

				// ✅ Save the fetched user data (from temp storage)
				const tempUser = JSON.parse(localStorage.getItem('temp_user_data') || '{}');

				console.log('temp user data:', tempUser);

				if (tempUser && tempUser.user_id) {
					const userId = tempUser.user_id;

					console.log('user id:', userId);

					localStorage.setItem('user_id', userId);
					localStorage.setItem(`user_phone-${userId}`, tempUser.phone);
					localStorage.setItem(`user_age-${userId}`, tempUser.Age);
					localStorage.setItem(`user_gender-${userId}`, tempUser.Gender);
					localStorage.setItem(`user_address-${userId}`, tempUser.Address || '');

					// ✅ UPDATE the store also
					user.set({
						id: userId,
						phone: tempUser.phone,
						age: tempUser.Age,
						gender: tempUser.Gender,
						address: tempUser.Address || null
					});

					// 🧹 Clean up temp user
					localStorage.removeItem('temp_user_data');

					goto('/home');
				} else {
					message = 'User data missing. Please try again.';
					showFailure(message);
					isVerifyingOtp = false;
				}
			} else {
				message = data.error || 'Invalid OTP';
				showFailure(message);
				isVerifyingOtp = false;
			}
		} catch (err) {
			console.error('OTP verification failed:', err);
			message = 'Something went wrong.';
			showFailure(message);
			isVerifyingOtp = false;
		}
		isVerifyingOtp = false;
	}

	function toggleOtpVisibility() {
		showOtp = !showOtp;
	}

	function goBackHome() {
		goto('/home'); // change '/' to your desired route if needed
	}
</script>

<FailedNotification message={$failedNotificationMessage} visible={$failedNotificationVisible} />

<div class="flex min-h-screen items-center justify-center bg-gray-100 p-4 dark:bg-gray-900">
	<div class="relative w-full max-w-sm rounded-xl bg-white p-6 shadow-lg dark:bg-gray-800">
		{#if step === 2}
			<!-- Back Arrow Button (Top Left Corner) -->
			<button
				type="button"
				aria-label="Go back"
				on:click={() => (step = 1)}
				class="absolute top-4 left-4 text-gray-600 hover:text-black dark:text-gray-300 dark:hover:text-white"
			>
				<i class="fas fa-arrow-left text-lg"></i>
			</button>
		{/if}

		<h2 class="mb-6 text-center text-2xl font-semibold dark:text-white">
			{step === 1 ? 'Login in with Phone' : 'Enter OTP'}
		</h2>

		{#if step === 1}
			<!-- Step 1: Send OTP -->
			<form on:submit|preventDefault={sendOtp}>
				<input
					type="tel"
					bind:value={phone}
					autocomplete="off"
					maxlength="10"
					placeholder="Enter 10-digit phone number"
					class="mb-4 w-full rounded-lg border p-3 focus:ring-2 focus:ring-blue-500 focus:outline-none dark:border-gray-600 dark:bg-gray-700 dark:text-white"
				/>

				<button
					type="submit"
					class="flex w-full items-center justify-center gap-1 rounded-lg bg-blue-600 p-3 text-white transition hover:bg-blue-700"
					disabled={isSendingOtp}
				>
					{#if isSendingOtp}
						<span class="loader mr-2"></span> Sending...
					{:else}
						Send OTP
					{/if}
				</button>
			</form>
		{:else}
			<!-- Step 2: Verify OTP -->
			<form on:submit|preventDefault={verifyOtp}>
				<div class="relative">
					<input
						type={showOtp ? 'text' : 'password'}
						bind:value={otp}
						autocomplete="off"
						placeholder="Enter 4-digit OTP"
						class="mb-4 w-full rounded-lg border p-3 pr-12 focus:ring-2 focus:ring-blue-500 focus:outline-none dark:border-gray-600 dark:bg-gray-700 dark:text-white"
					/>

					<!-- Eye icon -->
					<button
						type="button"
						aria-label="toggle button"
						on:click={toggleOtpVisibility}
						class="absolute top-2.5 right-3 text-gray-500 dark:text-gray-300"
					>
						<i class={`fas ${showOtp ? 'fa-eye-slash' : 'fa-eye'}`}></i>
					</button>
				</div>

				<button
					type="submit"
					class="flex w-full items-center justify-center gap-1 rounded-lg bg-green-600 p-3 text-white transition hover:bg-green-700"
					disabled={isVerifyingOtp}
				>
					{#if isVerifyingOtp}
						<span class="loader mr-2"></span> Verifying...
					{:else}
						Verify OTP
					{/if}
				</button>
			</form>
		{/if}
	</div>
</div>

<style>
	.loader {
		border: 3px solid #f3f3f3;
		border-top: 3px solid #3498db;
		border-radius: 50%;
		width: 16px;
		height: 16px;
		animation: spin 1s linear infinite;
		display: inline-block;
	}
	@keyframes spin {
		0% {
			transform: rotate(0deg);
		}
		100% {
			transform: rotate(360deg);
		}
	}
</style>
