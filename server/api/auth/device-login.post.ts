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

	console.log('device-login deviceIdentifier:', deviceIdentifier)

	// find existing user or create a new one with the device identifier
	let user = await User.findOne({ identifiers: deviceIdentifier })
	console.log('device-login user:', user)

	if (!user) {
		console.log('device-login making new user')
		user = await User.create({
			identifiers: [deviceIdentifier],
			credits: 10,
		})
	}

	console.log('device-login return')
	return {
		success: true,
		user,
		token: deviceIdentifier, // used as Bearer token in subsequent requests
	}
})
