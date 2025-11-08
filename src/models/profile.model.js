import mongoose from "mongoose";

const profileSchema = new mongoose.Schema(
    {
        avatar: {
            type: String,
            default: "https://avatar.iran.liara.run/public"
        },
        coverImage: {
            type: String,
            default: "https://placehold.co/1000x400?text=Welcome+to+VideoTube"
        },
        bio: {
            type: String,
            maxLength: 300,
        },
        location: {
            type: String,
        },
        socialLinks: {
            youtube: String,
            twitter: String,
            instagram: String,
            website: String,
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
                ref: 'Channel'
            }
        ],
    },
    { timestamps: true }
);

profileSchema.set("toJSON", (_doc, ret) => {
    delete ret.__v;
    return ret;
});

profileSchema.index({ channel: 1 }, { unique: true, sparse: true });

export const Profile = mongoose.model('Profile', profileSchema);