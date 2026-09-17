export default defineEventHandler(async (event) => {
  // Clear refresh token cookie
  setCookie(event, 'refreshToken', '', {
    httpOnly: true,
    secure: true,
    sameSite: 'lax',
    maxAge: 0,
    path: '/',
  })

  return { success: true, message: 'Logged out' }
})
