import type { H3Event } from 'h3'

const hits = new Map<string, number[]>()

export function getClientIp(event: H3Event) {
	return getRequestIP(event, { xForwardedFor: true }) || 'unknown'
}

// In-memory sliding window. Swap the Map for Redis later without changing callers.
export function assertRateLimit(
	event: H3Event,
	opts: { key: string; limit: number; windowMs: number }
) {
	const now = Date.now()
	const recent = (hits.get(opts.key) || []).filter(
		(t) => now - t < opts.windowMs
	)

	if (recent.length >= opts.limit) {
		const retryAfterSec = Math.max(
			1,
			Math.ceil((recent[0]! + opts.windowMs - now) / 1000)
		)
		setResponseHeader(event, 'Retry-After', String(retryAfterSec))
		throw createError({
			statusCode: 429,
			statusMessage: 'Too many requests',
		})
	}

	recent.push(now)
	hits.set(opts.key, recent)
}
