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
			{#if item.report_number}
				<p class="flex items-center justify-between">
					<span class="w-[130px] font-bold">• Report No:</span>
					<span class="text-right">{item.report_number}</span>
				</p>
			{/if}

			{#if item.referral_doctor_name}
				<p class="flex items-center justify-between">
					<span class="w-[130px] font-bold">• Referral:</span>
					<span class="text-right">{item.referral_doctor_name}</span>
				</p>
			{/if}

			{#if item.report_result_date}
				<p class="flex items-center justify-between">
					<span class="w-[130px] font-bold">• Date:</span>
					<span class="text-right">{formatDateTime(item.report_result_date)}</span>
				</p>
			{/if}

			{#if item.report_link}
				<div class="mt-3 flex justify-end">
					<a
						aria-label="report link"
						href={item.report_link}
						rel="noopener noreferrer"
						class="inline-block rounded bg-cyan-500 px-4 py-0.5 text-lg font-semibold text-white transition-colors hover:bg-cyan-600"
					>
						<i class="fas fa-file-medical-alt text-white"></i>
					</a>
				</div>
			{/if}
		</div>
	{/each}
</div>
