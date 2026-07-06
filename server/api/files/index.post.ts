import { File } from '../../models/File'

export default defineEventHandler(async (event) => {
	const currentUser = event.context.user
	if (!currentUser) {
		throw createError({ statusCode: 401, statusMessage: 'Unauthorized' })
	}

	const formData = await readMultipartFormData(event)
	if (!formData) {
		throw createError({
			statusCode: 400,
			statusMessage: 'Missing file form data',
		})
	}

	const filePart = formData.find((part) => part.name === 'file')
	if (!filePart || !filePart.filename) {
		throw createError({ statusCode: 400, statusMessage: 'No file detected' })
	}

	const fileAsset = await File.create({
		user: currentUser._id, // Tied using the clean 'user' model property matching key
		filename: filePart.filename,
		mime_type: filePart.type,
		size_bytes: filePart.data.length,
		binary_data: filePart.data,
	})

	// Return standard resource creation structure
	return { file_id: fileAsset._id }
})
