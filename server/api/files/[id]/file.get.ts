import { File } from '../../../models/File'
import { createSignedFileUrl, downloadFromR2 } from '../../../utils/r2'

export default defineEventHandler(async (event) => {
	const currentUser = event.context.user
	if (!currentUser) {
		throw createError({ statusCode: 401, statusMessage: 'Unauthorized' })
	}

	const fileId = getRouterParam(event, 'id')

	// Restrict strictly to files owned by the authenticated user
	const fileAsset = await File.findOne({
		_id: fileId,
		user: currentUser._id,
	}).lean()

	if (!fileAsset) {
		throw createError({ statusCode: 404, statusMessage: 'File not found' })
	}

	const query = getQuery(event)

	// If stored in Cloudflare R2
	if (fileAsset.r2Key) {
		// Optional client redirect directly to Cloudflare edge CDN
		if (query.redirect === 'true') {
			const signedUrl = createSignedFileUrl(fileAsset.r2Key, 3600)
			return sendRedirect(event, signedUrl, 302)
		}

		// Stream binary from R2 to client (preserves existing blob fetches seamlessly)
		const buffer = await downloadFromR2(fileAsset.r2Key)
		setHeader(event, 'Content-Type', fileAsset.mimeType || 'image/jpeg')
		setHeader(event, 'Cache-Control', 'public, max-age=31536000, immutable')
		return buffer
	}

	// Legacy fallback for unmigrated MongoDB binary records
	if (fileAsset.binaryData) {
		setHeader(event, 'Content-Type', fileAsset.mimeType || 'image/jpeg')
		setHeader(event, 'Cache-Control', 'public, max-age=31536000, immutable')

		const buffer = Buffer.isBuffer(fileAsset.binaryData)
			? fileAsset.binaryData
			: Buffer.from((fileAsset.binaryData as any).buffer)

		return buffer
	}

	throw createError({
		statusCode: 404,
		statusMessage: 'File content not found',
	})
})
