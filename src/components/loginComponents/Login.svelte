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

<!-- <div
	class="relative min-h-screen overflow-hidden bg-gradient-to-br from-blue-100 via-white to-teal-100 dark:from-gray-800 dark:via-gray-900 dark:to-gray-800"
> -->
<div
	class="relative flex min-h-[100dvh] flex-col overflow-hidden bg-gradient-to-br from-blue-100 via-white to-teal-100 dark:from-gray-800 dark:via-gray-900 dark:to-gray-800"
>
	<div class="z-50 mx-auto w-full bg-white/30 px-6 py-2 backdrop-blur-md dark:bg-black/40">
		<img src="/Carer_Logo.png" alt="Carer Logo" class="h-12 w-auto rounded-md" />
	</div>

	<div class="z-50 mx-auto w-full bg-white/30 px-6 py-2 backdrop-blur-md dark:bg-black/10">
		<h1
			class="animate-gradient-x bg-gradient-to-r from-cyan-400 via-blue-500 to-cyan-400 bg-clip-text text-center text-4xl font-extrabold text-transparent sm:text-5xl"
		>
			EHR
		</h1>
	</div>
	<!-- 👇 Animated Background Blobs -->
	<div
		class="pointer-events-none absolute -top-24 -left-24 h-[500px] w-[500px] animate-pulse rounded-full bg-blue-300 opacity-30 blur-3xl dark:bg-blue-800"
	></div>
	<div
		class="pointer-events-none absolute top-[60%] left-[60%] h-[400px] w-[400px] animate-pulse rounded-full bg-teal-300 opacity-20 blur-2xl dark:bg-teal-700"
	></div>

	<div class="flex flex-1 items-center justify-center bg-gray-100 p-4 dark:bg-gray-900">
		<div class="pointer-events-none absolute inset-0 z-10">
			<!-- Example: Floating plus icon -->

			<i
				class="fas fa-notes-medical animate-float2 absolute text-4xl text-blue-400 dark:text-blue-500"
				style="top: 73%; left: 10%;"
			></i>

			<i
				class="fas fa-pills animate-float2 absolute text-4xl text-cyan-400 dark:text-cyan-500"
				style="top: 77%; left: 75%;"
			></i>

			<i
				class="fas fa-file-invoice animate-float3 absolute text-4xl text-blue-400 dark:text-blue-500"
				style="top: 33%; left: 80%;"
			></i>

			<i
				class="fas fa-file-medical-alt animate-float2 absolute text-4xl text-cyan-400 dark:text-cyan-500"
				style="top: 28%; left: 20%;"
			></i>
		</div>
		<!-- <div class="relative w-full max-w-sm rounded-xl bg-white p-6 shadow-lg dark:bg-gray-800"> -->
		<div
			class="relative z-50 mb-7 w-full max-w-sm rounded-xl bg-white/60 p-6 shadow-lg backdrop-blur-xl dark:bg-gray-800/60"
		>
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

	@keyframes float1 {
		0% {
			transform: translateY(0px) rotate(0deg);
		}
		50% {
			transform: translateY(-20px) rotate(5deg);
		}
		100% {
			transform: translateY(0px) rotate(0deg);
		}
	}
	@keyframes float2 {
		0% {
			transform: translateY(0px) rotate(0deg);
		}
		50% {
			transform: translateY(15px) rotate(-5deg);
		}
		100% {
			transform: translateY(0px) rotate(0deg);
		}
	}
	@keyframes float3 {
		0% {
			transform: translateY(0px) scale(1);
		}
		50% {
			transform: translateY(-10px) scale(1.05);
		}
		100% {
			transform: translateY(0px) scale(1);
		}
	}

	.animate-float1 {
		animation: float1 6s ease-in-out infinite;
	}
	.animate-float2 {
		animation: float2 8s ease-in-out infinite;
	}
	.animate-float3 {
		animation: float3 5s ease-in-out infinite;
	}

	@keyframes gradient-x {
		0% {
			background-position: 0% 50%;
		}
		50% {
			background-position: 100% 50%;
		}
		100% {
			background-position: 0% 50%;
		}
	}

	.animate-gradient-x {
		background-size: 300% 300%;
		animation: gradient-x 4s ease-in-out infinite;
	}
</style>
