import { Schema, model, ObjectId } from 'mongoose'

export default model(
	'User',
	new Schema(
		{
			firstName: { type: String },
			lastName: { type: String },
			identifiers: { type: [String], required: true },
		},
		{ timestamps: true }
	)
)
