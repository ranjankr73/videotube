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
        videos: [
            {
                type: mongoose.Schema.Types.ObjectId,
                ref: 'Video',
            }
        ],
        channel: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Channel',
        }
    },
    { timestamps: true }
);

export const Playlist = mongoose.model('Playlist', playlistSchema);