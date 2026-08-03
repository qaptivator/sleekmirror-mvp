import mongoose, { Schema, model } from 'mongoose'

const fileSchema = new Schema(
	{
		user: {
			type: Schema.Types.ObjectId,
			ref: 'User',
			required: true,
			index: true,
		},
		filename: { type: String, required: true },
		mimeType: { type: String, required: true },
		sizeBytes: { type: Number, required: true },
		binaryData: { type: Buffer, required: true },
	},
	{ timestamps: true }
)

export const File = mongoose.models.File || model('File', fileSchema)
