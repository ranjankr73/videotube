import mongoose from 'mongoose';

const videoSchema = new mongoose.Schema(
    {
        title: {
            type: String,
            required: true,
            trim: true,
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
            ref: 'Channel',
            required: true,
        },
        visibility: {
            type: String, 
            enum: ["PUBLIC", "PRIVATE", "UNLISTED"],
            default: "PRIVATE",
        },
        isPublished: {
            type: Boolean,
            default: false,
        },
        publishedAt: {
            type: Date
        },
        views: {
            type: Number,
            default: 0
        },
        likesCount: {
            type: Number,
            default: 0,
        },
        commentsCount: {
            type: Number,
            default: 0,
        },
        tags: [
            {
                type: String,
                trim: true,
            }
        ],
        category: {
            type: String,
            trim: true,
        },
        isEnabled: {
            type: Boolean,
            default: true,
        }
    },
    { timestamps: true }
);

videoSchema.set("toJSON", {
    transform: (_doc, ret) => {
        delete ret.__v;
        return ret;
    }
});

videoSchema.index({ title: "text", description: "text" });
videoSchema.index({ channel: 1 });
videoSchema.index({ category: 1 });

export const Video = mongoose.model('Video', videoSchema);