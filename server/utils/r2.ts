import { createHmac } from 'node:crypto'

export function isR2Configured(): boolean {
	const config = useRuntimeConfig()
	return Boolean(config.r2WorkerUrl && config.r2WorkerSecret)
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
	const config = useRuntimeConfig()
	if (!config.r2WorkerUrl || !config.r2WorkerSecret) {
		throw new Error('R2 Worker URL or Secret is not configured')
	}

	const exp = Math.floor(Date.now() / 1000) + expiresInSeconds
	const sig = createHmac('sha256', config.r2WorkerSecret)
		.update(`${key}:${exp}`)
		.digest('hex')

	const base = config.r2WorkerUrl.replace(/\/+$/, '')
	const encodedKey = key.split('/').map(encodeURIComponent).join('/')
	return `${base}/file/${encodedKey}?exp=${exp}&sig=${sig}`
}

export async function uploadToR2(
	key: string,
	data: Buffer | Uint8Array,
	mimeType: string
): Promise<boolean> {
	const config = useRuntimeConfig()
	if (!config.r2WorkerUrl || !config.r2WorkerSecret) {
		throw new Error('R2 Worker URL or Secret is not configured')
	}

	const base = config.r2WorkerUrl.replace(/\/+$/, '')
	const encodedKey = key.split('/').map(encodeURIComponent).join('/')

	await $fetch(`${base}/internal/file/${encodedKey}`, {
		method: 'PUT',
		headers: {
			'X-Service-Key': config.r2WorkerSecret,
			'Content-Type': mimeType || 'image/jpeg',
		},
		body: data,
	})

	return true
}

export async function downloadFromR2(key: string): Promise<Buffer> {
	const config = useRuntimeConfig()
	if (!config.r2WorkerUrl || !config.r2WorkerSecret) {
		throw new Error('R2 Worker URL or Secret is not configured')
	}

	const base = config.r2WorkerUrl.replace(/\/+$/, '')
	const encodedKey = key.split('/').map(encodeURIComponent).join('/')

	const arrayBuffer = await $fetch<ArrayBuffer>(
		`${base}/internal/file/${encodedKey}`,
		{
			method: 'GET',
			headers: {
				'X-Service-Key': config.r2WorkerSecret,
			},
			responseType: 'arrayBuffer',
		}
	)

	return Buffer.from(arrayBuffer)
}

export async function deleteFromR2(key: string): Promise<boolean> {
	const config = useRuntimeConfig()
	if (!config.r2WorkerUrl || !config.r2WorkerSecret) {
		return false
	}

	const base = config.r2WorkerUrl.replace(/\/+$/, '')
	const encodedKey = key.split('/').map(encodeURIComponent).join('/')

	await $fetch(`${base}/internal/file/${encodedKey}`, {
		method: 'DELETE',
		headers: {
			'X-Service-Key': config.r2WorkerSecret,
		},
	})

	return true
}
