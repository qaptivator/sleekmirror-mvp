export default defineEventHandler((event) => {
	// Get the origin from the request — when credentials are included, 
	// we MUST return the specific origin, not wildcard '*'
	const origin = getRequestHeader(event, 'origin')
	
	if (origin) {
		setResponseHeaders(event, {
			'Access-Control-Allow-Origin': origin,
			'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
			'Access-Control-Allow-Headers': 'Content-Type, Authorization',
			'Access-Control-Allow-Credentials': 'true',
		})
	}
	
	// handle preflight requests
	if (event.method === 'OPTIONS') {
		event.node.res.statusCode = 204
		event.node.res.end()
	}
})
