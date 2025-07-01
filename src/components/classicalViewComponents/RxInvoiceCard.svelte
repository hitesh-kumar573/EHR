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

<div class="mb-4 rounded-lg bg-blue-100 p-3 text-gray-800 shadow-sm dark:bg-blue-200">
	{#if item.data?.invoice_number}
		<p class="flex justify-between">
			<span class="w-[120px] font-bold">• Rx Invoice:</span>
			<span class="w-[48vw] truncate overflow-hidden text-right whitespace-nowrap">
				{item.data?.invoice_number}
			</span>
		</p>
	{/if}
	{#if item.data?.pharmacy_store}
		<p class="flex items-center justify-between">
			<span class="w-[120px] font-bold">• Pharmacy:</span>
			<span class="text-right">{item.data?.pharmacy_store}</span>
		</p>
	{/if}
	{#if item.data?.invoice_amount}
		<p class="flex items-center justify-between">
			<span class="w-[120px] font-bold">• Amount:</span>
			<span class="text-end">₹{item.data?.invoice_amount}</span>
		</p>
	{/if}
	{#if item.data}
		<p class="flex items-center justify-between">
			<span class="w-[120px] font-bold">• Date:</span>
			<span class="text-right">{getValidDate(item.data)}</span>
		</p>
	{/if}
	{#if item.data?.medicine_name_array}
		<p class="flex h-auto justify-between pt-1">
			<span class="w-[120px] font-bold">• Medicines:</span>
			<span class="w-[80vw] text-right">({item.data?.medicine_name_array?.join(', ')})</span>
		</p>
	{/if}
	{#if item?.data?.invoice_link}
		<div class="mt-2 flex justify-end">
			<a
				href={item.data?.invoice_link}
				rel="noopener noreferrer"
				class="inline-block rounded bg-blue-500 px-4 py-0.5 text-lg font-semibold text-white transition-colors hover:bg-blue-500"
			>
				<!-- View Invoice -->
				<i class="fas fa-file-invoice text-gray-700 dark:text-gray-200"></i>
			</a>
		</div>
	{/if}
</div>
