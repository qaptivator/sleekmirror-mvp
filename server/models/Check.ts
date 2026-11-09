import mongoose, { Schema, model } from 'mongoose'

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
		contextTag: { type: String, required: true },

		photoUsable: { type: Boolean, required: true, default: true },
		photoIssue: { type: String, default: '' },

		overallScore: { type: Number, required: true, min: 0, max: 100 },
		contextPenalty: { type: Number, default: 0, min: 0, max: 100 },

		verdictHeadline: { type: String, default: '' },
		topFix: { type: String, default: '' },
		categories: {
			outfit: { type: categorySchema, required: false },
			grooming: { type: categorySchema, required: false },
			presentation: { type: categorySchema, required: false },
		},
		actionChecklist: {
			type: [String],
			default: [],
		},
	},
	{ timestamps: true }
)

// Re-register on hot reload so new fields are not stripped by a cached schema.
if (mongoose.models.Check) {
	mongoose.deleteModel('Check')
}
export const Check = model('Check', checkSchema)
