import { User } from '../../models/User'
import { generateTokens, isOtpExpired } from '../../utils/jwt'

export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig()
  const body = await readBody(event)
  const { email, code } = body

  if (!email || !code) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Email and code are required',
    })
  }

  const emailIdentifier = `email:${email.toLowerCase()}`
  const user = await User.findOne({ identifiers: emailIdentifier })

  if (!user) {
    throw createError({
      statusCode: 404,
      statusMessage: 'User not found',
    })
  }

  // Check OTP exists and not expired
  if (!user.otpCode || isOtpExpired(user.otpCreatedAt!)) {
    throw createError({
      statusCode: 400,
      statusMessage: 'OTP expired. Request a new one.',
    })
  }

  // Check max attempts (3 attempts then locked)
  if (user.otpAttempts! >= 3) {
    throw createError({
      statusCode: 429,
      statusMessage: 'Too many attempts. Request a new OTP.',
    })
  }

  // Verify OTP code
  if (user.otpCode !== code) {
    user.otpAttempts = (user.otpAttempts || 0) + 1
    await user.save()
    throw createError({
      statusCode: 400,
      statusMessage: 'Invalid OTP code',
    })
  }

  // Mark email as verified and clear OTP
  user.emailVerified = true
  user.email = email.toLowerCase()
  user.otpCode = undefined
  user.otpCreatedAt = undefined
  user.otpAttempts = 0

  // Add email identifier if not already present
  if (!user.identifiers.includes(emailIdentifier)) {
    user.identifiers.push(emailIdentifier)
  }

  await user.save()

  // Generate JWT tokens
  const { accessToken, refreshToken, expiresIn } = generateTokens(user._id, config)

  // Store refresh token in httpOnly cookie
  setCookie(event, 'refreshToken', refreshToken, {
    httpOnly: true,
    secure: true,
    sameSite: 'lax',
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
