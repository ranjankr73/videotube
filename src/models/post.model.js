import mongoose from "mongoose";

const postSchema = new mongoose.Schema(
    {
        content: {
            type: String,
            required: true,
            trim: true,
        },
        media: [
            {
                type: String,
                trim: true,
            }
        ],
        author: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Channel',
            required: true,
        },
        visibility: {
            type: String,
            enum: ["PUBLIC", "PRIVATE", "UNLISTED"],
            default: "PUBLIC",
        },
        likesCount: {
            type: Number,
            default: 0,
        },
        commentsCount: {
            type: Number,
            default: 0,
        },
        viewsCount: {
            type: Number,
            default: 0,
        },
        sharesCount: {
            type: Number,
            default: 0,
        },
        isEnabled: {
            type: Boolean,
            default: true,
        }
    },
    { timestamps: true }
);

postSchema.set("toJSON", {
    transform: (_doc, ret) => {
        delete ret.__v;
        return ret;
    }
});

postSchema.index({ author: 1, createdAt: -1 });
postSchema.index({ content: "text" });

export const Post = mongoose.model('Post', postSchema);