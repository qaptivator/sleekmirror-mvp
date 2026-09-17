import { User } from '../../models/User'
import { generateOtp } from '../../utils/jwt'

export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  const { email } = body

  if (!email || !email.includes('@')) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Valid email is required',
    })
  }

  const emailIdentifier = `email:${email.toLowerCase()}`

  // Check if email is already registered to a verified account
  const existingUser = await User.findOne({
    identifiers: emailIdentifier,
    emailVerified: true,
  })

  if (existingUser) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Email is already linked to an account',
    })
  }

  // Find user (could be device-only or partially registered)
  let user = await User.findOne({ identifiers: emailIdentifier })

  if (!user) {
    // New user registering with email
    user = await User.create({
      identifiers: [emailIdentifier],
      email: email.toLowerCase(),
      credits: 10,
    })
  }

  // Generate and store OTP
  const otp = generateOtp()
  user.otpCode = otp
  user.otpCreatedAt = new Date()
  user.otpAttempts = 0
  await user.save()

  // TODO: Send OTP via email service
  // For now, log to console (development)
  console.log(`[OTP] Email: ${email}, Code: ${otp}`)

  return {
    success: true,
    message: 'OTP sent to email',
    expiresIn: 600, // 10 minutes in seconds
  }
})
