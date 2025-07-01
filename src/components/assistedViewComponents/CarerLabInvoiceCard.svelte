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
			{#if item.bill_number}
				<p class="flex items-center justify-between">
					<span class="w-[140px] font-bold">• Bill No:</span>
					<span class="text-right">{item.bill_number}</span>
				</p>
			{/if}

			{#if item.total_amount}
				<p class="flex items-center justify-between">
					<span class="w-[140px] font-bold">• Total Amount:</span>
					<span class="text-right">₹{item.total_amount}</span>
				</p>
			{/if}

			{#if item.paid_amount}
				<p class="flex items-center justify-between">
					<span class="w-[140px] font-bold">• Paid Amount:</span>
					<span class="text-right">₹{item.paid_amount}</span>
				</p>
			{/if}

			{#if item.bill_generated_date}
				<p class="flex items-center justify-between">
					<span class="w-[140px] font-bold">• Date:</span>
					<span class="text-right">{formatDateTime(item.bill_generated_date)}</span>
				</p>
			{/if}

			{#if item.tax_amount > 0}
				<p class="flex items-center justify-between">
					<span class="w-[140px] font-bold">• Tax:</span>
					<span class="text-right">{item.tax_amount}</span>
				</p>
			{/if}

			{#if item.discount > 0}
				<p class="flex items-center justify-between">
					<span class="w-[140px] font-bold">• Discount:</span>
					<span class="text-right">{item.discount}</span>
				</p>
			{/if}

			{#if item.billing_link}
				<div class="mt-3 flex justify-end">
					<a
						href={item.billing_link}
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
