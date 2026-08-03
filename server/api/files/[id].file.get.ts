import { File } from '../../models/File'

export default defineEventHandler(async (event) => {
	const currentUser = event.context.user
	if (!currentUser) {
		throw createError({ statusCode: 401, statusMessage: 'Unauthorized' })
	}

	const fileId = getRouterParam(event, 'id')

	// Fetch only the specific target binary
	const fileAsset = await (File.findOne as any)({
		_id: fileId,
		user: currentUser._id,
	}).lean()

	if (!fileAsset) {
		throw createError({ statusCode: 404, statusMessage: 'File not found' })
	}

	// Tell the mobile browser how to read the buffer payload
	setHeader(event, 'Content-Type', fileAsset.mimeType || 'image/jpeg')
	setHeader(event, 'Cache-Control', 'public, max-age=31536000, immutable')

	return fileAsset.binaryData
})
