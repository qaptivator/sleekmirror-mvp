import { setServers } from 'node:dns'
import mongoose from 'mongoose'
import { File } from '../models/File.ts'

// Resolve DNS for MongoDB Atlas if on Node 24
setServers(['1.1.1.1', '8.8.8.8'])

async function runMigration() {
	console.log('--- Starting Sleekmirror MongoDB -> Cloudflare R2 Migration ---')

	const mongoUri =
		process.env.NUXT_MONGODB_URI ||
		process.env.MONGODB_URI
	const workerUrl =
		process.env.NUXT_R2_WORKER_URL ||
		process.env.R2_WORKER_URL
	const workerSecret =
		process.env.NUXT_R2_WORKER_SECRET ||
		process.env.R2_WORKER_SECRET

	if (!mongoUri) {
		console.error('ERROR: Missing MongoDB URI (NUXT_MONGODB_URI or MONGODB_URI).')
		process.exit(1)
	}

	if (!workerUrl || !workerSecret) {
		console.error(
			'ERROR: Missing Worker credentials (NUXT_R2_WORKER_URL and NUXT_R2_WORKER_SECRET).'
		)
		console.error('Please configure them in your .env file.')
		process.exit(1)
	}

	console.log('Connecting to MongoDB...')
	await mongoose.connect(mongoUri)
	console.log('Connected to MongoDB.')

	const cleanBaseUrl = workerUrl.replace(/\/+$/, '')

	// Test connection to Worker
	try {
		const healthRes = await fetch(`${cleanBaseUrl}/health`)
		if (!healthRes.ok) {
			console.warn('Worker health check returned non-200 status:', healthRes.status)
		} else {
			console.log('Cloudflare Worker gateway is reachable.')
		}
	} catch (err) {
		console.error('Failed to connect to Cloudflare Worker gateway:', err)
		console.error('Please ensure the worker is deployed and accessible.')
		process.exit(1)
	}

	// Find all files that still have binary data stored in MongoDB
	const filesToMigrate = await File.find({
		binaryData: { $exists: true, $ne: null },
	})

	console.log(`Found ${filesToMigrate.length} files to migrate to Cloudflare R2.`)

	if (filesToMigrate.length === 0) {
		console.log('No legacy files found in MongoDB. Migration complete!')
		await mongoose.disconnect()
		process.exit(0)
	}

	let successCount = 0
	let failureCount = 0
	let totalBytesOffloaded = 0

	for (let i = 0; i < filesToMigrate.length; i++) {
		const file = filesToMigrate[i]
		const extParts = (file.filename || '').split('.')
		const ext = extParts.length > 1 ? extParts.pop()?.toLowerCase() : 'jpg'
		const r2Key = `users/${file.user.toString()}/${file._id.toString()}${ext ? '.' + ext : ''}`

		console.log(`[${i + 1}/${filesToMigrate.length}] Migrating: ${file._id} (${file.filename})...`)

		try {
			const buffer = Buffer.isBuffer(file.binaryData)
				? file.binaryData
				: Buffer.from((file.binaryData as any).buffer)

			const encodedKey = r2Key.split('/').map(encodeURIComponent).join('/')
			const uploadUrl = `${cleanBaseUrl}/internal/file/${encodedKey}`

			const uploadRes = await fetch(uploadUrl, {
				method: 'PUT',
				headers: {
					'X-Service-Key': workerSecret,
					'Content-Type': file.mimeType || 'image/jpeg',
				},
				body: buffer,
			})

			if (!uploadRes.ok) {
				const errText = await uploadRes.text()
				throw new Error(`Worker returned ${uploadRes.status}: ${errText}`)
			}

			// Update MongoDB record: set r2Key, set storageProvider, unset binaryData
			await File.updateOne(
				{ _id: file._id },
				{
					$set: {
						r2Key,
						storageProvider: 'r2',
					},
					$unset: {
						binaryData: 1,
					},
				}
			)

			totalBytesOffloaded += buffer.length
			successCount++
			console.log(`  -> Success! Offloaded to R2 key: ${r2Key} (${(buffer.length / 1024).toFixed(1)} KB)`)
		} catch (err) {
			failureCount++
			console.error(`  -> FAILED migrating ${file._id}:`, err)
		}
	}

	console.log('\n--- Migration Summary ---')
	console.log(`Total files processed: ${filesToMigrate.length}`)
	console.log(`Successfully migrated: ${successCount}`)
	console.log(`Failed: ${failureCount}`)
	console.log(`Database storage freed: ${(totalBytesOffloaded / (1024 * 1024)).toFixed(2)} MB`)

	await mongoose.disconnect()
	console.log('Disconnected from MongoDB. Done!')
}

runMigration().catch((err) => {
	console.error('Fatal migration error:', err)
	process.exit(1)
})
