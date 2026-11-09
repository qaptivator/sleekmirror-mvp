import { User } from '../../models/User'
import { AI_PHOTO_CONSENT_VERSION } from '#shared/utils/consent'
import { toPublicUser } from '../../utils/publicUser'

export default defineEventHandler(async (event) => {
	const currentUser = event.context.user
	if (!currentUser) {
		throw createError({ statusCode: 401, statusMessage: 'Unauthorized' })
	}

	const body = await readBody(event).catch(() => null)
	const granted = body?.granted === true

	if (granted) {
		if (
			body?.ageConfirmed !== true ||
			body?.termsAccepted !== true ||
			body?.aiPhotoProcessing !== true
		) {
			throw createError({
				statusCode: 400,
				statusMessage: 'All consent checkboxes are required',
			})
		}
	}

	const user = await User.findByIdAndUpdate(
		currentUser._id,
		granted
			? {
					aiPhotoConsent: true,
					aiPhotoConsentAt: new Date(),
					consentVersion: AI_PHOTO_CONSENT_VERSION,
					ageConfirmed: true,
					aiPhotoConsentWithdrawnAt: null,
				}
			: {
					aiPhotoConsent: false,
					consentVersion: null,
					aiPhotoConsentWithdrawnAt: new Date(),
				},
		{ new: true }
	)

	if (!user) {
		throw createError({ statusCode: 404, statusMessage: 'User not found' })
	}

	return { success: true, user: toPublicUser(user) }
})
