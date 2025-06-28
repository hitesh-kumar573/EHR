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

<div class="mb-3 rounded-lg bg-cyan-100 p-3 text-gray-800 shadow-sm dark:bg-cyan-200">
	<p class="flex items-center justify-between">
		<span class="w-[130px] font-bold">• Invoice No:</span>
		<span class="text-right">{item.data?.invoice_number}</span>
	</p>
	<p class="flex items-center justify-between">
		<span class="w-[130px] font-bold">• Lab:</span>
		<span class="text-right">{item.data?.lab_name}</span>
	</p>
	<p class="flex items-center justify-between">
		<span class="w-[130px] font-bold">• Amount:</span>
		<span class="text-right">₹{item.data?.invoice_amount}</span>
	</p>
	<p class="flex items-center justify-between">
		<span class="w-[130px] font-bold">• Date:</span>
		<span class="text-right">{getValidDate(item.data)}</span>
	</p>

	<p class="flex items-start justify-between">
		<span class="w-[130px] font-bold">• Tests:</span>
		<span class="w-[80vw] text-right">({item.data?.test_names?.join(', ')})</span>
	</p>

	{#if item.data?.invoice_link}
		<div class="mt-3 flex justify-end">
			<a
				href={item.data?.invoice_link}
				rel="noopener noreferrer"
				class="inline-block rounded bg-cyan-500 px-4 py-0.5 text-lg font-semibold text-white transition-colors hover:bg-cyan-600"
			>
				<!-- View Invoice -->
				<i class="fas fa-file-invoice text-gray-700 dark:text-gray-200"></i>
			</a>
		</div>
	{/if}
</div>
