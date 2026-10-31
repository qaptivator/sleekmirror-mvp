import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { useFileStore } from './useFileStore'

interface Category {
	score: number
	feedback: string
	fix: string
}

export interface Check {
	_id: string
	user: string
	file: string
	contextTag: string
	overallScore: number
	verdictHeadline: string
	categories: {
		outfit: Category
		grooming: Category
		presentation: Category
	}
	actionChecklist: string[]
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
	const checksList = ref<Check[]>([])
	const thumbnails = ref<Record<string, string>>({})
	const listLoading = ref(false)
	const listError = ref<string | null>(null)
	let listRequest: Promise<void> | null = null

	// Computed
	const checkCount = computed(() => checks.value.size)
	const recentChecks = computed(() => checksList.value.slice(0, 4))
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
			const check = await useApi<Check>(`/api/checks/${checkId}`)

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

	function rememberCheck(check: Check) {
		checks.value.set(check._id, check)
		const fileCheckIds = checksByFile.value.get(check.file) || []
		if (!fileCheckIds.includes(check._id)) {
			fileCheckIds.push(check._id)
			checksByFile.value.set(check.file, fileCheckIds)
		}
		const without = checksList.value.filter((item) => item._id !== check._id)
		checksList.value = [check, ...without].sort(
			(a, b) =>
				new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
		)
	}

	async function ensureThumbnails(fileIds: string[]) {
		const missing = [...new Set(fileIds)].filter(
			(fileId) => fileId && !thumbnails.value[fileId]
		)
		await Promise.all(
			missing.map(async (fileId) => {
				try {
					const blob = await useApi<Blob>(`/api/files/${fileId}/file`, {
						responseType: 'blob',
					})
					thumbnails.value = {
						...thumbnails.value,
						[fileId]: URL.createObjectURL(blob),
					}
				} catch {
					// Card keeps the camera placeholder.
				}
			})
		)
	}

	// Home and history both read checksList. Call this on enter so a scan
	// that happened on another screen shows up without a second cache.
	async function loadChecks() {
		if (listRequest) return listRequest

		const firstLoad = checksList.value.length === 0
		if (firstLoad) listLoading.value = true
		listError.value = null

		listRequest = (async () => {
			try {
				const list = await useApi<Check[]>('/api/checks')
				const merged = new Map(checksList.value.map((check) => [check._id, check]))
				for (const check of list) merged.set(check._id, check)
				checksList.value = [...merged.values()].sort(
					(a, b) =>
						new Date(b.createdAt).getTime() -
						new Date(a.createdAt).getTime()
				)
				for (const check of checksList.value) {
					checks.value.set(check._id, check)
				}
				await ensureThumbnails(checksList.value.map((check) => check.file))
			} catch (err) {
				listError.value =
					err instanceof Error ? err.message : 'Failed to load checks'
			} finally {
				listLoading.value = false
				listRequest = null
			}
		})()

		return listRequest
	}

	// Run a check on a file
	const runCheck = async (
		fileId: string,
		contextTag: string
	): Promise<Check> => {
		// Prevent multiple simultaneous checks
		if (runningCheckFileId.value !== null) {
			throw new Error(
				'A check is already running. Please wait for it to complete.'
			)
		}

		runningCheckFileId.value = fileId
		error.value = null

		try {
			// Verify file exists (will sync from server if needed)
			const fileStore = useFileStore()
			await fileStore.getFileMetadata(fileId)

			const response = await useApi<Check>('/api/checks/run', {
				method: 'POST',
				body: {
					fileId,
					contextTag,
				},
			})

			const check = response

			rememberCheck(check)
			void ensureThumbnails([check.file])

			const userStore = useUserStore()
			userStore.updateCredits(userStore.credits - 1)

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
		checksList.value = []
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
		checksList,
		thumbnails,
		loading,
		error,
		listLoading,
		listError,
		runningCheckFileId,

		// Computed
		checkCount,
		recentChecks,
		isRunningCheck,

		// Methods
		getFileChecks,
		getCheck,
		fetchCheck,
		loadChecks,
		runCheck,
		clearFileChecksCache,
		clearCache,
		syncFileChecks,
	}
})
