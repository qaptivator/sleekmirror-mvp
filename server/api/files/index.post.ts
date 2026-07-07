import { File } from '../../models/File'

const MAX_SIZE_BYTE = 4 * 1024 * 1024 // 4 MB

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

	if (filePart.data.length > MAX_SIZE_BYTE) {
		throw createError({
			statusCode: 400,
			statusMessage: 'File larger than 4 MB',
		})
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
