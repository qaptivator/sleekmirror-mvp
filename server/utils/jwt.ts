import jwt from 'jsonwebtoken'
import type { Types } from 'mongoose'

export interface JwtPayload {
  sub: string // user._id
  iat: number
  exp: number
}

export interface JwtRefreshPayload {
  sub: string // user._id
  iat: number
  exp: number
}

export function generateTokens(userId: Types.ObjectId, config: any) {
  const now = Math.floor(Date.now() / 1000)
  const accessTokenExpiry = now + 15 * 60 // 15 minutes
  const refreshTokenExpiry = now + 7 * 24 * 60 * 60 // 7 days

  const accessToken = jwt.sign(
    {
      sub: userId.toString(),
      iat: now,
      exp: accessTokenExpiry,
    },
    config.jwtSecret,
    { algorithm: 'HS256' }
  )

  const refreshToken = jwt.sign(
    {
      sub: userId.toString(),
      iat: now,
      exp: refreshTokenExpiry,
    },
    config.jwtRefreshSecret,
    { algorithm: 'HS256' }
  )

  return { accessToken, refreshToken, expiresIn: 15 * 60 }
}

export function verifyAccessToken(token: string, config: any): JwtPayload | null {
  try {
    const payload = jwt.verify(token, config.jwtSecret) as JwtPayload
    return payload
  } catch {
    return null
  }
}

export function verifyRefreshToken(token: string, config: any): JwtRefreshPayload | null {
  try {
    const payload = jwt.verify(token, config.jwtRefreshSecret) as JwtRefreshPayload
    return payload
  } catch {
    return null
  }
}

export function generateOtp(): string {
  return Math.floor(100000 + Math.random() * 900000).toString()
}

export function isOtpExpired(createdAt: Date): boolean {
  const expiryTime = 10 * 60 * 1000 // 10 minutes
  return Date.now() - createdAt.getTime() > expiryTime
}
