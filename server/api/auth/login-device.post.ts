import { User } from '../../models/User'
import { generateTokens } from '../../utils/jwt'
import { toPublicUser } from '../../utils/publicUser'
import { applyDailyScanRenewal } from '../../utils/scanCredits'
import { DAILY_SCAN_ALLOWANCE } from '#shared/utils/scans'

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
      credits: DAILY_SCAN_ALLOWANCE,
      creditsRenewedAt: new Date(),
    })
  } else {
    user = await applyDailyScanRenewal(user)
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
    user: toPublicUser(user),
    accessToken,
    refreshToken,
    expiresIn,
  }
})
