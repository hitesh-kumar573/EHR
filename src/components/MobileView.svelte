<script>
	//@ts-nocheck
	import {
		messages,
		chats,
		savedPosts,
		userInput,
		activeChatId,
		chatIdCounter,
		failedNotificationVisible,
		failedNotificationMessage,
		isMobileView,
		showMobileDrawer,
		startDate,
		endDate,
		userId,
		journalData,
		user,
		ehrData
	} from '$lib/stores/ChatStores';

	import FailedNotification from './FailedNotification.svelte';
	import { goto } from '$app/navigation';
	import { fly } from 'svelte/transition';
	import { onMount, tick } from 'svelte';
	import flatpickr from 'flatpickr';
	import 'flatpickr/dist/flatpickr.min.css';
	import { get } from 'svelte/store';
	import LoginPopNotification from './loginComponents/LoginPopNotification.svelte';
	import RxInvoiceCard from './classicalViewComponents/RxInvoiceCard.svelte';
	import RxPrescriptionCard from './classicalViewComponents/RxPrescriptionCard.svelte';
	import LabReportCard from './classicalViewComponents/LabReportCard.svelte';
	import LabInvoiceCard from './classicalViewComponents/LabInvoiceCard.svelte';
	import CarerRxInvoiceCard from './assistedViewComponents/CarerRxInvoiceCard.svelte';
	import CarerLabReportCard from './assistedViewComponents/CarerLabReportCard.svelte';
	import CarerRxPrescriptionCard from './assistedViewComponents/CarerRxPrescriptionCard.svelte';
	import CarerLabInvoiceCard from './assistedViewComponents/CarerLabInvoiceCard.svelte';
	import CarerLabChartCard from './assistedViewComponents/CarerLabChartCard.svelte';
	import UserDropdown from './loginComponents/UserDropdown.svelte';

	const baseUrl = import.meta.env.VITE_API_BASE_URL;
	const baseUrlForCustomQuery = import.meta.env.VITE_API_BASE_URL_FOR_CUSTOM_QUERY;

	let showLoginPopup = false;

	let calendarRef;
	let chatContainer;
	let showDropdown = false;

	let dropdownPosition = 'bottom'; // 'top' or 'bottom'
	let menuChatId = null; // to track which chat's menu is open
	let renamingChatId = null;
	let newTitle = '';

	let labReports = [];
	let labInvoices = [];
	let rxInvoices = [];
	let rxPrescriptions = [];

	// Subscribe to ehrData and group it
	$: if ($ehrData?.length > 0) {
		labReports = $ehrData.filter((item) => item.type === 'Lab_Report');
		labInvoices = $ehrData.filter((item) => item.type === 'Lab_Invoice');
		rxInvoices = $ehrData.filter((item) => item.type === 'Rx_Invoice');
		rxPrescriptions = $ehrData.filter((item) => item.type === 'Rx_Prescription');
	}

	function formatLocalDate(date) {
		return (
			date.getFullYear() +
			'-' +
			String(date.getMonth() + 1).padStart(2, '0') +
			'-' +
			String(date.getDate()).padStart(2, '0')
		);
	}

	onMount(() => {
		const currentView = get(isMobileView);

		// 👇 Restore selectedSub from localStorage
		const storedSub = localStorage.getItem('selectedSub');
		if (storedSub) {
			selectedSub = storedSub; // This will trigger the reactive $: block
		} else {
			fetchEhrData(); // Only if no filter is selected
		}

		if (currentView === 'classical') {
			const today = new Date().toISOString().split('T')[0];

			startDate.set('');
			endDate.set('');

			flatpickr(calendarRef, {
				mode: 'range',
				dateFormat: 'Y-m-d',
				maxDate: 'today',
				defaultDate: null,
				allowInput: true,
				onChange: function (selectedDates) {
					if (selectedDates.length === 2) {
						// startDate.set(selectedDates[0].toISOString().split('T')[0]);
						// endDate.set(selectedDates[1].toISOString().split('T')[0]);
						startDate.set(formatLocalDate(selectedDates[0]));
						endDate.set(formatLocalDate(selectedDates[1]));
						console.log('Date range set:', $startDate, 'to', $endDate);
					} else {
						startDate.set('');
						endDate.set('');
						console.log('Date range cleared');
					}
					// Fetch data after date change or reset
					fetchEhrData();
				}
			});
		}
	});

	async function fetchEhrData() {
		try {
			const uid = localStorage.getItem('user_id') || null;
			const phone = localStorage.getItem(`user_phone-${uid}`) || null;
			const start = get(startDate);
			const end = get(endDate);

			let url = '';
			if (phone) {
				url = `${baseUrl}/all_results_for_date_range/${phone}`;

				if (start && end) {
					url += `?start_date=${start}&end_date=${end}`;
				}

				console.log('Fetching EHR from URL:', url);
			} else {
				console.log('No phone found.');
			}

			const res = await fetch(url);
			const data = await res.json();

			if (res.ok) {
				console.log('✅ Fetched EHR data:', data);

				// Optional: Filter or transform data if needed before storing
				ehrData.set(data); // Assuming `ehrData` is a writable store

				console.log('ehr data:', $ehrData);
			} else {
				console.error('❌ Error fetching EHR data:', data);
			}
		} catch (error) {
			console.error('🚨 Fetch EHR failed:', error);
		}
	}

	onMount(async () => {
		const userId = localStorage.getItem('user_id');
		// await fetchUserChats(); // Always fetch first

		// const currentChats = get(chats);
		// if (!currentChats || currentChats.length === 0) {
		// 	initializeNewChat(); // Only if no chats exist after fetch
		// }

		const fetchedChats = await fetchUserChats(); // now you wait

		console.log('fetchedChats:', fetchedChats);
		if (!fetchedChats || fetchedChats.length === 0) {
			initializeNewChat();
			return;
		}

		if (userId && fetchedChats) {
			// ⏪ Restore last selected chat if available
			// const lastChatId = localStorage.getItem(`last_active_chat_id-${userId}`);
			const lastChatId = parseInt(localStorage.getItem(`last_active_chat_id-${userId}`));
			const foundChat = fetchedChats.find((c) => c.id === lastChatId);

			console.log('All chats:', fetchedChats);
			console.log('Last stored chat id:', lastChatId);
			console.log('Found:', foundChat);

			if (foundChat) {
				selectChat(foundChat.id);
			} else {
				selectChat(fetchedChats[0].id); // fallback to first
			}
		}
	});

	async function fetchUserChats() {
		const currentUserId = localStorage.getItem('user_id');
		const phone = localStorage.getItem(`user_phone-${currentUserId}`) || null;

		if (!currentUserId || !phone) {
			console.error('❌ Missing user_id or phone – cannot fetch chats');
			chats.set([]);
			return;
		}

		console.log('📥 Fetching chats for user_id:', currentUserId, 'phone:', phone);

		try {
			const res = await fetch(`${baseUrl}/chats/${phone}`, {
				headers: {
					'Content-Type': 'application/json'
				}
			});

			if (!res.ok) throw new Error('Failed to fetch chats');

			const data = await res.json();

			console.log('Fetched chats data:', data);
			// Add messages placeholder for each chat
			const formattedChats = data
				.filter((chat) => chat.chat_id !== undefined)
				.map((chat) => ({
					id: chat.chat_id,
					title: chat.title,
					messages: [] // You can fetch specific chat messages later if needed
				}));

			chats.set(formattedChats);

			console.log('chats:', $chats);
			return formattedChats;

			// ✅ Auto-select first chat if any exist
			// if (formattedChats.length > 0) {
			// 	selectChat(formattedChats[0].id); // auto-load first chat's messages
			// }
		} catch (error) {
			console.error('Error fetching user chats:', error);
		}
	}

	async function initializeNewChat() {
		chatIdCounter.update((c) => c + 1);
		const newId = get(chatIdCounter); // get the updated value synchronously
		const currentUserId = localStorage.getItem('user_id');
		const phone = localStorage.getItem(`user_phone-${currentUserId}`);

		if (!currentUserId || !phone) {
			console.error('❌ Missing user_id or phone');
			return;
		}

		//Todo1:- add chat
		//  URL/chats/
		// call this api here for adding every new chat when component render or user manually add it by clicking on new chat button
		try {
			const res = await fetch(`${baseUrl}/chats/`, {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json'
				},
				body: JSON.stringify({
					phone: phone
				})
			});

			console.log('Create chat response::', res);

			if (!res.ok) {
				const errorText = await res.text(); // OR use res.json() if API returns JSON error
				console.error('Failed to create chat:', errorText);
				throw new Error('Failed to create chat');
			}

			const data = await res.json();
			console.log('Chat created:', data);

			const newChat = {
				id: data.chat_id,
				title: data.title,
				messages: [{ sender: 'bot', text: 'Hi! How can I assist you today?' }]
			};

			chats.update((c) => [newChat, ...c]);
			activeChatId.set(data.chat_id);
			messages.set(newChat.messages);

			await tick(); // ensure DOM updates after setting messages
			scrollToBottom(); // scroll to bottom so message is visible
		} catch (error) {
			console.error('Error creating new chat:', error);
		}
	}

	async function selectChat(chatId) {
		//Todo4:-- Get messages of a previous chat
		// URL/messages/{chat_id}
		// call this api here for getting particular chats messages

		console.log('chat id from select chat function:', chatId);

		const currentUserId = localStorage.getItem('user_id');
		const phone = localStorage.getItem(`user_phone-${currentUserId}`);

		if (currentUserId) {
			localStorage.setItem(`last_active_chat_id-${currentUserId}`, chatId);
		}

		if (!userId || !phone) {
			console.error('User credentials missing.');
			failedNotificationMessage.set('User details missing. Please log in again.');
			failedNotificationVisible.set(true);
			setTimeout(() => failedNotificationVisible.set(false), 4000);
			return;
		}
		// let currentUserToken = '';
		// if (currentUserId) {
		// 	currentUserToken = localStorage.getItem(`token-${currentUserId}`);
		// }

		try {
			const res = await fetch(`${baseUrl}/messages/${chatId}`, {
				method: 'GET',
				headers: {
					'Content-Type': 'application/json'
				}
			});

			let parsedMessages = [];

			// ⚠️ If chat is new (no messages yet), fallback to default
			if (!res.ok) {
				console.warn('New chat selected or messages not found. Showing default message.');

				parsedMessages = [{ sender: 'bot', text: 'Hi! How can I assist you today?' }];
			} else {
				const data = await res.json();
				console.log('Fetched chat messages:', data);

				// let result = data[0]; // result is an object with user_text + response_json
				// for (const result of data) {
				data.forEach((result, index) => {
					if (result && result.response_json && Array.isArray(result.response_json.data)) {
						parsedMessages.push(
							{ id: `user-${index}`, sender: 'user', text: result.user_text },
							{
								id: `bot-${index}`,
								sender: 'bot',
								ehrData: [
									{
										card_type: result.response_json.card_type,
										charts: result.response_json.charts,
										data: result.response_json.data
									}
								]
							}
						);
					}
					// else {
					// 	parsedMessages = [{ sender: 'bot', text: 'No valid data found for this chat.' }];
					// }
				});
				// Fallback if nothing valid parsed
				if (parsedMessages.length === 0) {
					parsedMessages = [
						{ id: 'bot-default', sender: 'bot', text: 'No valid data found for this chat.' }
					];
				}
				console.log('parsedMessages:', parsedMessages);
			}

			chats.update((c) =>
				c.map((chat) => (chat.id === chatId ? { ...chat, messages: parsedMessages } : chat))
			);

			activeChatId.set(chatId);
			localStorage.setItem(`last_active_chat_id-${currentUserId}`, chatId);
			messages.set(parsedMessages);

			await tick();
			scrollToBottom();
		} catch (error) {
			console.error('Error fetching messages:', error);
		}
	}

	async function updateChatTitle(chatId, newTitle) {
		//Todo5:-- Change title of chat
		// URL/chats/change_title
		// {
		//  "user_id": 1,
		//   "chat_id": 2,
		//   "new_title": "Latest Articles on Nephrology."
		// }

		const currentUserId = localStorage.getItem('user_id');
		const phone = localStorage.getItem(`user_phone-${currentUserId}`);

		if (!userId || !phone) {
			console.error('User info missing for updating title.');
			failedNotificationMessage.set('User details missing. Please log in again.');
			failedNotificationVisible.set(true);
			setTimeout(() => failedNotificationVisible.set(false), 4000);
			return;
		}
		// let currentUserToken = '';
		// if (currentUserId) {
		// 	currentUserToken = localStorage.getItem(`token-${currentUserId}`);
		// }

		try {
			const res = await fetch(`${baseUrl}/chats/change_title`, {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json'
				},
				body: JSON.stringify({
					phone,
					chat_id: chatId,
					new_title: newTitle
				})
			});

			if (!res.ok) throw new Error('Failed to update chat title');

			const data = await res.json();
			console.log('Title updated:', data);

			// Update local state
			chats.update((c) =>
				c.map((chat) =>
					chat.id === chatId ? { ...chat, title: data.new_title.slice(0, 25) } : chat
				)
			);
		} catch (error) {
			console.error('Error updating chat title:', error);
		}
	}

	async function sendMessage() {
		const currentUserId = localStorage.getItem('user_id');
		const phone = localStorage.getItem(`user_phone-${currentUserId}`);
		if (!phone) return;
		console.log('userid:', currentUserId, 'user phone:', phone);

		// let currentUserToken = '';
		// if (currentUserId) {
		// 	currentUserToken = localStorage.getItem(`token-${currentUserId}`);
		// }

		let currentUserInput;
		userInput.subscribe((v) => (currentUserInput = v))();
		if (!currentUserInput.trim()) return;

		let currentActiveChatId;
		activeChatId.subscribe((v) => (currentActiveChatId = v))();
		if (currentActiveChatId === null) return;

		let uid = currentUserId;
		// userId.subscribe((v) => (uid = v))();
		console.log('uid from send func:', uid);

		const userMsg = { sender: 'user', text: currentUserInput.trim() };
		messages.update((m) => [...m, userMsg]);
		updateChatTitle(currentActiveChatId, userMsg.text);
		userInput.set('');

		chats.update((c) =>
			c.map((chat) =>
				chat.id === currentActiveChatId ? { ...chat, messages: [...chat.messages, userMsg] } : chat
			)
		);

		const loadingMsg = { sender: 'bot', type: 'typing' };
		messages.update((m) => [...m, loadingMsg]);
		chats.update((c) =>
			c.map((chat) =>
				chat.id === currentActiveChatId
					? { ...chat, messages: [...chat.messages, loadingMsg] }
					: chat
			)
		);
		scrollToBottom();

		try {
			const response = await fetch(`${baseUrl}/ask_ehr`, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					question: userMsg.text,
					phone
				})
			});
			console.log('response:', response);

			const result = await response.json();
			console.log('result:', result);
			// return;

			// if (result?.card_type === 'carer-rx' && Array.isArray(result.data) && result.data.length) {
			if (result && Array.isArray(result.data) && result.data.length) {
				//Todo3:-- add message to database api calls here
				// "chat_id": 2,
				// "user_text": "I need some latest articles related to nephrology.",
				// "response_json": result

				// api:- URL/messages/
				// header should contain Authorization

				//Save user query and AI response in DB
				try {
					console.log('currentActiveChatId:', currentActiveChatId);
					console.log('userMsg text:', userMsg.text);
					console.log('result:', result);

					const saveRes = await fetch(`${baseUrl}/messages/`, {
						method: 'POST',
						headers: {
							'Content-Type': 'application/json'
						},
						body: JSON.stringify({
							chat_id: currentActiveChatId,
							user_text: userMsg.text,
							response_json: result // full result object
						})
					});
					console.log('Message saved to data base response:', saveRes);

					const saveData = await saveRes.json();
					console.log('Message saved to data base:', saveData);
				} catch (err) {
					console.error('Error saving message:', err);
				}

				// Show card data (rx details)
				const ehrResponse = [
					{
						card_type: result.card_type,
						charts: result.charts,
						data: result.data
					}
				];

				// const cards = ehrResponse?.map((article) => {
				// 	let finalCardUrl = article?.card_url;
				// 	if (!finalCardUrl && article.template_url && article.article_title) {
				// 		// fallback card URL generation (customize this logic if needed)
				// 		const encodedTitle = encodeURIComponent(article.article_title.replace(/\s+/g, '_'));
				// 		finalCardUrl = `${article.template_url.split('?')[0]}?title=${encodedTitle}`;
				// 	}

				// 	return `${article.article_title}\n [Read More](${article.article_url})\n Card: ${finalCardUrl}`;
				// });

				// const botMsg = { sender: 'bot', text: data.reply || 'Sorry, no response.' };
				const botMsg = { sender: 'bot', ehrData: ehrResponse || 'Sorry, no response.' };

				messages.update((m) => m.map((msg) => (msg.text === loadingMsg.text ? botMsg : msg)));
				chats.update((c) =>
					c.map((chat) => ({
						...chat,
						messages: chat.messages.map((msg) => (msg.text === loadingMsg.text ? botMsg : msg))
					}))
				);
			} else {
				const noDataMsg = { sender: 'bot', text: 'No data found for your query.' };
				messages.update((m) => m.map((msg) => (msg.text === loadingMsg.text ? noDataMsg : msg)));
				chats.update((c) =>
					c.map((chat) => ({
						...chat,
						messages: chat.messages.map((msg) => (msg.text === loadingMsg.text ? noDataMsg : msg))
					}))
				);
			}
		} catch (err) {
			console.error('API Error:', err);
			const errorMsg = { sender: 'bot', text: 'No data found for your query.' };

			messages.update((m) => m.map((msg) => (msg.text === loadingMsg.text ? errorMsg : msg)));
			chats.update((c) =>
				c.map((chat) => ({
					...chat,
					messages: chat.messages.map((msg) => (msg.text === loadingMsg.text ? errorMsg : msg))
				}))
			);
		}
		scrollToBottom();
	}

	function scrollToBottom() {
		if (chatContainer) {
			chatContainer.scrollTop = chatContainer.scrollHeight;
		}
	}

	async function deleteChat(chatId) {
		const currentUserId = localStorage.getItem('user_id');
		const phone = localStorage.getItem(`user_phone-${currentUserId}`);
		// let currentUserToken = '';
		// if (currentUserId) {
		// 	currentUserToken = localStorage.getItem(`token-${currentUserId}`);
		// }

		// Check if only one chat remains
		const currentChats = get(chats);
		if (currentChats.length <= 1) {
			failedNotificationMessage.set('At least one chat must remain.');
			failedNotificationVisible.set(true);
			setTimeout(() => failedNotificationVisible.set(false), 4000);
			return;
		}

		// If user is NOT logged in, delete locally only
		if (!currentUserId || !phone) {
			failedNotificationMessage.set('User details missing. Please log in again.');
			failedNotificationVisible.set(true);
			setTimeout(() => failedNotificationVisible.set(false), 4000);
			return;
		}

		// Logged-in user — delete from backend
		try {
			const response = await fetch(`${baseUrl}/chats/delete_chat`, {
				method: 'DELETE',
				headers: {
					'Content-Type': 'application/json'
				},
				body: JSON.stringify({
					phone,
					chat_id: chatId
				})
			});
			console.log('response:', response);

			const data = await response.json();
			console.log('Chat delete API response:', data);

			if (response.ok && Array.isArray(data) && data[0] === 'Chat deleted successfully') {
				chats.update((prev) => {
					const filteredChats = prev.filter((chat) => chat.id !== chatId);

					let currentActiveId;
					activeChatId.subscribe((v) => (currentActiveId = v))();

					if (chatId === currentActiveId) {
						activeChatId.set(filteredChats[0]?.id || null);
						messages.set(filteredChats[0]?.messages || []);
					}

					return filteredChats;
				});
			} else {
				throw new Error('Failed to delete chat from server');
			}
		} catch (error) {
			console.error('Delete chat error:', error);
			failedNotificationMessage.set('Failed to delete chat.');
			failedNotificationVisible.set(true);
			setTimeout(() => failedNotificationVisible.set(false), 4000);
		}
	}

	function autoResize(e) {
		const textarea = e.target;
		textarea.style.height = 'auto';
		textarea.style.height = `${textarea.scrollHeight}px`;
	}

	let expandedCards = new Set();

	function toggleCard(index) {
		if (expandedCards.has(index)) {
			expandedCards.delete(index);
		} else {
			expandedCards.add(index);
		}
		// Force reactive update
		expandedCards = new Set(expandedCards);
	}

	let selectedSub = '';
	const categories = {
		Lab: {
			color: 'bg-cyan-500',
			subCategories: ['Lab Report', 'Lab Invoice']
		},
		Rx: {
			color: 'bg-blue-500',
			subCategories: ['Rx Prescription', 'Rx Invoice']
		}
	};

	let phone = '9991482622';

	const apiMap = {
		'Lab Report': `${baseUrl}/user_reports/${phone}`,
		'Lab Invoice': `${baseUrl}/user_bills_with_lab/${phone}`,
		'Rx Invoice': `${baseUrl}/user_rx_invoices/${phone}`,
		'Rx Prescription': `${baseUrl}/user_rx_prescriptions/${phone}`
	};

	$: if (selectedSub && apiMap[selectedSub]) {
		fetchCategoryData(selectedSub);
	}

	async function fetchCategoryData(category) {
		try {
			const res = await fetch(apiMap[category]);
			const data = await res.json();

			console.log('raw data:', data);

			if (res.ok) {
				const typedData = data.map((entry) => {
					if (entry.type && entry.data) return entry;
					return {
						type: category.replace(/\s/g, '_'),
						data: entry
					};
				});

				ehrData.set(typedData);
				console.log('✅ Normalized category data:', typedData);
			} else {
				console.error('❌ Error fetching EHR data:', data);
			}
		} catch (err) {
			console.error('🚨 Fetch error:', err);
		}
	}
</script>

<!-- <FailedNotification /> -->
<FailedNotification message={$failedNotificationMessage} visible={$failedNotificationVisible} />
<!-- Login Popup -->
<LoginPopNotification visible={showLoginPopup} />

<div class="flex min-h-[100dvh] flex-col font-sans md:hidden">
	<!-- HEADER: Calendar + Toggle -->
	<div
		class="fixed top-0 right-0 left-0 z-10 flex items-center justify-between bg-white px-2 py-4 shadow dark:bg-gray-800"
	>
		<button
			aria-label="drawer button"
			on:click={() => showMobileDrawer.set(!$showMobileDrawer)}
			class="text-gray-700 dark:text-white"
		>
			<i class="fas fa-bars text-xl"></i>
		</button>
		<!-- Calendar (only in classical view) -->
		{#if $isMobileView === 'classical'}
			<div class="relative flex w-fit items-center text-xs">
				<input
					type="text"
					placeholder="Select range"
					class="w-full rounded-lg border p-2 pr-6 focus:ring-0 focus:outline-none active:right-0 dark:border-gray-600 dark:bg-gray-800 dark:text-white"
					bind:this={calendarRef}
					readonly
				/>
				<!-- Calendar Icon -->
				<i class="fas fa-calendar-alt pointer-events-none absolute top-3 right-3 text-gray-500"></i>
			</div>
		{/if}
		<div class="flex items-center justify-between gap-2">
			<button
				on:click={() => isMobileView.set($isMobileView === 'classical' ? 'assisted' : 'classical')}
				class="rounded-md bg-blue-500 px-2 py-2 text-sm text-gray-700 hover:bg-blue-600 active:bg-blue-600 active:text-white dark:text-white"
			>
				{$isMobileView === 'classical' ? 'Assisted' : 'Classical'}
			</button>

			<!-- User Component -->
			<UserDropdown bind:showDropdown toggleDropdown={() => (showDropdown = !showDropdown)} />
		</div>
	</div>

	<!-- CLASSICAL VIEW -->
	{#if $isMobileView === 'classical'}
		<div class="flex-1 overflow-y-auto bg-gray-100 p-1 pt-[12vh] dark:bg-gray-900">
			<!-- Loader -->
			{#if $ehrData.length === 0}
				<div class="flex h-[60vh] items-center justify-center">
					<div
						class="h-10 w-10 animate-spin rounded-full border-4 border-blue-500 border-t-transparent"
					></div>
				</div>
			{:else}
				<!-- RX SECTION -->
				{#if rxInvoices?.length > 0 || rxPrescriptions?.length > 0}
					<h2 class="mb-2 text-lg font-bold text-blue-500">🧾 Rx Records :</h2>

					<!-- Rx Invoices -->
					{#if rxInvoices.length > 0}
						<div
							class="mb-2 rounded-lg border border-blue-200 bg-blue-50 p-2 dark:border-blue-700 dark:bg-blue-950"
						>
							<h3 class="text-base font-semibold text-blue-700 dark:text-blue-300">
								<i class="fas fa-file-invoice text-gray-700 dark:text-gray-200"></i> Rx Invoices
							</h3>
						</div>
						{#each rxInvoices as item}
							<RxInvoiceCard {item} />
						{/each}
					{/if}

					<!-- Rx Prescriptions -->
					{#if rxPrescriptions.length > 0}
						<div
							class="mb-2 rounded-lg border border-blue-200 bg-blue-50 p-2 dark:border-blue-700 dark:bg-blue-950"
						>
							<h3 class="text-base font-semibold text-blue-700 dark:text-blue-300">
								<i class="fas fa-notes-medical text-gray-700 dark:text-gray-200"></i> Rx Prescriptions
							</h3>
						</div>
						{#each rxPrescriptions as item}
							<RxPrescriptionCard {item} />
						{/each}
					{/if}
				{/if}

				<!-- LAB SECTION -->
				{#if labReports.length > 0 || labInvoices.length > 0}
					<h2 class="mt-4 mb-2 text-lg font-bold text-teal-400">🧪 Lab Records :</h2>

					{#if labReports.length > 0}
						<div
							class="mb-2 rounded-lg border border-cyan-200 bg-cyan-50 p-2 dark:border-cyan-700 dark:bg-cyan-950"
						>
							<h3 class="text-base font-semibold text-cyan-700 dark:text-cyan-300">
								<i class="fas fa-file-medical-alt text-gray-700 dark:text-gray-200"></i> Lab Report
							</h3>
						</div>
						<!-- Lab Reports -->
						{#each labReports as item}
							<LabReportCard {item} />
						{/each}
					{/if}

					{#if labInvoices.length > 0}
						<div
							class="mb-2 rounded-lg border border-cyan-200 bg-cyan-50 p-2 dark:border-cyan-700 dark:bg-cyan-950"
						>
							<h3 class="text-base font-semibold text-cyan-700 dark:text-cyan-300">
								<i class="fas fa-file-invoice text-gray-700 dark:text-gray-200"></i> Lab Invoices
							</h3>
						</div>
						<!-- Lab Invoices -->
						{#each labInvoices as item}
							<LabInvoiceCard {item} />
						{/each}
					{/if}
				{/if}
			{/if}
		</div>
	{/if}

	<!-- ASSISTED VIEW (ChatGPT-like) -->
	{#if $isMobileView === 'assisted'}
		<div class="relative flex flex-1 flex-col bg-white dark:bg-gray-900">
			<!-- Chat area -->
			<div
				class="h-auto max-h-[79vh] flex-1 overflow-y-auto p-2 py-2 pt-[12vh]"
				bind:this={chatContainer}
			>
				{#each $messages as msg}
					{#if msg.ehrData}
						{#each msg.ehrData as responseItem}
							{#if responseItem.card_type === 'carer-rx'}
								{#if responseItem.data?.[0]?.rx_invoice_number}
									<div
										class="mt-4 mb-2 rounded-lg border border-blue-200 bg-blue-50 p-2 dark:border-blue-700 dark:bg-blue-950"
									>
										<h3 class="text-base font-semibold text-blue-700 dark:text-blue-300">
											<i class="fas fa-file-invoice text-gray-700 dark:text-gray-200"></i> Rx Invoices
										</h3>
									</div>
									<CarerRxInvoiceCard data={responseItem.data} />
								{:else if responseItem.data?.[0]?.rx_prescription_number}
									<div
										class="mt-4 mb-2 rounded-lg border border-blue-200 bg-blue-50 p-2 dark:border-blue-700 dark:bg-blue-950"
									>
										<h3 class="text-base font-semibold text-blue-700 dark:text-blue-300">
											<i class="fas fa-notes-medical text-gray-700 dark:text-gray-200"></i> Rx Prescriptions
										</h3>
									</div>
									<CarerRxPrescriptionCard data={responseItem.data} />
								{:else}
									<p class="text-red-500">⚠️ Unknown rx data structure</p>
								{/if}
							{:else if responseItem.card_type === 'carer-lab'}
								{#if responseItem.charts}
									<!-- 🟦 Lab Chart Card -->
									<div
										class="mt-4 mb-2 rounded-lg border border-cyan-200 bg-cyan-50 p-2 dark:border-cyan-700 dark:bg-cyan-950"
									>
										<h3 class="text-base font-semibold text-cyan-700 dark:text-cyan-300">
											📈 Lab Test Chart
										</h3>
									</div>
									<CarerLabChartCard data={responseItem.data} />
								{:else if responseItem.data?.[0]?.bill_number}
									<div
										class="mt-4 mb-2 rounded-lg border border-cyan-200 bg-cyan-50 p-2 dark:border-cyan-700 dark:bg-cyan-950"
									>
										<h3 class="text-base font-semibold text-cyan-700 dark:text-cyan-300">
											<i class="fas fa-file-invoice text-gray-700 dark:text-gray-200"></i> Lab Invoices
										</h3>
									</div>
									<CarerLabInvoiceCard data={responseItem.data} />
								{:else if responseItem.data?.[0]?.report_number}
									<div
										class="mt-4 mb-2 rounded-lg border border-cyan-200 bg-cyan-50 p-2 dark:border-cyan-700 dark:bg-cyan-950"
									>
										<h3 class="text-base font-semibold text-cyan-700 dark:text-cyan-300">
											<i class="fas fa-file-medical-alt text-gray-700 dark:text-gray-200"></i> Lab Report
										</h3>
									</div>
									<CarerLabReportCard data={responseItem.data} />
								{:else}
									<p class="text-red-500">⚠️ Unknown lab data structure</p>
								{/if}
							{:else}
								<p class="text-red-500">Unknown card type: {responseItem.card_type}</p>
							{/if}
						{/each}
					{:else if msg.type === 'typing'}
						<!-- Typing animation -->
						<div
							class="my-2 w-fit max-w-[75%] rounded-lg bg-gray-200 p-3 text-sm dark:bg-gray-700 dark:text-white"
						>
							<span class="flex items-center gap-1 space-x-1">
								<span>Thinking</span>
								<span class="typing-dots flex items-center space-x-1">
									<span class="dot"></span>
									<span class="dot"></span>
									<span class="dot"></span>
								</span>
							</span>
						</div>
					{:else}
						<!-- Regular text message -->
						<div
							class={`my-2 w-fit max-w-[75%] rounded-lg p-3 text-sm ${
								msg.sender === 'user'
									? 'ml-auto bg-blue-500 text-white'
									: 'bg-gray-200 dark:bg-gray-700 dark:text-white'
							}`}
						>
							{msg.text}
						</div>
					{/if}
				{/each}
			</div>

			<!-- Input -->
			<div class="absolute bottom-0 mb-3 flex w-full flex-col items-center p-2">
				<div
					class="relative flex w-full flex-col items-center justify-between rounded-3xl border bg-white focus:ring-0 focus:outline-none dark:border-gray-600 dark:bg-gray-800 dark:text-white"
				>
					<div class="w-full">
						<textarea
							bind:value={$userInput}
							rows="1"
							placeholder="Ask something..."
							class="w-full resize-none p-3 focus:ring-0 focus:outline-none active:ring-0"
							style="overflow: hidden;"
							on:input={(e) => {
								autoResize(e);
								scrollToBottom(); // scroll after resize
							}}
							on:keydown={(e) => {
								if (e.key === 'Enter' && !e.shiftKey) {
									e.preventDefault(); // ⛔ prevent the new line
									sendMessage();
								}
							}}
						></textarea>
					</div>

					<div class="flex w-full items-center justify-between gap-2 px-4 py-1">
						<!-- Mic button -->
						<button aria-label="mic button" class="text-gray-500 hover:text-blue-500">
							<i class="fas fa-microphone text-xl"></i>
						</button>
						<button
							on:click={sendMessage}
							aria-label="send message button"
							class="ml-2 rounded-full bg-blue-500 px-3.5 py-2 text-white hover:bg-blue-600 active:bg-blue-600"
						>
							<i class="fas fa-arrow-up"></i>
						</button>
					</div>
				</div>
			</div>
		</div>
	{/if}

	{#if $showMobileDrawer}
		<div
			in:fly={{ x: -300, duration: 300 }}
			out:fly={{ x: -300, duration: 300 }}
			class="fixed top-0 left-0 z-50 flex min-h-[100dvh] w-[75%] max-w-xs flex-col bg-white shadow-lg dark:bg-gray-900"
		>
			<!-- Header -->
			<div class="flex items-center justify-between p-4">
				<h3 class="text-lg font-semibold text-gray-800 dark:text-white">EHR</h3>
				<button on:click={() => showMobileDrawer.set(false)} aria-label="close drawer">
					<i class="fas fa-times text-lg text-gray-600 dark:text-white"></i>
				</button>
			</div>

			<!-- Main Body: Flex container for saved + history -->
			<div class="flex h-full flex-1 flex-col">
				{#if $isMobileView === 'assisted'}
					<div class="max-h-[80vh] p-2 pt-0">
						<!-- New Chat -->
						<div class="p-2 pb-3">
							<button
								on:click={initializeNewChat}
								class="w-full rounded bg-blue-500 px-4 py-2 text-white hover:bg-blue-600"
							>
								+ New Chat
							</button>
						</div>

						<div class="chat-container max-h-[70vh] overflow-y-auto">
							<!-- Chat History -->
							{#each $chats.filter((c) => c?.id !== undefined) as chat (chat.id)}
								<div
									class="my-2 flex items-center justify-between rounded bg-white p-3 shadow-sm dark:bg-gray-700 {chat.id ===
									$activeChatId
										? 'border-l-4 border-blue-500'
										: ''}"
								>
									<button
										on:click={() => {
											selectChat(chat.id);
											showMobileDrawer.set(false);
										}}
										class="flex-1 truncate text-left text-gray-700 dark:text-white"
									>
										{chat.title}
									</button>

									<!-- 3-dots menu -->
									<div class="relative z-10 ml-2">
										<button
											aria-label="chat action button"
											on:click={(e) => {
												const btn = e.currentTarget;
												const rect = btn.getBoundingClientRect();
												const container = btn.closest('.chat-container');
												if (!container) return;
												const containerRect = container.getBoundingClientRect();

												const spaceBelow = containerRect.bottom - rect.bottom;
												const spaceAbove = rect.top - containerRect.top;

												dropdownPosition =
													spaceBelow < 100 && spaceAbove > spaceBelow ? 'top' : 'bottom';
												menuChatId = menuChatId === chat.id ? null : chat.id;
											}}
											class="text-gray-600 hover:text-gray-800 dark:text-white"
										>
											<i class="fas fa-ellipsis-v"></i>
										</button>

										<!-- Dropdown -->
										{#if menuChatId === chat.id}
											<div
												class={`absolute z-30 flex w-fit items-center justify-between gap-2 rounded-md bg-white px-2 py-1 shadow-lg dark:bg-gray-800 ${
													$user.phone
														? dropdownPosition === 'top'
															? 'bottom-0'
															: 'top-0'
														: dropdownPosition === 'top'
															? 'bottom-0'
															: '-top-2'
												} right-3`}
											>
												{#if $user.phone}
													<!-- Rename -->
													<button
														aria-label="rename button"
														class="my-1 block w-full rounded-md border border-gray-200 px-3 py-1 text-left text-sm text-gray-700 hover:bg-gray-100 dark:text-white dark:hover:bg-gray-700"
														on:click={() => {
															renamingChatId = chat.id;
															newTitle = chat.title;
															menuChatId = null;
														}}
													>
														<i class="fas fa-edit"></i>
													</button>
												{/if}
												<!-- Delete -->
												<button
													aria-label="delete button"
													class="block w-full rounded-md border border-gray-200 px-3 py-1 text-left text-sm text-red-500 hover:bg-gray-100 dark:hover:bg-gray-700"
													on:click={() => {
														deleteChat(chat.id);
														menuChatId = null;
													}}
												>
													<i class="fas fa-trash-alt"></i>
												</button>
											</div>
										{/if}
									</div>
								</div>
								<!-- Rename input UI below the chat item -->
								{#if renamingChatId === chat.id}
									<div class="mt-1 flex items-center gap-2 px-2">
										<input
											type="text"
											bind:value={newTitle}
											class="w-full rounded border px-2 py-1 text-sm text-gray-800 dark:bg-gray-900 dark:text-white"
											placeholder="Enter new title"
										/>
										<button
											class="rounded bg-blue-500 px-2 py-1 text-sm text-white hover:bg-blue-600"
											on:click={async () => {
												await updateChatTitle(chat.id, newTitle);
												renamingChatId = null;
											}}
										>
											Save
										</button>
										<button
											class="rounded bg-gray-300 px-2 py-1 text-sm hover:bg-gray-400 dark:bg-gray-700 dark:text-white"
											on:click={() => (renamingChatId = null)}
										>
											Cancel
										</button>
									</div>
								{/if}
							{/each}
						</div>
					</div>
				{:else}
					<!-- ALL CATEGORIES DISPLAYED TOGETHER -->
					<div class="space-y-6 p-4">
						<!-- 🔁 RESET BUTTON -->
						<div class="flex">
							<button
								class="rounded-xl bg-blue-500 px-3 py-1.5 text-sm font-medium text-white shadow-sm transition-all hover:bg-blue-600"
								on:click={async () => {
									selectedSub = '';
									localStorage.removeItem('selectedSub');
									await fetchEhrData(); // 👈 default full fetch function
								}}
							>
								<!-- Reset Filters -->
								<i class="fas fa-rotate-right text-gray-700 dark:text-gray-200"></i>
							</button>
						</div>

						{#each Object.entries(categories) as [mainCategory, { color, subCategories }]}
							<div>
								<h4
									class="mb-3 flex items-center text-base font-semibold text-gray-700 dark:text-gray-200"
								>
									{mainCategory}
									<span class={`ml-2 inline-block h-4 w-4 rounded-full ${color}`}></span>
								</h4>
								<div class="flex flex-wrap gap-3">
									{#each subCategories as sub}
										<button
											class={`rounded-xl border px-4 py-2 text-sm font-medium transition-all
						${
							selectedSub === sub
								? 'border-transparent bg-blue-500 text-white'
								: 'border-gray-300 bg-white text-gray-700 hover:border-transparent hover:bg-blue-500 hover:text-white dark:border-gray-700 dark:bg-gray-900 dark:text-gray-300 dark:hover:bg-blue-500 dark:hover:text-white'
						}
					                        `}
											on:click={() => {
												selectedSub = sub;
												localStorage.setItem('selectedSub', sub);
												console.log('Selected Subcategory:', sub);
											}}
										>
											{sub}
										</button>
									{/each}
								</div>
							</div>
						{/each}
					</div>
				{/if}
			</div>
		</div>
	{/if}
</div>

<style>
	.transition-max-height {
		transition: max-height 0.8s ease-in-out;
	}

	.typing-dots {
		display: flex;
		align-items: center;
		justify-content: start;
		gap: 4px;
	}

	.typing-dots .dot {
		width: 6px;
		height: 6px;
		border-radius: 50%;
		animation: blink 1.4s infinite both;
	}

	/* Light Mode */
	@media (prefers-color-scheme: light) {
		.typing-dots .dot {
			background-color: #333;
		}
	}

	/* Dark Mode */
	@media (prefers-color-scheme: dark) {
		.typing-dots .dot {
			background-color: white;
		}
	}

	.typing-dots .dot:nth-child(1) {
		animation-delay: 0s;
	}
	.typing-dots .dot:nth-child(2) {
		animation-delay: 0.2s;
	}
	.typing-dots .dot:nth-child(3) {
		animation-delay: 0.4s;
	}

	@keyframes blink {
		0% {
			opacity: 0.2;
			transform: scale(1);
		}
		50% {
			opacity: 1;
			transform: scale(1.3);
		}
		100% {
			opacity: 0.2;
			transform: scale(1);
		}
	}
</style>
