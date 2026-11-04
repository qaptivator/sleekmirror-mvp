export function isNetworkError(err: unknown): boolean {
	if (!err || typeof err !== 'object') {
		return typeof navigator !== 'undefined' && navigator.onLine === false
	}

	const e = err as {
		status?: number
		statusCode?: number
		response?: { status?: number }
		name?: string
		message?: string
	}
	const status = e.status ?? e.statusCode ?? e.response?.status
	if (typeof status === 'number') return false
	if (e.name === 'AbortError') return true

	const msg = String(e.message || '')
	if (
		msg.includes('Failed to fetch') ||
		msg.includes('NetworkError') ||
		msg.includes('Load failed') ||
		msg.includes('fetch failed') ||
		msg.includes('aborted')
	) {
		return true
	}

	if (typeof navigator !== 'undefined' && navigator.onLine === false) return true
	return e.name === 'FetchError'
}
