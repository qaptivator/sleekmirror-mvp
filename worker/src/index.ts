export interface Env {
	BUCKET: R2Bucket
	AUTH_SECRET: string
	ENVIRONMENT?: string
}

function getCorsHeaders(request: Request): Record<string, string> {
	const origin = request.headers.get('Origin') || '*'
	return {
		'Access-Control-Allow-Origin': origin,
		'Access-Control-Allow-Methods': 'GET, PUT, DELETE, OPTIONS, HEAD',
		'Access-Control-Allow-Headers':
			'Content-Type, Authorization, X-Service-Key',
		'Access-Control-Max-Age': '86400',
	}
}

async function verifyHmac(
	secret: string,
	message: string,
	expectedHexSig: string
): Promise<boolean> {
	if (!secret || !message || !expectedHexSig || expectedHexSig.length !== 64) {
		return false
	}
	try {
		const enc = new TextEncoder()
		const key = await crypto.subtle.importKey(
			'raw',
			enc.encode(secret),
			{ name: 'HMAC', hash: 'SHA-256' },
			false,
			['verify']
		)
		const sigBytes = new Uint8Array(
			expectedHexSig.match(/[\da-f]{2}/gi)?.map((h) => parseInt(h, 16)) || []
		)
		if (sigBytes.length !== 32) return false
		return await crypto.subtle.verify(
			'HMAC',
			key,
			sigBytes,
			enc.encode(message)
		)
	} catch {
		return false
	}
}

function cleanSecret(val: any): string {
	if (!val || typeof val !== 'string') return ''
	let cleaned = val.trim()
	if (
		(cleaned.startsWith('"') && cleaned.endsWith('"')) ||
		(cleaned.startsWith("'") && cleaned.endsWith("'"))
	) {
		cleaned = cleaned.slice(1, -1).trim()
	}
	return cleaned
}


export default {
	async fetch(request: Request, env: Env): Promise<Response> {
		const corsHeaders = getCorsHeaders(request)

		// Handle preflight CORS
		if (request.method === 'OPTIONS') {
			return new Response(null, {
				status: 204,
				headers: corsHeaders,
			})
		}

		const url = new URL(request.url)
		const pathname = url.pathname

		// Health check
		if (pathname === '/' || pathname === '/health') {
			return new Response(
				JSON.stringify({
					status: 'ok',
					service: 'sleekmirror-media-gateway',
					timestamp: new Date().toISOString(),
				}),
				{
					status: 200,
					headers: {
						...corsHeaders,
						'Content-Type': 'application/json',
					},
				}
			)
		}

		// -------------------------------------------------------------
		// 1. PUBLIC SIGNED URL ACCESS: GET /file/:key?exp=...&sig=...
		// -------------------------------------------------------------
		if (pathname.startsWith('/file/')) {
			if (request.method !== 'GET' && request.method !== 'HEAD') {
				return new Response('Method Not Allowed', {
					status: 405,
					headers: corsHeaders,
				})
			}

			const key = decodeURIComponent(pathname.replace(/^\/file\//, ''))
			if (!key) {
				return new Response(JSON.stringify({ error: 'Missing file key' }), {
					status: 400,
					headers: { ...corsHeaders, 'Content-Type': 'application/json' },
				})
			}

			const exp = url.searchParams.get('exp')
			const sig = url.searchParams.get('sig')

			if (!exp || !sig) {
				return new Response(
					JSON.stringify({
						error:
							'Unauthorized: Missing signature or expiration token. Direct access forbidden.',
					}),
					{
						status: 403,
						headers: {
							...corsHeaders,
							'Content-Type': 'application/json',
						},
					}
				)
			}

			const expNum = parseInt(exp, 10)
			const now = Math.floor(Date.now() / 1000)

			if (isNaN(expNum) || expNum < now) {
				return new Response(
					JSON.stringify({ error: 'Forbidden: Access signature expired' }),
					{
						status: 403,
						headers: {
							...corsHeaders,
							'Content-Type': 'application/json',
						},
					}
				)
			}

			if (!env.AUTH_SECRET) {
				console.error('AUTH_SECRET is not configured on Worker')
				return new Response(
					JSON.stringify({ error: 'Internal Server Error' }),
					{
						status: 500,
						headers: {
							...corsHeaders,
							'Content-Type': 'application/json',
						},
					}
				)
			}

			const isValid = await verifyHmac(
				env.AUTH_SECRET,
				`${key}:${exp}`,
				sig.toLowerCase()
			)
			if (!isValid) {
				return new Response(
					JSON.stringify({
						error: 'Forbidden: Invalid signature. Access denied.',
					}),
					{
						status: 403,
						headers: {
							...corsHeaders,
							'Content-Type': 'application/json',
						},
					}
				)
			}

			const object = await env.BUCKET.get(key)
			if (!object) {
				return new Response(JSON.stringify({ error: 'File not found' }), {
					status: 404,
					headers: {
						...corsHeaders,
						'Content-Type': 'application/json',
					},
				})
			}

			const headers = new Headers(corsHeaders)
			object.writeHttpMetadata(headers)
			headers.set('ETag', object.httpEtag)
			headers.set('Cache-Control', 'public, max-age=31536000, immutable')

			return new Response(request.method === 'HEAD' ? null : object.body, {
				status: 200,
				headers,
			})
		}

		// -------------------------------------------------------------
		// 2. INTERNAL SERVICE ROUTE: /internal/file/:key
		// Protected by X-Service-Key header (Nuxt backend only)
		// -------------------------------------------------------------
		if (pathname.startsWith('/internal/file/')) {
			const expectedSecret = cleanSecret(env.AUTH_SECRET)
			const providedSecret = cleanSecret(request.headers.get('X-Service-Key'))

			if (!expectedSecret) {
				return new Response(
					JSON.stringify({
						error:
							'Worker Misconfiguration: AUTH_SECRET is not set on Cloudflare. Run: npx wrangler secret put AUTH_SECRET',
					}),
					{
						status: 500,
						headers: {
							...corsHeaders,
							'Content-Type': 'application/json',
						},
					}
				)
			}

			if (providedSecret !== expectedSecret) {
				return new Response(
					JSON.stringify({
						error: `Unauthorized: Invalid internal service key. Received secret length: ${providedSecret.length}, expected secret length on Cloudflare: ${expectedSecret.length}`,
					}),
					{
						status: 401,
						headers: {
							...corsHeaders,
							'Content-Type': 'application/json',
						},
					}
				)
			}

			const key = decodeURIComponent(
				pathname.replace(/^\/internal\/file\//, '')
			)
			if (!key) {
				return new Response(JSON.stringify({ error: 'Missing file key' }), {
					status: 400,
					headers: { ...corsHeaders, 'Content-Type': 'application/json' },
				})
			}

			// GET: Fetch raw file data
			if (request.method === 'GET') {
				const object = await env.BUCKET.get(key)
				if (!object) {
					return new Response(JSON.stringify({ error: 'File not found' }), {
						status: 404,
						headers: {
							...corsHeaders,
							'Content-Type': 'application/json',
						},
					})
				}

				const headers = new Headers(corsHeaders)
				object.writeHttpMetadata(headers)
				headers.set('ETag', object.httpEtag)

				return new Response(object.body, {
					status: 200,
					headers,
				})
			}

			// PUT: Store file to R2
			if (request.method === 'PUT') {
				const contentType =
					request.headers.get('Content-Type') || 'image/jpeg'
				if (!request.body) {
					return new Response(
						JSON.stringify({ error: 'Empty request body' }),
						{
							status: 400,
							headers: {
								...corsHeaders,
								'Content-Type': 'application/json',
							},
						}
					)
				}

				await env.BUCKET.put(key, request.body, {
					httpMetadata: { contentType },
				})

				return new Response(
					JSON.stringify({
						success: true,
						key,
						contentType,
					}),
					{
						status: 200,
						headers: {
							...corsHeaders,
							'Content-Type': 'application/json',
						},
					}
				)
			}

			// DELETE: Remove file from R2
			if (request.method === 'DELETE') {
				await env.BUCKET.delete(key)
				return new Response(
					JSON.stringify({
						success: true,
						deletedKey: key,
					}),
					{
						status: 200,
						headers: {
							...corsHeaders,
							'Content-Type': 'application/json',
						},
					}
				)
			}

			return new Response('Method Not Allowed', {
				status: 405,
				headers: corsHeaders,
			})
		}

		return new Response(JSON.stringify({ error: 'Not Found' }), {
			status: 404,
			headers: { ...corsHeaders, 'Content-Type': 'application/json' },
		})
	},
}
