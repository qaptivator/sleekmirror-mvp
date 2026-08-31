import mongoose from 'mongoose'
import { User } from '../models/User'

export default defineEventHandler(async (event) => {
	/*if (event.path.startsWith('/api/')) {
		const authHeader = getRequestHeader(event, 'authorization')

		if (authHeader && authHeader.startsWith('Bearer ')) {
			const token = authHeader.substring(7).trim()

			// look up user directly by the identifier passed in token (or handle JWT here later)
			const user = await User.findOne({ identifiers: token }).lean()
			if (user) {
				event.context.user = user
				return
			}
		}

		event.context.user = undefined
	} else {
		event.context.user = undefined
	}*/
	if (event.path.startsWith('/api/')) {
		//const authHeader = getRequestHeader(event, 'authorization')
		// inject custom data into the context (similar to setting ctx.meta)
		//event.context.user = authHeader ? { authenticated: true } : null
		// simulate user auth and resolving
		event.context.user = {
			_id: new mongoose.Types.ObjectId('6a4bb0da27b09ebd780971a8'),
			identifiers: ['email:user@example.com'],
			credits: 10,
			firstName: 'John',
			lastName: 'Doe',
		}
	} else {
		event.context.user = undefined
	}
})
