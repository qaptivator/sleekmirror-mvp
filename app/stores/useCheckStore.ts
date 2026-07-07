import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { useFileStore } from './useFileStore'

interface Category {
	score: number
	feedback: string
	fix: string
}

interface Check {
	_id: string
	file: string
	context_tag: string
	overall_score: number
	verdict_headline: string
	categories: {
		outfit: Category
		grooming: Category
		presentation: Category
	}
	action_checklist: string[]
	createdAt: string
	updatedAt: string
}

interface CheckRunRequest {
	fileId: string
	contextTag: string
}

interface CheckRunResponse {
	checkId: string
	check: Check
}

export const useCheckStore = defineStore('checks', () => {
	// State
	const checks = ref<Map<string, Check>>(new Map())
	const checksByFile = ref<Map<string, string[]>>(new Map())
	const loading = ref(false)
	const error = ref<string | null>(null)
	const runningCheckFileId = ref<string | null>(null)

	// Computed
	const checkCount = computed(() => checks.value.size)
	const isRunningCheck = computed(() => runningCheckFileId.value !== null)

	// Get all checks for a file
	const getFileChecks = (fileId: string): Check[] => {
		const checkIds = checksByFile.value.get(fileId) || []
		return checkIds
			.map((id) => checks.value.get(id))
			.filter((check): check is Check => check !== undefined)
	}

	// Get a single check by ID
	const getCheck = (checkId: string): Check | undefined => {
		return checks.value.get(checkId)
	}

	// Fetch a specific check from server
	const fetchCheck = async (checkId: string): Promise<Check> => {
		// Check if already cached
		const cached = checks.value.get(checkId)
		if (cached) {
			return cached
		}

		error.value = null

		try {
			const check = await $fetch<Check>(`/api/checks/${checkId}`)

			// Cache the check
			checks.value.set(checkId, check)

			// Add to file's check list
			const fileCheckIds = checksByFile.value.get(check.file) || []
			if (!fileCheckIds.includes(checkId)) {
				fileCheckIds.push(checkId)
				checksByFile.value.set(check.file, fileCheckIds)
			}

			return check
		} catch (err) {
			error.value = err instanceof Error ? err.message : 'Failed to fetch check'
			throw err
		}
	}

	// Run a check on a file
	const runCheck = async (fileId: string, contextTag: string): Promise<Check> => {
		// Prevent multiple simultaneous checks
		if (runningCheckFileId.value !== null) {
			throw new Error('A check is already running. Please wait for it to complete.')
		}

		runningCheckFileId.value = fileId
		error.value = null

		try {
			// Verify file exists (will sync from server if needed)
			const fileStore = useFileStore()
			await fileStore.getFileMetadata(fileId)

			const response = await $fetch<CheckRunResponse>('/api/checks/run', {
				method: 'POST',
				body: {
					fileId,
					contextTag,
				},
			})

			const check = response.check

			// Cache the check
			checks.value.set(check._id, check)

			// Add to file's check list
			const fileCheckIds = checksByFile.value.get(fileId) || []
			if (!fileCheckIds.includes(check._id)) {
				fileCheckIds.push(check._id)
				checksByFile.value.set(fileId, fileCheckIds)
			}

			return check
		} catch (err) {
			error.value = err instanceof Error ? err.message : 'Failed to run check'
			throw err
		} finally {
			runningCheckFileId.value = null
		}
	}

	// Clear cache for a specific file's checks
	const clearFileChecksCache = (fileId: string) => {
		const checkIds = checksByFile.value.get(fileId) || []
		for (const checkId of checkIds) {
			checks.value.delete(checkId)
		}
		checksByFile.value.delete(fileId)
	}

	// Clear all checks cache
	const clearCache = () => {
		checks.value.clear()
		checksByFile.value.clear()
	}

	// Sync checks from server for a file (authority is server)
	const syncFileChecks = async (fileId: string): Promise<Check[]> => {
		// Note: Currently the server doesn't provide a bulk fetch endpoint for checks
		// This would be a good feature to add. For now, we rely on fetching individual checks
		return getFileChecks(fileId)
	}

	return {
		// State
		checks,
		checksByFile,
		loading,
		error,
		runningCheckFileId,

		// Computed
		checkCount,
		isRunningCheck,

		// Methods
		getFileChecks,
		getCheck,
		fetchCheck,
		runCheck,
		clearFileChecksCache,
		clearCache,
		syncFileChecks,
	}
})
