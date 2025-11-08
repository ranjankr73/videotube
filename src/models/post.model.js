import mongoose from "mongoose";

const postSchema = new mongoose.Schema(
    {
        content: {
            type: String,
            required: true,
            trim: true,
        },
        media: {
            type: String,
        },
        author: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Channel',
        },
        likes: [
            {
                type: mongoose.Schema.Types.ObjectId,
                ref: 'Like',
            }
        ],
        comments: [
            {
                type: mongoose.Schema.Types.ObjectId,
                ref: 'Comment',
            }
        ],
        isEnabled: {
            type: Boolean,
            default: true,
        }
    },
    { timestamps: true }
);

export const Post = mongoose.model('Post', postSchema);