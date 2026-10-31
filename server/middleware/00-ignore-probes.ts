// Bots request paths like /.env. Those are not pages, but Nuxt still renders
// them through Vue Router, which logs "No match found" for every hit.
// Answer 404 here so the router never sees them.
const APP_PATHS = new Set(['/', '/robots.txt'])

export default defineEventHandler((event) => {
	const path = getRequestURL(event).pathname

	if (
		APP_PATHS.has(path) ||
		path.startsWith('/api/') ||
		path.startsWith('/_nuxt/')
	) {
		return
	}

	setResponseStatus(event, 404)
	setResponseHeader(event, 'content-type', 'text/plain; charset=utf-8')
	return 'Not found'
})
