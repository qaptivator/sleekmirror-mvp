import { File } from '../../../models/File'

export default defineEventHandler(async (event) => {
	const currentUser = event.context.user
	if (!currentUser)
		throw createError({ statusCode: 401, statusMessage: 'Unauthorized' })

	const fileId = getRouterParam(event, 'id')

	const fileAsset = await File.findOne({
		_id: fileId,
		user: currentUser._id,
	}).lean()

	if (!fileAsset)
		throw createError({ statusCode: 404, statusMessage: 'File not found' })

	setHeader(event, 'Content-Type', fileAsset.mimeType || 'image/jpeg')
	setHeader(event, 'Cache-Control', 'public, max-age=31536000, immutable')

	// Binary → Buffer → Uint8Array so H3 can send it
	const buffer = Buffer.isBuffer(fileAsset.binaryData)
		? fileAsset.binaryData
		: Buffer.from(fileAsset.binaryData.buffer)

	return buffer
})
