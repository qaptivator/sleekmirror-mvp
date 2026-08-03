import { File } from '../../models/File'

export default defineEventHandler(async (event) => {
	const currentUser = event.context.user
	if (!currentUser)
		throw createError({ statusCode: 401, statusMessage: 'Unauthorized' })

	const fileId = getRouterParam(event, 'id')

	console.log('Looking for file:', fileId)
	console.log('For user:', currentUser._id)
	console.log('User _id type:', typeof currentUser._id)

	const fileInfo = await (File.findOne as any)({
		_id: fileId,
		user: currentUser._id,
	})
		.select('-binaryData') // Keep it lightweight
		.lean()

	console.log('Found:', fileInfo) // ADD THIS

	if (!fileInfo)
		throw createError({ statusCode: 404, statusMessage: 'File not found' })

	return fileInfo
})
