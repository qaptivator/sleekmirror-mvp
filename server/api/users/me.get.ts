import { User } from '../../models/User'
import { toPublicUser } from '../../utils/publicUser'
import { applyDailyScanRenewal } from '../../utils/scanCredits'

export default defineEventHandler(async (event) => {
	const currentUser = event.context.user
	if (!currentUser) {
		throw createError({ statusCode: 401, statusMessage: 'Unauthorized' })
	}

	const user = await applyDailyScanRenewal(await User.findById(currentUser._id))
	if (!user) {
		throw createError({
			statusCode: 404,
			statusMessage: 'User not found',
		})
	}

	return toPublicUser(user)
})
