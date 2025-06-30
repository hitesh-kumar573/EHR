<script>
	//@ts-nocheck

	import FailedNotification from '../FailedNotification.svelte';
	import { failedNotificationMessage, failedNotificationVisible } from '$lib/stores/ChatStores';

	export let isOpen = false;
	export let category = '';
	export let onClose = () => {};
	export let onUploadComplete = (file) => {};

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

	function validateFile(file) {
		const allowedTypes = ['application/pdf', 'image/jpeg', 'image/png', 'image/jpg', 'image/webp'];
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
				selectedFile = null;
				onClose();
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
				accept=".pdf,image/*"
				bind:this={fileInput}
				on:change={handleManualSelect}
				class="hidden"
			/>

			<div class="flex flex-col items-center justify-between gap-3">
				<!-- Submit -->
				<button
					class="w-full rounded-lg bg-blue-500 px-4 py-2 text-white hover:bg-blue-600"
					on:click={handleUpload}
				>
					<i class="fas fa-upload"></i> Submit
				</button>

				<!-- Remove Button (only shown when a file is selected) -->
				{#if selectedFile}
					<button
						class="w-full rounded-lg bg-red-500 px-4 py-2 text-white hover:bg-red-600"
						on:click={removeSelectedFile}
					>
						<i class="fas fa-trash-alt mr-2"></i> Remove
					</button>
				{/if}
			</div>
		</div>
	</div>
{/if}
