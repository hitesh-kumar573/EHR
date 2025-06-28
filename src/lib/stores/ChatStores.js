// src/lib/stores.js
//@ts-nocheck
import { writable } from 'svelte/store';

export const messages = writable([]);
export const chats = writable([]);
export const savedPosts = writable([]);
export const userInput = writable('');
export const activeChatId = writable(null);
export const chatIdCounter = writable(0);
export const failedNotificationVisible = writable(false);
export const failedNotificationMessage = writable('');
export const showMobileDrawer = writable(false);
export const startDate = writable('');
export const endDate = writable('');

export const journalSpecializations = writable([]);
export const newsSpecializations = writable([]);

// export const isMobileView = writable('classical');

let initialView = 'classical';
// Get from localStorage or fallback to 'classical'
if (typeof window !== 'undefined') {
	const storedView = localStorage.getItem('mobileView');
	if (storedView) {
		initialView = storedView;
	}
}

export const isMobileView = writable(initialView);

if (typeof window !== 'undefined') {
	isMobileView.subscribe((value) => {
		localStorage.setItem('mobileView', value);
	});
}

export const journalData = writable([]); // to hold fetched data
export const userId = writable('1'); // Assuming default or dynamic user ID

let initialUser = {
	id: null,
	// name: null,
	// email: null,
	// token: null,
	phone: null,
	age: null,
	gender: null,
	address: null
};

// ✅ Check if running in browser
if (typeof window !== 'undefined') {
	const userId = localStorage.getItem('user_id');

	if (userId) {
		initialUser = {
			id: userId,
			phone: localStorage.getItem(`user_phone-${userId}`) || null,
			age: localStorage.getItem(`user_age-${userId}`) || null,
			gender: localStorage.getItem(`user_gender-${userId}`) || null,
			address: localStorage.getItem(`user_address-${userId}`) || null
			// name: localStorage.getItem(`user_name-${userId}`) || null,
			// email: localStorage.getItem(`user_email-${userId}`) || null,
			// token: localStorage.getItem(`token-${userId}`) || null
		};
		console.log('user from stores:', initialUser);
	}
}

export const user = writable(initialUser);

export const ehrData = writable([]);
