import mongoose from 'mongoose'
import { File } from '../../models/File'
import {
	generateR2Key,
	getR2Config,
	isR2Configured,
	uploadToR2,
} from '../../utils/r2'

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

	const mimeType = filePart.type || 'image/jpeg'
	const extParts = filePart.filename.split('.')
	const ext = extParts.length > 1 ? extParts.pop() : 'jpg'
	const fileId = new mongoose.Types.ObjectId()

	const r2Ready = isR2Configured()

	// If R2 worker is configured, upload directly to R2 bucket
	if (r2Ready) {
		console.log('[upload] Cloudflare R2 is configured. Uploading to R2...')
		const r2Key = generateR2Key(
			currentUser._id.toString(),
			fileId.toString(),
			ext
		)
		await uploadToR2(r2Key, filePart.data, mimeType)
		console.log('[upload] Upload to R2 successful. Key:', r2Key)

		const fileAsset = await File.create({
			_id: fileId,
			user: currentUser._id,
			filename: filePart.filename,
			mimeType,
			sizeBytes: filePart.data.length,
			r2Key,
			storageProvider: 'r2',
		})

		return { fileId: fileAsset._id }
	}

	const { url, secret } = getR2Config()
	console.warn(
		`[upload] R2 is NOT configured. Falling back to MongoDB binary storage. (url: ${
			url ? 'configured' : 'MISSING'
		}, secret: ${secret ? 'configured' : 'MISSING'})`
	)

	// Fallback to direct MongoDB binary storage if R2 is not yet configured
	const fileAsset = await File.create({
		_id: fileId,
		user: currentUser._id,
		filename: filePart.filename,
		mimeType,
		sizeBytes: filePart.data.length,
		binaryData: filePart.data,
		storageProvider: 'mongodb',
	})

	return { fileId: fileAsset._id }
})
