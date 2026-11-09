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
		creditsRenewedAt: { type: Date },
		firstName: { type: String },
		lastName: { type: String },

		aiPhotoConsent: { type: Boolean, default: false },
		aiPhotoConsentAt: { type: Date },
		aiPhotoConsentWithdrawnAt: { type: Date },
		consentVersion: { type: String },
		ageConfirmed: { type: Boolean, default: false },
	},
	{ timestamps: true }
)

if (mongoose.models.User) {
	mongoose.deleteModel('User')
}
export const User = model('User', userSchema)
