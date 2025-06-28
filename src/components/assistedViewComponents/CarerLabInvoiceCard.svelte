<script>
	//@ts-nocheck
	export let data = [];

	const formatDateTime = (raw) => {
		if (!raw) return 'N/A';
		const date = new Date(raw.includes(' ') ? raw.replace(' ', 'T') : raw);
		return isNaN(date)
			? 'Invalid Date'
			: date
					.toLocaleString('en-IN', {
						day: '2-digit',
						month: 'long',
						year: 'numeric',
						hour: '2-digit',
						minute: '2-digit',
						hour12: true
					})
					.replace(/\b(am|pm)\b/i, (match) => match.toUpperCase());
	};
</script>

<div class="space-y-4">
	{#each data as item, i}
		<div class="rounded-lg bg-cyan-100 p-3 text-gray-800 shadow-sm dark:bg-cyan-200">
			<p class="flex items-center justify-between">
				<span class="w-[140px] font-bold">• Bill No:</span>
				<span class="text-right">{item.bill_number}</span>
			</p>

			<p class="flex items-center justify-between">
				<span class="w-[140px] font-bold">• Total Amount:</span>
				<span class="text-right">₹{item.total_amount}</span>
			</p>

			<p class="flex items-center justify-between">
				<span class="w-[140px] font-bold">• Paid Amount:</span>
				<span class="text-right">₹{item.paid_amount}</span>
			</p>

			<p class="flex items-center justify-between">
				<span class="w-[140px] font-bold">• Date:</span>
				<span class="text-right">{formatDateTime(item.bill_generated_date)}</span>
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
	{/each}
</div>
