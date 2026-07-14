import mongoose from 'mongoose'

export default defineNitroPlugin(async () => {
	const config = useRuntimeConfig()
	if (!config.mongodbUri) {
		console.error('MongoDB Connection Error: MongoDB URI not provided')
	}
	try {
		await mongoose.connect(config.mongodbUri)
		console.log('MongoDB Connected Successfully')
	} catch (error) {
		console.error('MongoDB Connection Error:', error)
	}
})
