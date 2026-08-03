import { File } from '../../models/File'

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

	return fileInfo
})
