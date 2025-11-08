import mongoose from "mongoose";

const channelSchema = new mongoose.Schema(
    {   
        name: {
            type: String,
            required: true,
            trim: true,
            maxLength: 100,
        },
        handle: {
            type: String,
            trim: true,
            lowercase: true,
        },
        description: {
            type: String,
            maxLength: 2000,
        },
        owner: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true,
        },
        visibility: {
            type: String,
            enum: ["public", "private"],
            default: "private",
        },
        bannerImage: {
            type: String,
            default: "https://placehold.co/1000x400?text=Welcome+to+VideoTube+Channel"
        },
        links: [
            {
                label: String,
                url: String,
            }
        ],
        subscriberCount: {
            type: Number,
            default: 0,
        },
        viewsCount: {
            type: Number,
            default: 0,
        },
        totalWatchTime: {
            type: Number,
            default: 0,
        }
    },
    { timestamps: true }
);

channelSchema.set("toJSON", {
    transform: (_doc, ret) => {
        delete ret.__v;
        return ret;
    }
});

channelSchema.index({ owner: 1 });
channelSchema.index({ name: 1 });
channelSchema.index({ handle: 1 }, { unique: true, sparse: true });

export const Channel = mongoose.model('Channel', channelSchema);