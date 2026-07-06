import { Check } from '../../models/Check'

export default defineEventHandler(async (event) => {
	const currentUser = event.context.user
	if (!currentUser) {
		throw createError({ statusCode: 401, statusMessage: 'Unauthorized' })
	}

	const checkId = getRouterParam(event, 'id')

	const checkReport = await Check.findOne({
		_id: checkId,
		user: currentUser._id,
	}).lean()

	if (!checkReport) {
		throw createError({
			statusCode: 404,
			statusMessage: 'Scan report not found or access denied',
		})
	}

	return checkReport
})
