<script>
	//@ts-nocheck
	import { onMount } from 'svelte';
	import Chart from 'chart.js/auto';

	// Props
	export let data = [];

	let chartCanvas;
	let trend = '';
	let dateRange = ''; // For chart heading on the right

	onMount(() => {
		if (!data || !data.length) return;

		const item = data[0];
		const unit = item.result_unit?.[0] || 'UOM';

		const sortedDates = [...item.report_result_date].sort((a, b) => new Date(a) - new Date(b));

		const startDate = new Date(sortedDates[0]);
		const endDate = new Date(sortedDates[sortedDates.length - 1]);

		const formatMonthYear = (date) =>
			date.toLocaleDateString('en-GB', {
				month: 'short', // or 'short' if you want Apr instead of April
				year: 'numeric'
			});

		dateRange = `${formatMonthYear(startDate)} - ${formatMonthYear(endDate)}`;

		const combined = item.report_result_date.map((date, i) => ({
			date: new Date(date).toLocaleDateString('en-GB', {
				day: '2-digit',
				month: 'short'
			}), // formatted like "12 Apr"
			value: item.result_value[i]
		}));

		console.log('data combined:', combined);

		combined.sort((a, b) => new Date(a.date) - new Date(b.date));

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

		console.log(trend);

		const chart = new Chart(chartCanvas, {
			type: 'bar', //  Changed from 'line' to 'bar'
			data: {
				// labels: item.report_result_date,
				labels: combined.map((d) => d.date),
				datasets: [
					{
						label: `${item.test_parameter_name} (${unit})`, // show UOM in label
						// data: item.result_value,
						data: combined.map((d) => d.value),
						backgroundColor: 'rgba(6, 182, 212, 0.7)',
						borderColor: 'rgba(6, 182, 212, 1)',
						borderWidth: 1
					}
				]
			},
			options: {
				responsive: true,
				maintainAspectRatio: false,
				scales: {
					y: {
						beginAtZero: true,
						title: {
							display: true,
							text: `Unit (${unit})`, // Vertical label
							font: { size: 14 }
						}
					},
					x: {
						ticks: {
							autoSkip: true,
							maxTicksLimit: 5,
							// maxRotation: 45,
							// minRotation: 45,
							font: {
								size: 10 // Chhota font size
							}
						},
						title: {
							display: true,
							text: 'Test Dates',
							font: { size: 14 }
						}
					}
				},
				plugins: {
					title: {
						display: true,
						text: `Test: ${item.test_parameter_name}`,
						font: { size: 16 }
					},
					tooltip: {
						callbacks: {
							label: (context) => `${context.parsed.y} ${unit}`
						}
					}
				}
			}
		});

		return () => chart.destroy();
	});
</script>

<div class="my-4 min-h-[300px] rounded-lg bg-white p-4 shadow dark:bg-gray-800">
	<h2
		class="mb-2 flex items-center justify-between text-lg font-semibold text-gray-800 dark:text-white"
	>
		<span>📊 Lab Test Chart:</span>
		<span class="text-xs font-normal text-gray-600 dark:text-gray-300">({dateRange})</span>
	</h2>

	<div class="h-[300px]">
		<canvas bind:this={chartCanvas} class="h-full w-full"></canvas>
	</div>
</div>