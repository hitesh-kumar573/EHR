<script>
	//@ts-nocheck
	export let item;

	// Group parameters into "Normal" and "Abnormal"
	let normalParams = [];
	let abnormalParams = [];

	for (const [testName, values] of Object.entries(item.data?.test_parameter_names || {})) {
		for (const param of values) {
			if (param.includes('(Normal)')) {
				normalParams.push({ test: testName, value: param });
			} else {
				abnormalParams.push({ test: testName, value: param });
			}
		}
	}
	function groupBy(array, key) {
		return array.reduce((result, current) => {
			(result[current[key]] = result[current[key]] || []).push(current);
			return result;
		}, {});
	}

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

<div class="mb-4 rounded-lg bg-cyan-100 p-3 text-gray-800 shadow-sm dark:bg-cyan-200">
	{#if item.data?.report_number}
		<p class="flex items-center justify-between">
			<span class="w-[130px] font-bold">• Report No:</span>
			<span class="text-right">{item.data?.report_number}</span>
		</p>
	{/if}
	{#if item.data?.lab_name}
		<p class="flex items-center justify-between">
			<span class="w-[130px] font-bold">• Lab:</span>
			<span class="text-right">{item.data?.lab_name}</span>
		</p>
	{/if}
	{#if item.data?.referral_doctor_name}
		<p class="flex items-center justify-between">
			<span class="w-[130px] font-bold">• Referral:</span>
			<span class="text-right">{item.data?.referral_doctor_name}</span>
		</p>
	{/if}
	{#if item.data}
		<p class="flex items-center justify-between">
			<span class="w-[130px] font-bold">• Date:</span>
			<span class="text-right">{getValidDate(item.data)}</span>
		</p>
	{/if}

	<!-- Parameters Section -->
	<!-- {#if normalParams?.length > 0}
		<p class="mt-3 font-semibold text-green-700">• Normal Parameters:</p>
		<ul class="ml-5 list-disc">
			{#each Object.entries(groupBy(normalParams, 'test')) as [test, values]}
				<li>
					<strong>{test}:</strong>
					<ul>
						{#each values as param}
							<li>• {param?.value}</li>
						{/each}
					</ul>
				</li>
			{/each}
		</ul>
	{/if} -->

	{#if abnormalParams?.length > 0}
		<p class="mt-3 font-semibold text-red-500">• Abnormal Parameters:</p>
		<ul class="ml-5 list-disc">
			{#each Object.entries(groupBy(abnormalParams, 'test')) as [test, values]}
				<li>
					<strong>{test}:</strong>
					<ul>
						{#each values as param}
							<li>• {param?.value}</li>
						{/each}
					</ul>
				</li>
			{/each}
		</ul>
	{/if}

	<!-- Report Link Button -->
	{#if item.data?.report_link}
		<div class="mt-3 flex justify-end">
			<a
				href={item.data?.report_link}
				rel="noopener noreferrer"
				class="inline-block rounded bg-cyan-500 px-4 py-0.5 text-lg font-semibold text-white transition-colors hover:bg-cyan-600"
			>
				<!-- View Report -->
				<i class="fas fa-file-medical-alt text-gray-700 dark:text-gray-200"></i>
				<!-- or -->
				<!-- <i class="fas fa-file-lines text-gray-700 dark:text-gray-200"></i> -->
			</a>
		</div>
	{/if}
</div>
