import mongoose from "mongoose";

const playlistSchema = new mongoose.Schema(
    {
        title: {
            type: String,
            required: true,
            trim: true,
        },
        description: {
            type: String,
            trim: true,
        },
        thumbnail: {
            type: String,
        },
        visibility: {
            type: String,
            enum: ["PUBLIC", "PRIVATE", "UNLISTED"],
            default: "PRIVATE",
        },
        videos: [
            {
                video: {
                    type: mongoose.Schema.Types.ObjectId,
                    ref: 'Video',
                },
                position: { 
                    type: Number 
                },
                addedAt: { 
                    type: Date, 
                    default: Date.now 
                },
            }
        ],
        owner: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true,
        },
        channel: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Channel',
        },
        viewsCount: {
            type: Number,
            default: 0,
        },
        likesCount: {
            type: Number,
            default: 0,
        },
    },
    { timestamps: true }
);

playlistSchema.set("toJSON", {
    transform: (_doc, ret) => {
        delete ret.__v;
        return ret;
    }
});

playlistSchema.index({ owner: 1 });
playlistSchema.index({ channel: 1 });

export const Playlist = mongoose.model('Playlist', playlistSchema);