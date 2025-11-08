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
            required: true,
        },
        video: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Video',
        },
        post: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Post',
        },
        parentComment: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Comment',
        },
        likesCount: {
            type: Number,
            default: 0,
        },
        isEnabled: { // Whether others can add comment or not
            type: Boolean,
            default: true,
        },
        isDeleted: {
            type: Boolean,
            default: false,
        },
        isPinned: {
            type: Boolean,
            default: false,
        },
    },
    { timestamps: true }
);

commentSchema.set("toJSON", {
    transform: (_doc, ret) => {
        delete ret.__v;
        return ret;
    }
});

commentSchema.index({ author: 1 });
commentSchema.index({ video: 1 });
commentSchema.index({ post: 1 });
commentSchema.index({ content: "text" });
commentSchema.index({ video: 1, createdAt: -1 });

export const Comment = mongoose.model('Comment', commentSchema);