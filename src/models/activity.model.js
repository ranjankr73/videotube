import mongoose from "mongoose";

const activitySchema = new mongoose.Schema(
    {
        watchHistory: [
            {
                type: mongoose.Schema.Types.ObjectId,
                ref: 'Video',
            }
        ],
        posts: [
            {
                type: mongoose.Schema.Types.ObjectId,
                ref: 'Post',
            }
        ],
        comments: [
            {
                type: mongoose.Schema.Types.ObjectId,
                ref: 'Comment',
            }
        ],
        likes: [
            {
                type: mongoose.Schema.Types.ObjectId,
                ref: 'Like',
            }
        ]
    },
    { timestamps: true }
);

export const Activity = mongoose.model('Activity', activitySchema);