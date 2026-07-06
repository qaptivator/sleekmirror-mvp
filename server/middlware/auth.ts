export default defineEventHandler((event) => {
	if (event.path.startsWith('/api/')) {
		//const authHeader = getRequestHeader(event, 'authorization')
		// inject custom data into the context (similar to setting ctx.meta)
		//event.context.user = authHeader ? { authenticated: true } : null
		// simulate user auth
		event.context.user = '6a4bb0da27b09ebd780971a8'
	}
})
