import mongoose from "mongoose";

const profileSchema = new mongoose.Schema(
    {
        avatar: {
            type: String,
        },
        coverImage: {
            type: String,
        },
        isChannelEnabled: {
            type: Boolean,
            default: false,
        },
        channel : {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Channel',
        },
        subscribedChannels: [
            {
                type: mongoose.Schema.Types.ObjectId,
                ref: 'Subscription'
            }
        ],
        activities: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Activity'
        },
    },
    { timestamps: true }
);

export const Profile = mongoose.model('Profile', profileSchema);