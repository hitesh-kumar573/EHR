<script>
	//@ts-nocheck
	export let data;
	console.log('data from prescription:', data);

	const getValidDate = (raw) => {
		if (!raw) return 'N/A';

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
			return formatted.replace(/\b(am|pm)\b/i, (match) => match.toUpperCase());
		}
		return 'N/A';
	};
</script>

{#each data as data, i}
	<div class="mb-4 rounded-lg bg-blue-100 p-4 text-gray-800 shadow-sm dark:bg-blue-200">
		{#if data.prescription_id}
			<p class="flex justify-between">
				<span class="w-[150px] font-bold">• Prescription Id:</span>
				<span class="text-right">{data.prescription_id}</span>
			</p>
		{/if}

		{#if data.doctor_name}
			<p class="flex items-center justify-between">
				<span class="w-[120px] font-bold">• Doctor:</span>
				<span class="text-right">{data.doctor_name}</span>
			</p>
		{/if}

		{#if data.prescribed_datetime}
			<p class="flex justify-between">
				<span class="w-[110px] font-bold">• Date:</span>
				<span class="w-[80vw] text-right">{getValidDate(data.prescribed_datetime)}</span>
			</p>
		{/if}

		{#if data.medicine_name}
			<p class="flex justify-between">
				<span class="w-[120px] font-bold">• Medicine:</span>
				<span class="text-right text-wrap">{data.medicine_name}</span>
			</p>
		{/if}

		{#if data.dosage_instruction}
			<div class="flex justify-center">
				<span class="w-[170px] font-bold">• Instructions:</span>
				<span class="w-[70vw] text-right">
					{data.dosage_instruction}
				</span>
			</div>
		{/if}

		{#if data.prescription_url}
			<div class="mt-3 flex justify-end">
				<a
					aria-label="prescription link"
					href={data.prescription_url}
					rel="noopener noreferrer"
					class="inline-block rounded bg-blue-500 px-4 py-1 text-white transition-colors hover:bg-blue-600"
				>
					<i class="fas fa-notes-medical text-white"></i>
				</a>
			</div>
		{/if}
	</div>
{/each}
