import { Schema, model, models } from 'mongoose'

const fileSchema = new Schema(
	{
		user: {
			type: Schema.Types.ObjectId,
			ref: 'User',
			required: true,
			index: true,
		},
		filename: { type: String, required: true },
		mime_type: { type: String, required: true },
		size_bytes: { type: Number, required: true },
		binary_data: { type: Buffer, required: true },
	},
	{ timestamps: true }
)

export const FileModel = models.File || model('File', fileSchema)
