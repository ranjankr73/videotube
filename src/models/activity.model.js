import mongoose from "mongoose";

const activitySchema = new mongoose.Schema(
    {   
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true,
        },
        targetType: {
            type: String,
            enum: ["WATCH", "LIKE", "COMMENT", "POST"],
            required: true,
        },
        video: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Video',
        },
        likes: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Like',
        },
        comments: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Comment',
        },
        posts: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Post',
        },
    },
    { timestamps: true }
);

activitySchema.set("toJSON", {
    transform: (_doc, ret) => {
        delete ret.__v;
        return ret;
    }
});

activitySchema.index({ user: 1 , createdAt: -1 });
activitySchema.index({ targetType: 1, createdAt: -1 });

export const Activity = mongoose.model('Activity', activitySchema);