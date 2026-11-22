export default defineEventHandler(() => {
	throw createError({
		statusCode: 410,
		statusMessage: 'This login route is disabled',
	})
})
