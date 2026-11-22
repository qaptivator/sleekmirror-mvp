import { User } from '../../models/User'
import { generateTokens } from '../../utils/jwt'
import { toPublicUser } from '../../utils/publicUser'
import { applyDailyScanRenewal } from '../../utils/scanCredits'
import { DAILY_SCAN_ALLOWANCE } from '#shared/utils/scans'
import { assertRateLimit, getClientIp } from '../../utils/rateLimit'
import { ensureSupportId, generateSupportId } from '../../utils/supportId'

export default defineEventHandler(async (event) => {
  assertRateLimit(event, {
    key: `login-device:ip:${getClientIp(event)}`,
    limit: 10,
    windowMs: 10 * 60 * 1000,
  })

  const config = useRuntimeConfig()
  const body = await readBody(event)
  const { deviceId } = body

  if (!deviceId || typeof deviceId !== 'string') {
    throw createError({
      statusCode: 400,
      statusMessage: 'Device ID is required',
    })
  }

  // Login is only by device identifier. supportId is never a credential.
  const deviceIdentifier = `device:${deviceId}`

  let user = await User.findOne({ identifiers: deviceIdentifier })

  if (!user) {
    for (let attempt = 0; attempt < 8; attempt++) {
      try {
        user = await User.create({
          identifiers: [deviceIdentifier],
          supportId: generateSupportId(),
          credits: DAILY_SCAN_ALLOWANCE,
          creditsRenewedAt: new Date(),
        })
        break
      } catch (err: any) {
        if (err?.code !== 11000) throw err
      }
    }
    if (!user) {
      throw createError({
        statusCode: 500,
        statusMessage: 'Could not create account',
      })
    }
  } else {
    user = await ensureSupportId(await applyDailyScanRenewal(user))
  }

  const { accessToken, refreshToken, expiresIn } = generateTokens(user._id, config)

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
