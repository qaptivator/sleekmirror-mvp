import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { AI_PHOTO_CONSENT_VERSION } from '#shared/utils/consent'

interface User {
	_id: string
	identifiers: string[]
	email?: string
	emailVerified?: boolean
	credits: number
	firstName?: string
	lastName?: string
	aiPhotoConsent?: boolean
	aiPhotoConsentAt?: string | null
	consentVersion?: string | null
	createdAt?: string
	updatedAt?: string
}

const USER_CACHE_KEY = 'sleekmirror.user'

function persistUser(user: User | null) {
	if (!import.meta.client) return
	if (user) localStorage.setItem(USER_CACHE_KEY, JSON.stringify(user))
	else localStorage.removeItem(USER_CACHE_KEY)
}

export const useUserStore = defineStore('user', () => {
	// State
	const currentUser = ref<User | null>(null)
	const loading = ref(false)
	const error = ref<string | null>(null)

	// Computed
	const isAuthenticated = computed(() => currentUser.value !== null)
	const credits = computed(() => currentUser.value?.credits ?? 0)
	const hasAiPhotoConsent = computed(
		() =>
			currentUser.value?.aiPhotoConsent === true &&
			currentUser.value?.consentVersion === AI_PHOTO_CONSENT_VERSION
	)
	const consentPromptDismissed = ref(false)

	const dismissConsentPrompt = () => {
		consentPromptDismissed.value = true
	}
	const fullName = computed(() => {
		if (!currentUser.value) return ''
		const { firstName, lastName } = currentUser.value
		return [firstName, lastName].filter(Boolean).join(' ').trim() || 'User'
	})

	// Fetch user by identifier
	const fetchUser = async (identifier: string): Promise<User> => {
		loading.value = true
		error.value = null

		try {
			const response = await useApi<User>('/api/users', {
				query: {
					identifier,
				},
			})

			setUser(response)
			return response
		} catch (err) {
			error.value = err instanceof Error ? err.message : 'Failed to fetch user'
			throw err
		} finally {
			loading.value = false
		}
	}

	// Update user in cache when server updates occur
	const updateUserCache = (updatedUser: User) => {
		if (currentUser.value?._id === updatedUser._id) {
			currentUser.value = updatedUser
			persistUser(currentUser.value)
		}
	}

	// Update credits in cache (after check/deduction)
	const updateCredits = (newCredits: number) => {
		if (currentUser.value) {
			currentUser.value.credits = newCredits
			persistUser(currentUser.value)
		}
	}

	// Set user (from login)
	const setUser = (user: User) => {
		currentUser.value = user
		persistUser(user)
		if (
			user.aiPhotoConsent === true &&
			user.consentVersion === AI_PHOTO_CONSENT_VERSION
		) {
			consentPromptDismissed.value = false
		}
	}

	const loadCachedUser = (): User | null => {
		if (!import.meta.client) return null
		try {
			const raw = localStorage.getItem(USER_CACHE_KEY)
			if (!raw) return null
			const parsed = JSON.parse(raw) as User
			if (!parsed?._id) return null
			return parsed
		} catch {
			return null
		}
	}

	// Clear user (logout)
	const clearUser = () => {
		currentUser.value = null
		consentPromptDismissed.value = false
		persistUser(null)
	}

	// Get current user credits
	const getCredits = (): number => {
		return currentUser.value?.credits ?? 0
	}

	// Check if user has enough credits for a check
	const hasEnoughCredits = (requiredCredits: number = 1): boolean => {
		return getCredits() >= requiredCredits
	}

	return {
		// State
		currentUser,
		loading,
		error,

		// Computed
		isAuthenticated,
		credits,
		hasAiPhotoConsent,
		consentPromptDismissed,
		fullName,

		// Methods
		fetchUser,
		updateUserCache,
		updateCredits,
		setUser,
		dismissConsentPrompt,
		loadCachedUser,
		clearUser,
		getCredits,
		hasEnoughCredits,
	}
})
