<script>
	//@ts-nocheck
	import { onMount } from 'svelte';
	import Chart from 'chart.js/auto';

	// Props
	export let data = [];

	let chartCanvas;
	let trend = '';

	onMount(() => {
		if (!data || !data.length) return;

		const item = data[0]; // For now we assume one test

		// Step 1: Combine both into array of objects
		const combined = item.report_result_date.map((date, i) => ({
			date,
			value: item.result_value[i]
		}));

		// Step 2: Sort by date
		combined.sort((a, b) => new Date(a.date) - new Date(b.date));

		// Step 3: Calculate trend
		const first = combined[0].value;
		const last = combined[combined.length - 1].value;
		const diff = last - first;

		let hasFluctuation = false;

		for (let i = 1; i < combined.length; i++) {
			const prev = combined[i - 1].value;
			const curr = combined[i].value;
			if ((curr - prev) * (last - first) < 0) {
				hasFluctuation = true;
				break;
			}
		}
		trend = hasFluctuation
			? '📈 Fluctuated'
			: diff > 0
				? '⬆️ Increased'
				: diff < 0
					? '⬇️ Decreased'
					: '⏸️ Stable';

		console.log(trend); // optional

		const chart = new Chart(chartCanvas, {
			type: 'line',
			data: {
				labels: item.report_result_date,
				datasets: [
					{
						label: item.test_parameter_name,
						data: item.result_value,
						backgroundColor: 'rgba(6, 182, 212, 0.4)', // cyan
						borderColor: 'rgba(6, 182, 212, 1)', // cyan
						borderWidth: 2,
						tension: 0.3,
						fill: false
					}
				]
			},
			options: {
				responsive: true,
				scales: {
					y: {
						beginAtZero: true
					}
				},
				plugins: {
					title: {
						display: true,
						text: `Test: ${item.test_parameter_name}`,
						font: { size: 16 }
					}
				}
			}
		});

		return () => chart.destroy(); // cleanup
	});
</script>

<div class="my-4 rounded-lg bg-white p-4 shadow dark:bg-gray-800">
	<h2 class="mb-2 text-lg font-semibold text-gray-800 dark:text-white">📊 Lab Test Chart</h2>
	<canvas bind:this={chartCanvas}></canvas>

	<!-- Trend below chart -->
	<!-- <div class="mt-2 text-sm font-medium text-gray-700 dark:text-gray-200">
		Result Trend: <span class="font-semibold">{trend}</span>
	</div> -->
</div>
