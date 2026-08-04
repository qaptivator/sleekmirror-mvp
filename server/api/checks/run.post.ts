import { Check } from '../../models/Check'
import { User } from '../../models/User'
import { File } from '../../models/File'
import OpenAI from 'openai'

export default defineEventHandler(async (event) => {
	const currentUser = event.context.user
	if (!currentUser) {
		throw createError({ statusCode: 401, statusMessage: 'Unauthorized' })
	}

	const { fileId, contextTag } = await readBody(event)
	if (!fileId || !contextTag) {
		throw createError({ statusCode: 400, statusMessage: 'Missing parameters' })
	}

	const config = useRuntimeConfig()
	if (!config.openaiApiKey) {
		console.error('OpenAI Connection Error: OpenAI API Key not provided')
	}
	const client = new OpenAI({
		apiKey: config.openaiApiKey,
	})

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
	if (!userRecord || userRecord.credits <= 0) {
		throw createError({
			statusCode: 402,
			statusMessage: 'Insufficient scan credits',
		})
	}

	/*const mockEngineOutput = {
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
	}*/

	const base64Image = sourceFile.binaryData.toString('base64')
	const dataUrl = `data:${sourceFile.mimeType};base64,${base64Image}`

	const response = await client.chat.completions.create({
		model: 'gpt-4o',
		max_tokens: 1000,
		messages: [
			{
				role: 'system',
				content: `You are a professional style consultant and appearance coach.
You give honest, specific, and actionable feedback.
Never be vague. Never be generic.
Every fix must be physically executable in under 2 minutes.
Return ONLY valid raw JSON with no markdown, no backticks, no explanation.`,
			},
			{
				role: 'user',
				content: [
					{
						type: 'image_url',
						image_url: {
							url: dataUrl,
							detail: 'high',
						},
					},
					{
						type: 'text',
						text: `Analyze this person's appearance and return this exact JSON shape:
{
  "overallScore": <0-100>,
  "verdictHeadline": <one punchy sentence summary>,
  "categories": {
    "outfit": {
      "score": <0-100>,
      "feedback": <2-3 sentences of honest observation>,
      "fix": <exact physical action to do right now>
    },
    "grooming": {
      "score": <0-100>,
      "feedback": <2-3 sentences of honest observation>,
      "fix": <exact physical action to do right now>
    },
    "presentation": {
      "score": <0-100>,
      "feedback": <2-3 sentences of honest observation>,
      "fix": <exact physical action to do right now>
    }
  },
  "actionChecklist": [<3 specific tasks to do before leaving>]
}`,
					},
				],
			},
		],
	})

	const raw = response.choices[0].message.content
	const aiOutput = JSON.parse(raw)

	const finalizedCheck = await Check.create({
		user: currentUser._id,
		file: fileId,
		contextTag,
		...aiOutput,
	})

	await User.findByIdAndUpdate(
		currentUser._id,
		{
			$inc: { credits: -1 },
		},
		// @ts-ignore
		{}
	)

	return finalizedCheck.toObject()
})
