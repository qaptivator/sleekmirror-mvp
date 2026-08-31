import { User } from '../../models/User'

export default defineEventHandler(async (event) => {
	const body = await readBody(event)
	const { deviceId } = body

	console.log('device-login deviceId:', deviceId)

	if (!deviceId) {
		throw createError({
			statusCode: 400,
			statusMessage: 'Device ID is required',
		})
	}

	const deviceIdentifier = `device:${deviceId}`

	console.log('try find user:', deviceIdentifier)

	// Find existing user or create a new one with the device identifier
	let user = await User.findOne({ identifiers: deviceIdentifier })

	if (!user) {
		console.log('making new user')
		user = await User.create({
			identifiers: [deviceIdentifier],
			credits: 10,
		})
	}

	console.log('returning')
	return {
		success: true,
		user,
		token: deviceIdentifier, // Used as Bearer token in subsequent requests
	}
})
