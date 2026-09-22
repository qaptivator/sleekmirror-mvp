import { User } from '../../models/User'
import { generateTokens } from '../../utils/jwt'

export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig()
  const body = await readBody(event)
  const { deviceId } = body

  if (!deviceId) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Device ID is required',
    })
  }

  const deviceIdentifier = `device:${deviceId}`

  // Find or create user by device identifier
  let user = await User.findOne({ identifiers: deviceIdentifier })

  if (!user) {
    user = await User.create({
      identifiers: [deviceIdentifier],
      credits: 10,
    })
  }

  const { accessToken, refreshToken, expiresIn } = generateTokens(user._id, config)

  // Store refresh token in httpOnly cookie
  // SameSite: 'none' required for cross-origin requests with credentials
  setCookie(event, 'refreshToken', refreshToken, {
    httpOnly: true,
    secure: true,
    sameSite: 'none',
    maxAge: 7 * 24 * 60 * 60,
    path: '/',
  })

  return {
    success: true,
    user: {
      _id: user._id,
      identifiers: user.identifiers,
      email: user.email,
      emailVerified: user.emailVerified,
      credits: user.credits,
      firstName: user.firstName,
      lastName: user.lastName,
    },
    accessToken,
    expiresIn,
  }
})
