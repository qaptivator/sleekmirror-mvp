import { User } from '../../models/User'

export default defineEventHandler(async (event) => {
	const body = await readBody(event)
	const { deviceId } = body

	if (!deviceId) {
		throw createError({
			statusCode: 400,
			statusMessage: 'Device ID is required',
		})
	}

	const deviceIdentifier = `device:${deviceId}`

	// Find existing user or create a new one with the device identifier
	let user = await User.findOne({ identifiers: deviceIdentifier })

	if (!user) {
		user = await User.create({
			identifiers: [deviceIdentifier],
			credits: 10,
		})
	}

	return {
		success: true,
		user,
		token: deviceIdentifier, // Used as Bearer token in subsequent requests
	}
})
