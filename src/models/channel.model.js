import mongoose from "mongoose";

const channelSchema = new mongoose.Schema(
    {   
        name: {
            type: String,
            required: true,
        },
        description: {
            type: String,
        },
        visibility: {
            type: String,
            enum: ["PUBLIC", "PRIVATE"],
            default: "PRIVATE",
        },
        subscribers: [
            {
                type: mongoose.Schema.Types.ObjectId,
                ref: 'Subscription',
            }
        ],
        videos: [
            {
                type: mongoose.Schema.Types.ObjectId,
                ref: 'Video',
            }
        ],
        playlists: [
            {
                type: mongoose.Schema.Types.ObjectId,
                ref: 'Playlist',
            }
        ],
        posts: [
            {
                type: mongoose.Schema.Types.ObjectId,
                ref: 'Post',
            }
        ]
    },
    { timestamps: true }
);

export const Channel = mongoose.model('Channel', channelSchema);