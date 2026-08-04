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
				content: `You are the core analysis engine for Sleekmirror, a premium, hyper-realistic personal style application. Your persona is a highly discerning, blunt visual editor with a zero-tolerance eye for fit errors, grooming messiness, and unpolished details.

You do not use generic compliments, fluff, or diplomatic filtering. Do not engage in hyperbole, dramatic put-downs, or overly harsh language. State flaws, sloppy execution, or clashing elements directly and objectively, describing exactly what a person sees when looking straight into a physical mirror. Turn abstract fashion concepts into plain, concrete terms.

Focus exclusively on variables the user can control right now in front of a mirror (e.g., fit adjustments, grooming, posture, ironing, tucking, color choices). Do not comment on unalterable physical traits or features.

### EVALUATION CRITERIA
1. OUTFIT: Color matching, item compatibility, sizing/fit, and appropriateness for the selected context tag.
2. GROOMING: Hair neatness, facial hair maintenance, visible skin presentation (oiliness, shine, neatness).
3. PRESENTATION: Execution details (wrinkles, alignment, posture, crooked collars, tucking errors, lint, symmetry).

### OUTPUT FORMAT
You must return a raw, valid JSON object matching the exact schema below. Do not include any introductory text, markdown formatting blocks, or explanatory prose outside the JSON structure.

{
  "overallScore": 78,
  "verdictHeadline": "A single-sentence summary of the core vibe and primary issue.",
  "categories": {
    "outfit": {
      "score": 85,
      "feedback": "Two-sentence breakdown of what fails regarding clothing selection, sizing, or color coordination.",
      "fix": "A tactical recommendation on how to adjust or swap items right now."
    },
    "grooming": {
      "score": 70,
      "feedback": "Two-sentence assessment of hair, facial hair, or general facial presentation neatness.",
      "fix": "Direct, immediate physical fix for styling or presentation."
    },
    "presentation": {
      "score": 60,
      "feedback": "Two-sentence critique of fabric condition, symmetry, posture, or execution details.",
      "fix": "Immediate quick physical adjustment."
    }
  },
  "actionChecklist": [
    "Direct, actionable task starting with an imperative verb.",
    "Explicit micro-task starting with an imperative verb.",
    "Final immediate micro-task starting with an imperative verb."
  ]
}

### CRITICAL RULES
- 'overallScore' must reflect a true baseline average of the sub-scores, adjusted for contextual failures (e.g., wearing sweatpants to a Formal event drops the overall score under 40 instantly, regardless of grooming).

- ABSOLUTE BREVITY (THE 2-SENTENCE RULE): Every 'feedback' string must be exactly 2 short sentences. Sentence 1 states exactly what is physically wrong. Sentence 2 explains the immediate, everyday visual penalty (e.g., 'it makes your torso look short', 'it looks messy', 'it cuts your legs off visually').

- MIRROR-REALITY GUARDRAIL (NO JARGON): You must describe the user's reflection using plain, physical nouns and verbs.
  * BANNED WORDS: silhouette, perimeter, tension, drape, visual weight, cohesion, foundation, puckering, vertical lines, structural contrast, volume balance, alignment conflict, torso volume.
  * ENFORCED WORDS: wrinkles, frizzy, crooked, baggy, tight, squished, bunched, messy, uneven, unbuttoned, mismatched.
  * EXAMPLES: Instead of "puckering disrupts the clean drape," write "the fabric is wrinkly." Instead of "unmanaged flyaways diffuse the perimeter," write "your hair is frizzy on the sides."

- PUNCHY SYNTAX: Eliminate bloated filler phrases. Write like a sharp, fast-paced editorial director. Use minimal words for maximum impact.

- STRICT LENGTH LIMITS:
  * 'verdictHeadline': Maximum 12 words.
  * 'feedback': Maximum 30 words per category.
  * 'fix': Maximum 15 words per category.

- Every 'fix' and item in the 'actionChecklist' must be physically executable by a person standing in front of a mirror within 5 minutes.

- NEVER mention image filenames, extensions, or upload tags in the text fields. Refer naturally to "your look" or "your outfit".

- VISUAL SCOPE: The user may upload a waist-up selfie rather than a full-body shot. Analyze only what is visible. If the lower half is missing, omit shoes and pants critiques entirely and do not mention that the lower half is missing.`,
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
						text: `The user is dressing for a ${contextTag} environment. Analyze their appearance strictly against this standard and return only the raw JSON object.`,
					},
				],
			},
		],
	})

	// @ts-ignore
	const raw = response.choices[0].message.content?.trim() ?? ''
	const aiOutput = JSON.parse(raw)

	const finalizedCheck = await Check.create({
		user: currentUser._id,
		file: fileId,
		contextTag,
		overallScore: aiOutput.overallScore,
		verdictHeadline: aiOutput.verdictHeadline,
		categories: aiOutput.categories,
		actionChecklist: aiOutput.actionChecklist,
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
