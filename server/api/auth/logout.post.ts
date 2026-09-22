export default defineEventHandler(async (event) => {
  // Clear refresh token cookie
  // SameSite: 'none' required for cross-origin requests with credentials
  setCookie(event, 'refreshToken', '', {
    httpOnly: true,
    secure: true,
    sameSite: 'none',
    maxAge: 0,
    path: '/',
  })

  return { success: true, message: 'Logged out' }
})
