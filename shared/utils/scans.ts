export const DAILY_SCAN_ALLOWANCE = 10

export function utcDayKey(date = new Date()) {
	return date.toISOString().slice(0, 10)
}

export function nextUtcMidnight(from = new Date()) {
	const next = new Date(from)
	next.setUTCHours(24, 0, 0, 0)
	return next
}
