import OpenAI from 'openai'
import { Check } from '../../models/Check'
import { User } from '../../models/User'
import { File } from '../../models/File'

export default defineEventHandler(async (event) => {
	// these are not even sent when i click to scan on the frontend, oh my...
	// anyway, im gonna handle this later
	console.log('run.post.ts')
	const currentUser = event.context.user
	if (!currentUser) {
		throw createError({ statusCode: 401, statusMessage: 'Unauthorized' })
	}

	const { file_id, context_tag } = await readBody(event)
	if (!file_id || !context_tag) {
		throw createError({ statusCode: 400, statusMessage: 'Missing parameters' })
	}

	// Use the clean 'user' field path matching your relational references
	const sourceFile = await File.findOne({
		_id: file_id,
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

	const config = useRuntimeConfig()
	const openaiApiKey = config.openaiApiKey
	if (!openaiApiKey) {
		throw createError({
			statusCode: 500,
			statusMessage: 'OpenAI API key not configured',
		})
	}

	const client = new OpenAI({ apiKey: openaiApiKey })

	// Convert binary data to base64 for OpenAI API
	const base64Image = sourceFile.binary_data.toString('base64')

	// Call OpenAI Vision API
	const response = await client.chat.completions.create({
		model: 'gpt-4-vision',
		messages: [
			{
				role: 'user',
				content: [
					{
						type: 'image_url',
						image_url: {
							url: `data:${sourceFile.mime_type};base64,${base64Image}`,
						},
					},
					{
						type: 'text',
						text: `You are a professional image appearance analyst specializing in ${context_tag}. 
Analyze this image and provide detailed feedback in the following JSON format (respond ONLY with valid JSON, no additional text):
{
  "overall_score": <number 0-100>,
  "verdict_headline": "<brief summary>",
  "categories": {
    "outfit": {
      "score": <number 0-100>,
      "feedback": "<detailed feedback>",
      "fix": "<specific improvement advice>"
    },
    "grooming": {
      "score": <number 0-100>,
      "feedback": "<detailed feedback>",
      "fix": "<specific improvement advice>"
    },
    "presentation": {
      "score": <number 0-100>,
      "feedback": "<detailed feedback>",
      "fix": "<specific improvement advice>"
    }
  },
  "action_checklist": ["<actionable item 1>", "<actionable item 2>", "<actionable item 3>"]
}`,
					},
				],
			},
		],
		max_tokens: 1024,
	})

	const contentBlock = response.choices[0].message.content
	if (!contentBlock || typeof contentBlock !== 'string') {
		throw createError({
			statusCode: 500,
			statusMessage: 'Invalid response from OpenAI',
		})
	}

	console.log('contentBlock', contentBlock)

	// Parse the JSON response from OpenAI
	let engineOutput
	try {
		engineOutput = JSON.parse(contentBlock)
	} catch (e) {
		throw createError({
			statusCode: 500,
			statusMessage: 'Failed to parse OpenAI response',
		})
	}

	const finalizedCheck = await Check.create({
		user: currentUser._id,
		file: file_id,
		context_tag,
		...engineOutput,
	})

	await User.findByIdAndUpdate(
		currentUser._id,
		{
			$inc: { credits: -1 },
		},
		{}
	)

	return finalizedCheck
})
