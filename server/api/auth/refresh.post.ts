import { User } from '../../models/User'
import { generateTokens, verifyRefreshToken } from '../../utils/jwt'

export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig()
  const body = await readBody(event).catch(() => null)
  // The Capacitor app cannot store this cookie: the page is https://sleekmirror
  // and the API is another site, so the WebView drops it. The body is the copy
  // the app kept. Browsers can still send the cookie.
  const refreshToken =
    (typeof body?.refreshToken === 'string' && body.refreshToken) ||
    getCookie(event, 'refreshToken')

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

  const { accessToken, refreshToken: nextRefreshToken, expiresIn } = generateTokens(
    user._id,
    config
  )

  setCookie(event, 'refreshToken', nextRefreshToken, {
    httpOnly: true,
    secure: true,
    sameSite: 'none',
    maxAge: 7 * 24 * 60 * 60,
    path: '/',
  })

  return {
    success: true,
    accessToken,
    refreshToken: nextRefreshToken,
    expiresIn,
    user: {
      _id: user._id,
      identifiers: user.identifiers,
      email: user.email,
      emailVerified: user.emailVerified,
      credits: user.credits,
      firstName: user.firstName,
      lastName: user.lastName,
    },
  }
})
