import { Check } from '../../models/Check'
import { User } from '../../models/User'
import { File } from '../../models/File'

export default defineEventHandler(async (event) => {
	const currentUser = event.context.user
	if (!currentUser) {
		throw createError({ statusCode: 401, statusMessage: 'Unauthorized' })
	}

	const { fileId, contextTag } = await readBody(event)
	if (!fileId || !contextTag) {
		throw createError({ statusCode: 400, statusMessage: 'Missing parameters' })
	}

	// Use the clean 'user' field path matching your relational references
	const sourceFile = await File.findOne({
		_id: fileId,
		user: currentUser._id,
	})
	if (!sourceFile) {
		throw createError({
			statusCode: 404,
			statusMessage: 'Target image not found or access denied',
		})
	}

	const userRecord = await User.findById(currentUser._id)
	if (!userRecord || userRecord.scan_credits <= 0) {
		throw createError({
			statusCode: 402,
			statusMessage: 'Insufficient scan credits',
		})
	}

	const mockEngineOutput = {
		overallScore: 85,
		verdictHeadline:
			'Clean shoulder alignment, but your shirt collar lines need adjustment.',
		categories: {
			outfit: { score: 90, feedback: 'Excellent fitting.', fix: 'None.' },
			grooming: { score: 80, feedback: 'Clean finish.', fix: 'None.' },
			presentation: {
				score: 65,
				feedback: 'Collar is warped on the left side.',
				fix: 'Straighten left collar point flush.',
			},
		},
		actionChecklist: ['Straighten left collar point flush before leaving.'],
	}

	const finalizedCheck = await Check.create({
		user: currentUser._id,
		file: fileId,
		contextTag,
		...mockEngineOutput,
	})

	await User.findByIdAndUpdate(
		currentUser._id,
		{
			$inc: { scan_credits: -1 },
		},
		{}
	)

	return finalizedCheck
})
