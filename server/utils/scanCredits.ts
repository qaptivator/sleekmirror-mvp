import { User } from '../models/User'
import { DAILY_SCAN_ALLOWANCE, utcDayKey } from '#shared/utils/scans'

function startOfUtcDay(date = new Date()) {
	return new Date(`${utcDayKey(date)}T00:00:00.000Z`)
}

export async function applyDailyScanRenewal(user: any) {
	if (!user) return user

	const start = startOfUtcDay()
	const renewed = await User.findOneAndUpdate(
		{
			_id: user._id,
			$or: [
				{ creditsRenewedAt: { $exists: false } },
				{ creditsRenewedAt: null },
				{ creditsRenewedAt: { $lt: start } },
			],
		},
		{
			$set: {
				credits: DAILY_SCAN_ALLOWANCE,
				creditsRenewedAt: new Date(),
			},
		},
		{ new: true }
	)

	if (renewed) return renewed
	if (typeof user.save === 'function' && user.creditsRenewedAt) {
		const lastKey = utcDayKey(new Date(user.creditsRenewedAt))
		if (lastKey === utcDayKey()) return user
	}
	return (await User.findById(user._id)) || user
}

export async function tryDecrementScanCredit(userId: unknown) {
	return User.findOneAndUpdate(
		{ _id: userId, credits: { $gt: 0 } },
		{ $inc: { credits: -1 } },
		{ new: true }
	)
}
