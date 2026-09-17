import mongoose, { Schema, model } from 'mongoose'

const userSchema = new Schema(
	{
		// identifiers: 'device:uuid', 'email:user@example.com'
		identifiers: { type: [String], required: true },

		// Email linked to account (optional)
		email: { type: String },
		emailVerified: { type: Boolean, default: false },

		// OTP state for email verification
		otpCode: { type: String }, // 6-digit code
		otpCreatedAt: { type: Date }, // when OTP was sent (expires in 10 min)
		otpAttempts: { type: Number, default: 0 }, // track failed attempts

		// User profile
		credits: { type: Number, required: true, default: 0 },
		firstName: { type: String },
		lastName: { type: String },
	},
	{ timestamps: true }
)

export const User = mongoose.models.User || model('User', userSchema)
