export default defineEventHandler(() => {
  throw createError({
    statusCode: 410,
    statusMessage: 'Email OTP is disabled',
  })
})
