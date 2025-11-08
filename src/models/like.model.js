import mongoose from "mongoose";

const likeSchema = new mongoose.Schema(
    {
        author: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true,
        },
        targetType: {
            type: String,
            enum: ["VIDEO", "COMMENT", "POST"],
            required: true
        },
        video: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Video',
        },
        comment: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Comment',
        },
        post: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Post',
        }
    },
    { timestamps: true }
);

likeSchema.set("toJSON", {
    transform: (_doc, ret) => {
        delete ret.__v;
        return ret;
    }
});

likeSchema.index({ author: 1 });
likeSchema.index({ targetType: 1 });
likeSchema.index({ video: 1 });
likeSchema.index({ comment: 1 });
likeSchema.index({ post: 1 });
likeSchema.index({ author: 1, video: 1 }, { unique: true, partialFilterExpression: { video: { $exists: true } } });
likeSchema.index({ author: 1, comment: 1 }, { unique: true, partialFilterExpression: { comment: { $exists: true } } });
likeSchema.index({ author: 1, post: 1 }, { unique: true, partialFilterExpression: { post: { $exists: true } } });

export const Like = mongoose.model('Like', likeSchema);