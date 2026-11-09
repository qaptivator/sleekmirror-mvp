import { User } from '../../models/User'
import { toPublicUser } from '../../utils/publicUser'
import { applyDailyScanRenewal } from '../../utils/scanCredits'

export default defineEventHandler(async (event) => {
	const currentUser = event.context.user
	if (!currentUser) {
		throw createError({ statusCode: 401, statusMessage: 'Unauthorized' })
	}

	// [Optional internal permission gate can go here]

	const query = getQuery(event)
	const identifier = query.identifier as string

	if (!identifier) {
		throw createError({
			statusCode: 400,
			statusMessage: 'Missing identifier query parameter',
		})
	}

	let matchedUser = await User.findOne({ identifiers: identifier })
	if (!matchedUser) {
		throw createError({
			statusCode: 404,
			statusMessage: 'No user matching criteria',
		})
	}

	if (String(matchedUser._id) === String(currentUser._id)) {
		matchedUser = await applyDailyScanRenewal(matchedUser)
	}

	return toPublicUser(matchedUser)
})
