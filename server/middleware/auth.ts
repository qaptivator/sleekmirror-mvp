import mongoose from 'mongoose'

export default defineEventHandler((event) => {
	if (event.path.startsWith('/api/')) {
		//const authHeader = getRequestHeader(event, 'authorization')
		// inject custom data into the context (similar to setting ctx.meta)
		//event.context.user = authHeader ? { authenticated: true } : null
		// simulate user auth and resolving
		event.context.user = {
			_id: new mongoose.Types.ObjectId('6a4bb0da27b09ebd780971a8'),
			identifiers: ['email:user@example.com'],
			creidts: 10,
			firstName: 'John',
			lastName: 'Doe',
		}
	} else {
		event.context.user = undefined
	}
})
