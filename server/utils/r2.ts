import { createHmac } from 'node:crypto'

function cleanEnvValue(val: any): string {
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

export function getR2Config() {
	let config: any = {}
	try {
		config = useRuntimeConfig()
	} catch {
		// Fallback if called outside Nuxt context
	}

	const rawUrl =
		config.r2WorkerUrl ||
		process.env.NUXT_R2_WORKER_URL ||
		process.env.R2_WORKER_URL ||
		''
	const rawSecret =
		config.r2WorkerSecret ||
		process.env.NUXT_R2_WORKER_SECRET ||
		process.env.R2_WORKER_SECRET ||
		''

	const url = cleanEnvValue(rawUrl)
	const secret = cleanEnvValue(rawSecret)

	return { url, secret }
}

export function isR2Configured(): boolean {
	const { url, secret } = getR2Config()
	return Boolean(url && secret)
}

export function generateR2Key(
	userId: string,
	fileId: string,
	ext?: string
): string {
	const cleanExt = ext ? `.${ext.replace(/^\./, '').toLowerCase()}` : ''
	return `users/${userId}/${fileId}${cleanExt}`
}

export function createSignedFileUrl(
	key: string,
	expiresInSeconds: number = 3600
): string {
	const { url, secret } = getR2Config()
	if (!url || !secret) {
		throw new Error('R2 Worker URL or Secret is not configured')
	}

	const exp = Math.floor(Date.now() / 1000) + expiresInSeconds
	const sig = createHmac('sha256', secret)
		.update(`${key}:${exp}`)
		.digest('hex')

	const base = url.replace(/\/+$/, '')
	const encodedKey = key.split('/').map(encodeURIComponent).join('/')
	return `${base}/file/${encodedKey}?exp=${exp}&sig=${sig}`
}

export async function uploadToR2(
	key: string,
	data: Buffer | Uint8Array,
	mimeType: string
): Promise<boolean> {
	const { url, secret } = getR2Config()
	if (!url || !secret) {
		throw new Error('R2 Worker URL or Secret is not configured')
	}

	const base = url.replace(/\/+$/, '')
	const encodedKey = key.split('/').map(encodeURIComponent).join('/')
	const uploadUrl = `${base}/internal/file/${encodedKey}`

	console.log(
		`[r2.upload] Uploading to ${uploadUrl} (secret length: ${secret.length}, bytes: ${data.length})`
	)

	await $fetch(uploadUrl, {
		method: 'PUT',
		headers: {
			'X-Service-Key': secret,
			'Content-Type': mimeType || 'image/jpeg',
		},
		body: data,
	})

	return true
}

export async function downloadFromR2(key: string): Promise<Buffer> {
	const { url, secret } = getR2Config()
	if (!url || !secret) {
		throw new Error('R2 Worker URL or Secret is not configured')
	}

	const base = url.replace(/\/+$/, '')
	const encodedKey = key.split('/').map(encodeURIComponent).join('/')

	const arrayBuffer = await $fetch<ArrayBuffer>(
		`${base}/internal/file/${encodedKey}`,
		{
			method: 'GET',
			headers: {
				'X-Service-Key': secret,
			},
			responseType: 'arrayBuffer',
		}
	)

	return Buffer.from(arrayBuffer)
}

export async function deleteFromR2(key: string): Promise<boolean> {
	const { url, secret } = getR2Config()
	if (!url || !secret) {
		return false
	}

	const base = url.replace(/\/+$/, '')
	const encodedKey = key.split('/').map(encodeURIComponent).join('/')

	await $fetch(`${base}/internal/file/${encodedKey}`, {
		method: 'DELETE',
		headers: {
			'X-Service-Key': secret,
		},
	})

	return true
}
