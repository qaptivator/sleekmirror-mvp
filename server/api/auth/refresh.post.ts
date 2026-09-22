import { User } from '../../models/User'
import { generateTokens, verifyRefreshToken } from '../../utils/jwt'

export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig()
  const refreshToken = getCookie(event, 'refreshToken')

  if (!refreshToken) {
    throw createError({
      statusCode: 401,
      statusMessage: 'Refresh token not found',
    })
  }

  const payload = verifyRefreshToken(refreshToken, config)
  if (!payload) {
    throw createError({
      statusCode: 401,
      statusMessage: 'Invalid refresh token',
    })
  }

  // Verify user still exists
  const user = await User.findById(payload.sub)
  if (!user) {
    throw createError({
      statusCode: 404,
      statusMessage: 'User not found',
    })
  }

  // Generate new tokens
  const { accessToken, expiresIn } = generateTokens(user._id, config)

  // Refresh the refresh token cookie
  // SameSite: 'none' required for cross-origin requests with credentials
  setCookie(event, 'refreshToken', generateTokens(user._id, config).refreshToken, {
    httpOnly: true,
    secure: true,
    sameSite: 'none',
    maxAge: 7 * 24 * 60 * 60,
    path: '/',
  })

  return {
    success: true,
    accessToken,
    expiresIn,
  }
})
