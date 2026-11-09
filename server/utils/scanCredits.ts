import { User } from '../models/User'
import { DAILY_SCAN_ALLOWANCE, utcDayKey } from '#shared/utils/scans'

export async function applyDailyScanRenewal(user: any) {
	if (!user) return user

	const doc =
		typeof user.save === 'function' ? user : await User.findById(user._id)
	if (!doc) return user

	const lastKey = doc.creditsRenewedAt
		? utcDayKey(new Date(doc.creditsRenewedAt))
		: null
	const today = utcDayKey()

	if (lastKey === today) return doc

	if (!lastKey) {
		const updatedDay = doc.updatedAt
			? utcDayKey(new Date(doc.updatedAt))
			: null
		if (updatedDay !== today) {
			doc.credits = DAILY_SCAN_ALLOWANCE
		}
		doc.creditsRenewedAt = new Date()
		await doc.save()
		return doc
	}

	doc.credits = DAILY_SCAN_ALLOWANCE
	doc.creditsRenewedAt = new Date()
	await doc.save()
	return doc
}
