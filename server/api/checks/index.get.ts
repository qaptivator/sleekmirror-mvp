import { Check } from '../../models/Check'

export default defineEventHandler(async (event) => {
	const currentUser = event.context.user
	if (!currentUser)
		throw createError({ statusCode: 401, statusMessage: 'Unauthorized' })

	return await Check.find({ user: currentUser._id })
		.sort({ createdAt: -1 })
		.lean()
})
