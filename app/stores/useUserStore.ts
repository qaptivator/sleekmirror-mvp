import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

interface User {
	_id: string
	identifiers: string[]
	credits: number
	firstName?: string
	lastName?: string
	createdAt: string
	updatedAt: string
}

export const useUserStore = defineStore('user', () => {
	// State
	const currentUser = ref<User | null>(null)
	const loading = ref(false)
	const error = ref<string | null>(null)

	// Computed
	const isAuthenticated = computed(() => currentUser.value !== null)
	const credits = computed(() => currentUser.value?.credits ?? 0)
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
			const response = await $fetch<User>('/api/users', {
				query: {
					identifier,
				},
			})

			currentUser.value = response
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
		}
	}

	// Update credits in cache (after check/deduction)
	const updateCredits = (newCredits: number) => {
		if (currentUser.value) {
			currentUser.value.credits = newCredits
		}
	}

	// Clear user (logout)
	const clearUser = () => {
		currentUser.value = null
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
		fullName,

		// Methods
		fetchUser,
		updateUserCache,
		updateCredits,
		clearUser,
		getCredits,
		hasEnoughCredits,
	}
})
