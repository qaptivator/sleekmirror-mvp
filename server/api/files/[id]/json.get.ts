import { File } from '../../../models/File'
import { createSignedFileUrl, isR2Configured } from '../../../utils/r2'

export default defineEventHandler(async (event) => {
	const currentUser = event.context.user
	if (!currentUser)
		throw createError({ statusCode: 401, statusMessage: 'Unauthorized' })

	const fileId = getRouterParam(event, 'id')

	const fileInfo = await (File.findOne as any)({
		_id: fileId,
		user: currentUser._id,
	})
		.select('-binaryData') // Keep it lightweight
		.lean()

	if (!fileInfo)
		throw createError({ statusCode: 404, statusMessage: 'File not found' })

	// Add signedUrl if stored in R2 and configured
	let signedUrl: string | null = null
	if (fileInfo.r2Key && isR2Configured()) {
		try {
			signedUrl = createSignedFileUrl(fileInfo.r2Key, 3600)
		} catch (err) {
			console.error('Failed to generate signed URL:', err)
		}
	}

	return {
		...fileInfo,
		signedUrl,
	}
})
