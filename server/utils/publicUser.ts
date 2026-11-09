import { AI_PHOTO_CONSENT_VERSION } from '#shared/utils/consent'

export function toPublicUser(user: any) {
	const src = typeof user?.toObject === 'function' ? user.toObject() : user
	return {
		_id: src._id,
		identifiers: src.identifiers,
		email: src.email,
		emailVerified: src.emailVerified,
		credits: src.credits,
		firstName: src.firstName,
		lastName: src.lastName,
		aiPhotoConsent: src.aiPhotoConsent === true,
		aiPhotoConsentAt: src.aiPhotoConsentAt ?? null,
		consentVersion: src.consentVersion ?? null,
		createdAt: src.createdAt,
		updatedAt: src.updatedAt,
	}
}

export function hasValidAiPhotoConsent(user: any) {
	return (
		user?.aiPhotoConsent === true &&
		user?.consentVersion === AI_PHOTO_CONSENT_VERSION
	)
}
