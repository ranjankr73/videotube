import mongoose from "mongoose";

const commentSchema = new mongoose.Schema(
    {
        content: {
            type: String,
            required: true,
            trim: true,
        },
        author: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
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
                ref: 'Comment'
            }
        ],
        isEnabled: { // Whether others can add comment or not
            type: Boolean,
            default: true,
        }
    },
    { timestamps: true }
);

export const Comment = mongoose.model('Comment', commentSchema);