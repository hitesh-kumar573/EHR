<script>
	//@ts-nocheck

	import FailedNotification from '../FailedNotification.svelte';
	import { failedNotificationMessage, failedNotificationVisible } from '$lib/stores/ChatStores';

	export let isOpen = false;
	export let category = '';
	export let onClose = () => {};
	export let onUploadComplete = (file) => {};
	export let isUploading = false; // passed from parent

	let draggedOver = false;
	let fileInput;
	let selectedFile = null;

	function handleDrop(event) {
		event.preventDefault();
		draggedOver = false;
		const file = event.dataTransfer.files[0];
		if (file && validateFile(file)) {
			selectedFile = file;
		}
	}

	function handleDragOver(event) {
		event.preventDefault();
		draggedOver = true;
	}

	function handleDragLeave() {
		draggedOver = false;
	}

	$: if (!isOpen) {
		selectedFile = null;
	}

	function validateFile(file) {
		// const allowedTypes = ['application/pdf', 'image/jpeg', 'image/png', 'image/jpg', 'image/webp'];
		const allowedTypes = ['application/pdf'];
		return allowedTypes.includes(file.type);
	}

	function handleUpload() {
		// if (selectedFile) {
		// 	onUploadComplete(selectedFile);
		// 	selectedFile = null;
		// 	onClose();
		if (selectedFile) {
			const reader = new FileReader();
			reader.onload = () => {
				const result = reader.result;
				// Remove data URL prefix
				const base64 = result.split(',')[1];

				onUploadComplete({ base64, file: selectedFile });
				// selectedFile = null;
				// onClose();
			};
			reader.readAsDataURL(selectedFile); // 👈 converts to base64
		} else {
			// alert('Please select a valid file first.');
			console.warn('Please select a valid file first.');
			failedNotificationMessage.set('Please select a valid file first.');
			failedNotificationVisible.set(true);
			setTimeout(() => failedNotificationVisible.set(false), 4000);
		}
	}

	function handleManualSelect(event) {
		const file = event.target.files[0];
		if (file && validateFile(file)) {
			selectedFile = file;
		}
	}

	function removeSelectedFile() {
		selectedFile = null;
	}
</script>

<FailedNotification />

{#if isOpen}
	<!-- <div class="bg-opacity-40 fixed inset-0 z-50 flex items-center justify-center bg-black"> -->
	<div
		class="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm dark:bg-black/40"
	>
		<div class="w-[90vw] max-w-md rounded-lg bg-white p-6 dark:bg-gray-800">
			<div class="mb-4 flex items-center justify-between">
				<h3 class="text-lg font-semibold text-gray-800 dark:text-white">Upload {category}</h3>
				<button
					aria-label="Close"
					on:click={onClose}
					class="text-gray-600 hover:text-red-500 dark:text-white"
				>
					<i class="fas fa-times"></i>
				</button>
			</div>

			<!-- Drag & Drop Area -->
			<div
				class={`mb-4 flex h-32 cursor-pointer flex-col items-center justify-center rounded-md border-2 p-4 text-center transition-all ${
					draggedOver
						? 'border-blue-500 bg-blue-100 dark:bg-blue-900'
						: 'border-dashed border-gray-300 dark:border-gray-600'
				}`}
				on:dragover={handleDragOver}
				on:dragleave={handleDragLeave}
				on:drop={handleDrop}
				on:click={() => fileInput.click()}
			>
				{#if selectedFile}
					<p class="text-sm text-wrap text-gray-800 dark:text-white">
						<strong>Selected:</strong>
						{selectedFile.name}
					</p>
				{:else}
					<p class="text-sm text-gray-600 dark:text-gray-300">
						Drag & drop PDF or image here, or click to select.
					</p>
				{/if}
			</div>

			<!-- Hidden file input -->
			<input
				type="file"
				accept=".pdf*"
				bind:this={fileInput}
				on:change={handleManualSelect}
				class="hidden"
			/>

			<div class="flex flex-col items-center justify-between gap-3">
				<!-- Submit -->
				<button
					class="w-full rounded-lg bg-blue-500 px-4 py-2 text-white hover:bg-blue-600"
					on:click={handleUpload}
					disabled={isUploading}
				>
					<!-- <i class="fas fa-upload"></i> Submit -->
					{#if isUploading}
						<!-- <i class="fas fa-spinner fa-spin"></i> Uploading... -->
						<div class="flex items-center justify-center gap-2">
							<span>Uploading</span>
							<div class="typing-dots">
								<div class="dot"></div>
								<div class="dot"></div>
								<div class="dot"></div>
							</div>
						</div>
					{:else}
						<i class="fas fa-upload"></i> Submit
					{/if}
				</button>

				<!-- Remove Button (only shown when a file is selected) -->
				{#if selectedFile}
					<button
						class="w-full rounded-lg bg-red-500 px-4 py-2 text-white hover:bg-red-600 disabled:cursor-not-allowed disabled:opacity-50"
						on:click={removeSelectedFile}
						disabled={isUploading}
					>
						<i class="fas fa-trash-alt mr-2"></i> Remove
					</button>
				{/if}
			</div>
		</div>
	</div>
{/if}

<style>
	.typing-dots {
		display: flex;
		align-items: center;
		justify-content: start;
		gap: 4px;
	}

	.typing-dots .dot {
		width: 6px;
		height: 6px;
		border-radius: 50%;
		animation: blink 1.4s infinite both;
	}

	@media (prefers-color-scheme: light) {
		.typing-dots .dot {
			background-color: #333;
		}
	}
	@media (prefers-color-scheme: dark) {
		.typing-dots .dot {
			background-color: white;
		}
	}

	.typing-dots .dot:nth-child(1) {
		animation-delay: 0s;
	}
	.typing-dots .dot:nth-child(2) {
		animation-delay: 0.2s;
	}
	.typing-dots .dot:nth-child(3) {
		animation-delay: 0.4s;
	}

	@keyframes blink {
		0% {
			opacity: 0.2;
			transform: scale(1);
		}
		50% {
			opacity: 1;
			transform: scale(1.3);
		}
		100% {
			opacity: 0.2;
			transform: scale(1);
		}
	}
</style>
