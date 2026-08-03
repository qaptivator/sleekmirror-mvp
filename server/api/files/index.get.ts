import { File } from '../../models/File'

export default defineEventHandler(async (event) => {
	const currentUser = event.context.user
	if (!currentUser) {
		throw createError({ statusCode: 401, statusMessage: 'Unauthorized' })
	}

	// Omit binaryData completely to keep response payloads lightweight
	return await File.find({ user: currentUser._id })
		.select('-binaryData')
		.sort({ createdAt: -1 })
		.lean()
})
