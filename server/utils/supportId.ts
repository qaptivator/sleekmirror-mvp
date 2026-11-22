import { User } from '../models/User'

// No 0, O, 1, I, or L — easier to read over the phone.
const ALPHABET = '23456789ABCDEFGHJKMNPQRSTUVWXYZ'

export function generateSupportId(length = 10) {
	let out = ''
	const bytes = new Uint8Array(length)
	crypto.getRandomValues(bytes)
	for (let i = 0; i < length; i++) {
		out += ALPHABET[bytes[i] % ALPHABET.length]
	}
	return out
}

export async function ensureSupportId(user: any) {
	if (!user) return user
	const doc =
		typeof user.save === 'function' ? user : await User.findById(user._id)
	if (!doc) return user
	if (doc.supportId) return doc

	for (let attempt = 0; attempt < 8; attempt++) {
		doc.supportId = generateSupportId()
		try {
			await doc.save()
			return doc
		} catch (err: any) {
			if (err?.code !== 11000) throw err
		}
	}

	throw createError({
		statusCode: 500,
		statusMessage: 'Could not assign support ID',
	})
}
