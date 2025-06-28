<script>
	//@ts-nocheck
	export let data = [];

	const formatDate = (rawDate) => {
		if (!rawDate) return 'N/A';
		const date = new Date(rawDate.includes(' ') ? rawDate.replace(' ', 'T') : rawDate);
		if (isNaN(date)) return 'Invalid Date';
		return date
			.toLocaleString('en-IN', {
				day: '2-digit',
				month: 'long',
				year: 'numeric',
				hour: '2-digit',
				minute: '2-digit',
				hour12: true
			})
			.replace(/\b(am|pm)\b/i, (m) => m.toUpperCase());
	};

	const formatOnlyDate = (rawDate) => {
		if (!rawDate) return 'N/A';
		const date = new Date(rawDate.includes(' ') ? rawDate.replace(' ', 'T') : rawDate);
		return isNaN(date) ? 'Invalid Date' : date.toLocaleDateString();
	};
</script>

<div class="space-y-4">
	{#each data as item, i}
		<div class="rounded-lg bg-blue-100 p-3 text-gray-800 shadow-sm dark:bg-blue-200">
			<p class="flex justify-between">
				<span class="w-[120px] font-bold">• Rx Invoice:</span>
				<span class="w-[48vw] truncate overflow-hidden text-right whitespace-nowrap">
					{item?.rx_invoice_number}
				</span>
			</p>

			<p class="flex items-center justify-between">
				<span class="w-[120px] font-bold">• Drug Name:</span>
				<span class="text-right">{item.rx_drug_name}</span>
			</p>

			<p class="flex items-center justify-between">
				<span class="w-[120px] font-bold">• Amount:</span>
				<span class="text-right">₹{item.rx_invoice_amount}</span>
			</p>

			<p class="flex items-center justify-between">
				<span class="w-[120px] font-bold">• MRP:</span>
				<span class="text-right">₹{item.rx_drug_mrp}</span>
			</p>

			<p class="flex items-center justify-between">
				<span class="w-[120px] font-bold">• Invoice Date:</span>
				<span class="text-right">{formatDate(item.rx_invoice_date)}</span>
			</p>

			<p class="flex items-center justify-between">
				<span class="w-[120px] font-bold">• Expiry:</span>
				<span class="text-right">{formatOnlyDate(item.rx_drug_expiry_date)}</span>
			</p>

			{#if item.rx_invoice_link}
				<div class="mt-2 flex justify-end">
					<a
						aria-label="redirection link"
						href={item.rx_invoice_link}
						rel="noopener noreferrer"
						class="inline-block rounded bg-blue-500 px-4 py-0.5 text-lg font-semibold text-white transition-colors hover:bg-blue-600"
					>
						<i class="fas fa-file-invoice text-white"></i>
					</a>
				</div>
			{/if}
		</div>
	{/each}
</div>
