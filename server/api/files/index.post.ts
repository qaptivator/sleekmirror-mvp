// Images are processed in memory by POST /api/checks/run and are not stored.
export default defineEventHandler(() => {
	throw createError({
		statusCode: 410,
		statusMessage: 'Image storage is disabled',
	})
})
