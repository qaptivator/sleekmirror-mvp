import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

interface FileMetadata {
	_id: string
	filename: string
	mime_type: string
	size_bytes: number
	createdAt: string
	updatedAt: string
}

interface FileCacheEntry {
	metadata: FileMetadata
	blob?: Blob
	lastAccessedAt: number
}

export const useFileStore = defineStore('files', () => {
	// State
	const files = ref<Map<string, FileCacheEntry>>(new Map())
	const fileList = ref<FileMetadata[]>([])
	const loading = ref(false)
	const error = ref<string | null>(null)

	// Cache configuration
	const MAX_BLOB_CACHE_SIZE = 50 * 1024 * 1024 // 50MB
	let currentCacheSize = 0

	// Computed
	const fileCount = computed(() => fileList.value.length)
	const cachedFileIds = computed(() => Array.from(files.value.keys()))

	// Fetch file list from server
	const fetchFiles = async () => {
		loading.value = true
		error.value = null

		try {
			const response = await $fetch<FileMetadata[]>('/api/files')
			fileList.value = response
			return response
		} catch (err) {
			error.value = err instanceof Error ? err.message : 'Failed to fetch files'
			throw err
		} finally {
			loading.value = false
		}
	}

	// Upload a file
	const uploadFile = async (file: File) => {
		error.value = null

		try {
			const formData = new FormData()
			formData.append('file', file)

			const metadata = await $fetch<FileMetadata>('/api/files', {
				method: 'POST',
				body: formData,
			})

			// Add to file list
			fileList.value.unshift(metadata)

			// Add to cache with blob
			files.value.set(metadata._id, {
				metadata,
				blob: file,
				lastAccessedAt: Date.now(),
			})

			currentCacheSize += file.size

			return metadata
		} catch (err) {
			error.value = err instanceof Error ? err.message : 'Failed to upload file'
			throw err
		}
	}

	// Get file metadata
	const getFileMetadata = async (fileId: string): Promise<FileMetadata> => {
		// Check if cached
		const cached = files.value.get(fileId)
		if (cached) {
			cached.lastAccessedAt = Date.now()
			return cached.metadata
		}

		error.value = null

		try {
			const metadata = await $fetch<FileMetadata>(`/api/files/${fileId}.json`)

			// Add to cache
			files.value.set(fileId, {
				metadata,
				lastAccessedAt: Date.now(),
			})

			return metadata
		} catch (err) {
			error.value = err instanceof Error ? err.message : 'Failed to fetch file metadata'
			throw err
		}
	}

	// Get file blob (with caching)
	const getFileBlob = async (fileId: string): Promise<Blob> => {
		const cached = files.value.get(fileId)

		// If blob is already cached, return it
		if (cached?.blob) {
			cached.lastAccessedAt = Date.now()
			return cached.blob
		}

		error.value = null

		try {
			// Fetch blob from server
			const blob = await $fetch<Blob>(`/api/files/${fileId}.file`, {
				responseType: 'blob',
			})

			// Get or create cache entry
			let entry = files.value.get(fileId)
			if (!entry) {
				const metadata = await getFileMetadata(fileId)
				entry = {
					metadata,
					lastAccessedAt: Date.now(),
				}
				files.value.set(fileId, entry)
			}

			// Add blob to cache
			entry.blob = blob
			entry.lastAccessedAt = Date.now()

			// Update cache size
			currentCacheSize += blob.size

			// Evict old entries if cache is full
			evictOldEntries()

			return blob
		} catch (err) {
			error.value = err instanceof Error ? err.message : 'Failed to fetch file blob'
			throw err
		}
	}

	// Evict old entries when cache is full
	const evictOldEntries = () => {
		if (currentCacheSize <= MAX_BLOB_CACHE_SIZE) return

		const entries = Array.from(files.value.entries()).sort(
			(a, b) => a[1].lastAccessedAt - b[1].lastAccessedAt
		)

		for (const [fileId, entry] of entries) {
			if (currentCacheSize <= MAX_BLOB_CACHE_SIZE * 0.8) break

			if (entry.blob) {
				currentCacheSize -= entry.blob.size
				entry.blob = undefined
			}
		}
	}

	// Clear specific file from cache
	const clearFileCache = (fileId: string) => {
		const entry = files.value.get(fileId)
		if (entry?.blob) {
			currentCacheSize -= entry.blob.size
			entry.blob = undefined
		}
	}

	// Clear all cache
	const clearCache = () => {
		files.value.clear()
		currentCacheSize = 0
	}

	// Sync files from server (authority is server)
	const syncFiles = async () => {
		await fetchFiles()
	}

	return {
		// State
		files,
		fileList,
		loading,
		error,

		// Computed
		fileCount,
		cachedFileIds,

		// Methods
		fetchFiles,
		uploadFile,
		getFileMetadata,
		getFileBlob,
		clearFileCache,
		clearCache,
		syncFiles,
	}
})
