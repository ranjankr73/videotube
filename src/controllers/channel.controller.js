import { Channel } from "../models/channel.model.js";
import { Video } from "../models/video.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { uploadOnCloudinary, deleteFromCloudinary } from "../utils/cloudinary.js";

const createChannel = asyncHandler(async (req, res) => {
    const { name, handle, description } = req.body;

    if (!name || !handle) {
        throw new ApiError(400, "Name and Handle are required");
    }

    const existingChannel = await Channel.findOne({ owner: req.user._id });
    if (existingChannel) {
        throw new ApiError(409, "You already own a channel");
    }

    const handleTaken = await Channel.findOne({ handle: handle.toLowerCase() });
    if (handleTaken) {
        throw new ApiError(409, "Handle is already taken");
    }

    const channel = await Channel.create({
        name,
        handle: handle.toLowerCase(),
        description: description || "",
        owner: req.user._id
    });

    return res
        .status(201)
        .json(new ApiResponse(201, "Channel created successfully", channel));
});

const getChannelByHandle = asyncHandler(async (req, res) => {
    const { handle } = req.params;

    if (!handle) throw new ApiError(400, "Handle is required");

    const channel = await Channel.aggregate([
        {
            $match: {
                handle: handle.toLowerCase()
            }
        },
        {
            $lookup: {
                from: "users",
                localField: "owner",
                foreignField: "_id",
                as: "ownerDetails",
                pipeline: [
                    {
                        $project: {
                            fullName: 1,
                            email: 1,
                            avatar: 1
                        }
                    }
                ]
            }
        },
        { $unwind: "$ownerDetails" },
        {
            $project: {
                name: 1,
                handle: 1,
                description: 1,
                bannerImage: 1,
                subscriberCount: 1,
                viewsCount: 1,
                links: 1,
                ownerDetails: 1,
                createdAt: 1
            }
        }
    ]);

    if (!channel?.length) {
        throw new ApiError(404, "Channel not found");
    }

    return res
        .status(200)
        .json(new ApiResponse(200, "Channel fetched successfully", channel[0]));
});

const getChannelStats = asyncHandler(async (req, res) => {
    const channel = await Channel.findOne({ owner: req.user._id });
    if (!channel) {
        throw new ApiError(404, "Channel not found");
    }

    const stats = await Video.aggregate([
        {
            $match: {
                channel: channel._id
            }
        },
        {
            $group: {
                _id: null,
                totalVideos: { $sum: 1 },
                totalViews: { $sum: "$views" },
                totalLikes: { $sum: "$likesCount" }
            }
        }
    ]);

    const channelStats = stats[0] || { totalVideos: 0, totalViews: 0, totalLikes: 0 };

    return res
        .status(200)
        .json(new ApiResponse(200, "Dashboard stats fetched", {
            ...channelStats,
            subscriberCount: channel.subscriberCount
        }));
});

const updateChannelDetails = asyncHandler(async (req, res) => {
    const { name, description, handle, links } = req.body;

    const channel = await Channel.findOne({ owner: req.user._id });
    if (!channel) throw new ApiError(404, "Channel not found");

    if (handle && handle.toLowerCase() !== channel.handle) {
        const isTaken = await Channel.findOne({ handle: handle.toLowerCase() });
        if (isTaken) throw new ApiError(409, "Handle already taken");
        channel.handle = handle.toLowerCase();
    }

    if (name) channel.name = name;
    if (description) channel.description = description;
    if (links) channel.links = links;

    await channel.save();

    return res
        .status(200)
        .json(new ApiResponse(200, "Channel updated successfully", channel));
});

const updateChannelBanner = asyncHandler(async (req, res) => {
    const bannerLocalPath = req.file?.path;

    if (!bannerLocalPath) {
        throw new ApiError(400, "Banner file is missing");
    }

    const channel = await Channel.findOne({ owner: req.user._id });
    if (!channel) throw new ApiError(404, "Channel not found");

    const banner = await uploadOnCloudinary(bannerLocalPath);
    if (!banner.url) throw new ApiError(500, "Error uploading banner");

    const isDefault = channel.bannerImage.includes("placehold.co");
    if (!isDefault && channel.bannerImage) {
        await deleteFromCloudinary(channel.bannerImage);
    }

    channel.bannerImage = banner.url;
    await channel.save();

    return res
        .status(200)
        .json(new ApiResponse(200, "Banner updated successfully", { 
            bannerImage: channel.bannerImage 
        }));
});

const deleteChannel = asyncHandler(async (req, res) => {
    const channel = await Channel.findOne({ owner: req.user._id });
    if (!channel) throw new ApiError(404, "Channel not found");

    const videos = await Video.find({ channel: channel._id });
    
    const deletionPromises = videos.map(async (video) => {
        await deleteFromCloudinary(video.videoFile, "video");
        await deleteFromCloudinary(video.thumbnail, "image");
    });
    await Promise.all(deletionPromises);

    await Video.deleteMany({ channel: channel._id });

    await Channel.findByIdAndDelete(channel._id);

    return res
        .status(200)
        .json(new ApiResponse(200, "Channel and all content deleted successfully", {}));
});

export {
    createChannel,
    getChannelByHandle,
    getChannelStats,
    updateChannelDetails,
    updateChannelBanner,
    deleteChannel
};