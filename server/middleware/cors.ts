const CAPACITOR_ORIGIN = 'https://sleekmirror'

function allowedOrigins() {
	const extra = String(useRuntimeConfig().corsAllowedOrigins || '')
		.split(',')
		.map((origin) => origin.trim())
		.filter(Boolean)
	return new Set([CAPACITOR_ORIGIN, ...extra])
}

export default defineEventHandler((event) => {
	const origin = getRequestHeader(event, 'origin')
	const allowlist = allowedOrigins()
	const allowed = Boolean(origin && allowlist.has(origin))

	if (allowed && origin) {
		setResponseHeaders(event, {
			'Access-Control-Allow-Origin': origin,
			'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
			'Access-Control-Allow-Headers': 'Content-Type, Authorization',
			'Access-Control-Allow-Credentials': 'true',
			Vary: 'Origin',
		})
	}

	if (event.method === 'OPTIONS') {
		event.node.res.statusCode = allowed ? 204 : 403
		event.node.res.end()
	}
})
