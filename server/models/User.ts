import mongoose, { Schema, model } from 'mongoose'

const userSchema = new Schema(
	{
		identifiers: { type: [String], required: true },
		credits: { type: Number, required: true, default: 0 },
		firstName: { type: String },
		lastName: { type: String },
	},
	{ timestamps: true }
)

export const User = mongoose.models.User || model('User', userSchema)
