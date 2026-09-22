export default defineEventHandler((event) => {
	// Get the origin from the request
	const origin = getRequestHeader(event, 'origin') || '*'
	
	setResponseHeaders(event, {
		'Access-Control-Allow-Origin': origin,
		'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
		'Access-Control-Allow-Headers': 'Content-Type, Authorization',
		'Access-Control-Allow-Credentials': 'true',
	})
	
	// handle preflight requests
	if (event.method === 'OPTIONS') {
		event.node.res.statusCode = 204
		event.node.res.end()
	}
})
