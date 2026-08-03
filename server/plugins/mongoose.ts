import mongoose from 'mongoose'
import { setServers } from 'node:dns'

export default defineNitroPlugin(async () => {
	// forces Node's internal resolver to bypass the broken system stack
	// (fixes MongoDB Connection Error: querySrv ECONNREFUSED _mongodb._tcp.cluster0)
	// ((that is a known dns error in NodeJS v24.18.0 LTS))
	setServers(['1.1.1.1', '8.8.8.8'])

	const config = useRuntimeConfig()
	if (!config.mongodbUri) {
		console.error('MongoDB Connection Error: MongoDB URI not provided')
	}

	// 1 or 2 means it is already connected or currently connecting
	const state = mongoose.connection.readyState
	if (state === 1 || state === 2) {
		return
	}
	try {
		await mongoose.connect(config.mongodbUri)
		console.log('MongoDB Connected Successfully')
	} catch (error) {
		console.error('MongoDB Connection Error:', error)
	}
})
