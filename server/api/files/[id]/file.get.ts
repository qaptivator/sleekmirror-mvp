export default defineEventHandler(() => {
	throw createError({
		statusCode: 410,
		statusMessage: 'Image storage is disabled',
	})
})
