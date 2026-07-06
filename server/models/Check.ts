import { Schema, model, models } from 'mongoose'

const categorySchema = new Schema(
	{
		score: { type: Number, required: true, min: 0, max: 100 },
		feedback: { type: String, required: true },
		fix: { type: String, required: true },
	},
	{ _id: false }
)

const checkSchema = new Schema(
	{
		user: {
			type: Schema.Types.ObjectId,
			ref: 'User',
			required: true,
			index: true,
		},
		file: { type: Schema.Types.ObjectId, ref: 'File', required: true },
		context_tag: { type: String, required: true },

		overall_score: { type: Number, required: true, min: 0, max: 100 },

		verdict_headline: { type: String, required: true },
		categories: {
			outfit: { type: categorySchema, required: true },
			grooming: { type: categorySchema, required: true },
			presentation: { type: categorySchema, required: true },
		},
		action_checklist: {
			type: [String],
			required: true,
			default: [],
		},
	},
	{ timestamps: true }
)

// export with Nuxt-friendly Dev HMR Guard
export const Check = models.Check || model('Check', checkSchema)
