import { User } from '../models/User'
import { verifyAccessToken } from '../utils/jwt'

export default defineEventHandler(async (event) => {
  // Skip auth for these paths
  const publicPaths = [
    '/api/auth/login-device',
    '/api/auth/request-otp',
    '/api/auth/verify-otp',
    '/api/auth/refresh',
    '/api/auth/logout',
  ]

  if (publicPaths.includes(event.path)) {
    event.context.user = undefined
    return
  }

  if (!event.path.startsWith('/api/')) {
    event.context.user = undefined
    return
  }

  const config = useRuntimeConfig()
  const authHeader = getRequestHeader(event, 'authorization')

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    throw createError({
      statusCode: 401,
      statusMessage: 'Missing or invalid authorization header',
    })
  }

  const token = authHeader.substring(7).trim()
  const payload = verifyAccessToken(token, config)

  if (!payload) {
    throw createError({
      statusCode: 401,
      statusMessage: 'Invalid or expired token',
    })
  }

  // Fetch user from database
  const user = await User.findById(payload.sub).lean()

  if (!user) {
    throw createError({
      statusCode: 404,
      statusMessage: 'User not found',
    })
  }

  event.context.user = user
})

