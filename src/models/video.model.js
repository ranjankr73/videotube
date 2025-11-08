import mongoose from 'mongoose';

const videoSchema = new mongoose.Schema(
    {
        title: {
            type: String,
            required: true,
            trim: true,
            index: true,
        },
        videoFile: {
            type: String,
            required: true,
            unique: true,
        },
        thumbnail: {
            type: String,
            required: true,
        },
        duration: {
            type: Number,
            required: true,
        },
        description: {
            type: String,
            required: true,
        },
        channel: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Channel'
        },
        isPublished: {
            type: Boolean,
            default: false,
        },
        views: {
            type: Number,
            default: 0
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

export const Video = mongoose.model('Video', videoSchema);