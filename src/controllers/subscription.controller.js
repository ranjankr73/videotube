import mongoose, { isValidObjectId } from "mongoose";
import { Subscription } from "../models/subscription.model.js";
import { Channel } from "../models/channel.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const toggleSubscription = asyncHandler(async (req, res) => {
    const { channelId } = req.params;

    if (!isValidObjectId(channelId)) {
        throw new ApiError(400, "Invalid Channel ID");
    }

    const channel = await Channel.findById(channelId);
    if (!channel) {
        throw new ApiError(404, "Channel not found");
    }

    if (channel.owner.toString() === req.user._id.toString()) {
        throw new ApiError(400, "You cannot subscribe to your own channel");
    }

    const existingSubscription = await Subscription.findOne({
        subscriber: req.user._id,
        channel: channelId,
    });

    if (existingSubscription) {
        await Subscription.findByIdAndDelete(existingSubscription._id);

        await Channel.findByIdAndUpdate(channelId, {
            $inc: { subscriberCount: -1 },
        });

        return res.status(200).json(
            new ApiResponse(200, "Unsubscribed successfully", {
                subscribed: false,
            })
        );
    } else {
        await Subscription.create({
            subscriber: req.user._id,
            channel: channelId,
        });

        await Channel.findByIdAndUpdate(channelId, {
            $inc: { subscriberCount: 1 },
        });

        return res.status(200).json(
            new ApiResponse(200, "Subscribed successfully", {
                subscribed: true,
            })
        );
    }
});

const getUserChannelSubscribers = asyncHandler(async (req, res) => {
    const { channelId } = req.params;

    if (!isValidObjectId(channelId)) {
        throw new ApiError(400, "Invalid Channel ID");
    }

    const subscribers = await Subscription.aggregate([
        {
            $match: {
                channel: new mongoose.Types.ObjectId(channelId),
            },
        },
        {
            $lookup: {
                from: "users",
                localField: "subscriber",
                foreignField: "_id",
                as: "subscriberDetails",
                pipeline: [
                    {
                        $project: {
                            username: 1,
                            fullName: 1,
                            avatar: 1,
                        },
                    },
                ],
            },
        },
        {
            $unwind: "$subscriberDetails",
        },
        {
            $project: {
                _id: 1,
                subscriber: "$subscriberDetails",
                createdAt: 1,
            },
        },
    ]);

    return res
        .status(200)
        .json(
            new ApiResponse(
                200,
                "Subscribers fetched successfully",
                subscribers
            )
        );
});

const getSubscribedChannels = asyncHandler(async (req, res) => {
    const { subscriberId } = req.params;

    if (!isValidObjectId(subscriberId)) {
        throw new ApiError(400, "Invalid Subscriber ID");
    }

    const subscribedChannels = await Subscription.aggregate([
        {
            $match: {
                subscriber: new mongoose.Types.ObjectId(subscriberId),
            },
        },
        {
            $lookup: {
                from: "channels",
                localField: "channel",
                foreignField: "_id",
                as: "channelDetails",
                pipeline: [
                    {
                        $project: {
                            name: 1,
                            handle: 1,
                            avatar: 1,
                            bannerImage: 1,
                            subscriberCount: 1,
                        },
                    },
                ],
            },
        },
        {
            $unwind: "$channelDetails",
        },
        {
            $project: {
                _id: 1,
                channel: "$channelDetails",
                createdAt: 1,
            },
        },
    ]);

    return res
        .status(200)
        .json(
            new ApiResponse(
                200,
                "Subscribed channels fetched successfully",
                subscribedChannels
            )
        );
});

export { toggleSubscription, getUserChannelSubscribers, getSubscribedChannels };
