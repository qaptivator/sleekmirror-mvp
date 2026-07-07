import mongoose, { Schema, model } from 'mongoose'

const userSchema = new Schema(
	{
		identifiers: { type: [String], required: true },
		credits: { type: Number, required: true, default: 0 },
		first_name: { type: String },
		last_name: { type: String },
	},
	{ timestamps: true }
)

export const User = mongoose.models.User || model('User', userSchema)
