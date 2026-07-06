import { Schema, model, ObjectId } from 'mongoose'

export default model(
	'User',
	new Schema(
		{
			first_name: { type: String },
			last_name: { type: String },
			identifiers: { type: [String], required: true },
			credits: { type: Number, required: true, default: 0 },
		},
		{ timestamps: true }
	)
)
