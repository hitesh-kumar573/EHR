<script>
	//@ts-nocheck
	export let item;

	const getValidDate = (data) => {
		const possibleDateKeys = ['date', 'date_and_time', 'report_result_date'];

		for (const key of possibleDateKeys) {
			const raw = data?.[key];
			if (raw) {
				// Convert SQL-like "YYYY-MM-DD HH:mm:ss" to "YYYY-MM-DDTHH:mm:ss"
				const standardized = raw.includes(' ') ? raw.replace(' ', 'T') : raw;
				const date = new Date(standardized);

				if (!isNaN(date)) {
					const formatted = date.toLocaleString('en-IN', {
						day: '2-digit',
						month: 'long',
						year: 'numeric',
						hour: '2-digit',
						minute: '2-digit',
						hour12: true
					});
					// Convert am/pm to AM/PM
					return formatted.replace(/\b(am|pm)\b/i, (match) => match.toUpperCase());
				}
			}
		}
		return 'N/A';
	};
</script>

<div class="mb-3 rounded-lg bg-blue-100 p-3 text-gray-800 shadow-sm dark:bg-blue-200">
	{#if item.data?.doctor_name}
		<p class="flex items-center justify-between">
			<span class="w-[120px] font-bold">• Doctor:</span>
			<span class="text-right">{item.data?.doctor_name}</span>
		</p>
	{/if}

	{#if item.data}
		<p class="flex items-center justify-between">
			<span class="w-[120px] font-bold">• Date:</span>
			<span class="text-right">{getValidDate(item.data)}</span>
		</p>
	{/if}
	{#if item.data?.medicine_list}
		<div class="flex flex-col items-start justify-between">
			<span class="w-[120px] pt-1 font-bold">• Instructions:</span>
			<div class="ml-4 w-[80vw] text-right">
				<ul class="inline-block text-left">
					{#each item.data?.medicine_list as med}
						<li>• {med}</li>
					{/each}
				</ul>
			</div>
		</div>
	{/if}
	{#if item.data?.prescription_link}
		<div class="mt-2 flex justify-end">
			<a
				href={item.data?.prescription_link}
				rel="noopener noreferrer"
				class="inline-block rounded bg-blue-500 px-4 py-0.5 text-lg font-semibold text-white transition-colors hover:bg-blue-600"
			>
				<!-- View Prescription -->
				<i class="fas fa-notes-medical text-gray-700 dark:text-gray-200"></i>
			</a>
		</div>
	{/if}
</div>
