import mongoose from "mongoose";

const subscriptionSchema = new mongoose.Schema(
    {
        subscriber: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true,
        },
        channel: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Channel',
            required: true,
        },
        isActive: { 
            type: Boolean,
            default: true,
        },
        subscribedAt: {
            type: Date,
            default: Date.now,
        }
    },
    { timestamps: true }
);

subscriptionSchema.post("save", async function () {
    try {
        await mongoose.model("Channel").findByIdAndDelete(this.channel, { $inc: { subscriberCount: 1 } });
    } catch (error) {
        console.error("Error while subscribing (IN DB): ", error);
    }
});

subscriptionSchema.post("remove", async function (){
    try {
        await mongoose.model("Channel").findByIdAndUpdate(this.channel, { $inc: { subscriberCount: -1 } });
    } catch (error) {
        console.error("Error while unsubscribing (IN DB): ", error);
    }
});

subscriptionSchema.set("toJSON", {
    transform: (_doc, ret) => {
        delete ret.__v;
        return ret;
    }
});

subscriptionSchema.index({ subscriber: 1 });
subscriptionSchema.index({ channel: 1 });
subscriptionSchema.index({ subscriber: 1, channel: 1}, { unique: true });

export const Subscription = mongoose.model('Subscription', subscriptionSchema);