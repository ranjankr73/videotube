import mongoose, { isValidObjectId } from "mongoose";
import { Video } from "../models/video.model.js";
import { Channel } from "../models/channel.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { uploadOnCloudinary, deleteFromCloudinary } from "../utils/cloudinary.js";

const getAllVideos = asyncHandler(async (req, res) => {
    const { 
        page = 1, 
        limit = 10, 
        query, 
        sortBy = "createdAt", 
        sortType = "desc", 
        userId 
    } = req.query;

    const pipeline = [];

    if (query) {
        pipeline.push({
            $match: {
                $text: { $search: query }
            }
        });
    }

    if (userId) {
        if (!isValidObjectId(userId)) throw new ApiError(400, "Invalid User ID");
        
        const channel = await Channel.findOne({ owner: userId });
        if(channel) {
             pipeline.push({ $match: { channel: channel._id } });
        }
    }

    pipeline.push({
        $match: {
            isPublished: true,
            visibility: "PUBLIC"
        }
    });

    pipeline.push({
        $sort: {
            [sortBy]: sortType === "asc" ? 1 : -1
        }
    });

    pipeline.push({
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
                        bannerImage: 1
                    }
                }
            ]
        }
    });

    pipeline.push({ $unwind: "$channelDetails" });

    const videoAggregate = Video.aggregate(pipeline);

    const options = {
        page: parseInt(page, 10),
        limit: parseInt(limit, 10),
    };

    const videos = await Video.aggregatePaginate(videoAggregate, options);

    return res
        .status(200)
        .json(new ApiResponse(200, "Videos fetched successfully", videos));
});

const publishAVideo = asyncHandler(async (req, res) => {
    const { title, description, category, visibility } = req.body;

    if ([title, description, category].some((field) => field?.trim() === "")) {
        throw new ApiError(400, "Title, description, and category are required");
    }

    const channel = await Channel.findOne({ owner: req.user._id });
    if (!channel) {
        throw new ApiError(403, "You must create a channel before posting videos.");
    }

    const videoLocalPath = req.files?.videoFile?.[0]?.path;
    const thumbnailLocalPath = req.files?.thumbnail?.[0]?.path;

    if (!videoLocalPath) throw new ApiError(400, "Video file is required");
    if (!thumbnailLocalPath) throw new ApiError(400, "Thumbnail file is required");

    const videoUpload = await uploadOnCloudinary(videoLocalPath);
    const thumbnailUpload = await uploadOnCloudinary(thumbnailLocalPath);

    if (!videoUpload || !thumbnailUpload) {
        throw new ApiError(500, "Failed to upload video assets");
    }

    const video = await Video.create({
        title,
        description,
        videoFile: videoUpload.url,
        thumbnail: thumbnailUpload.url,
        duration: videoUpload.duration || 0,
        channel: channel._id,
        category,
        visibility: visibility || "PUBLIC",
        isPublished: true,
        publishedAt: new Date(),
        owner: req.user._id
    });

    return res
        .status(201)
        .json(new ApiResponse(201, "Video published successfully", video));
});

const getVideoById = asyncHandler(async (req, res) => {
    const { videoId } = req.params;

    if (!isValidObjectId(videoId)) throw new ApiError(400, "Invalid video ID");

    await Video.findByIdAndUpdate(videoId, { $inc: { views: 1 } });

    const video = await Video.aggregate([
        {
            $match: {
                _id: new mongoose.Types.ObjectId(videoId)
            }
        },
        {
            $lookup: {
                from: "channels",
                localField: "channel",
                foreignField: "_id",
                as: "channel",
                pipeline: [
                    {
                        $project: {
                            name: 1,
                            handle: 1,
                            subscriberCount: 1,
                            bannerImage: 1
                        }
                    }
                ]
            }
        },
        { $unwind: "$channel" },
        {
            $project: {
                title: 1,
                description: 1,
                videoFile: 1,
                thumbnail: 1,
                duration: 1,
                views: 1,
                likesCount: 1,
                createdAt: 1,
                channel: 1,
                visibility: 1,
                category: 1
            }
        }
    ]);

    if (!video?.length) {
        throw new ApiError(404, "Video not found");
    }

    return res
        .status(200)
        .json(new ApiResponse(200, "Video details fetched successfully", video[0]));
});

const updateVideo = asyncHandler(async (req, res) => {
    const { videoId } = req.params;
    const { title, description, visibility } = req.body;
    const thumbnailLocalPath = req.file?.path;

    if (!isValidObjectId(videoId)) throw new ApiError(400, "Invalid video ID");

    const video = await Video.findById(videoId);
    if (!video) throw new ApiError(404, "Video not found");

    const channel = await Channel.findById(video.channel);
    if (!channel || channel.owner.toString() !== req.user._id.toString()) {
        throw new ApiError(403, "You are not the owner of this video");
    }

    if (title) video.title = title;
    if (description) video.description = description;
    if (visibility) video.visibility = visibility;

    if (thumbnailLocalPath) {
        const newThumbnail = await uploadOnCloudinary(thumbnailLocalPath);
        if (!newThumbnail.url) {
            throw new ApiError(500, "Failed to upload new thumbnail");
        }

        await deleteFromCloudinary(video.thumbnail);
        
        video.thumbnail = newThumbnail.url;
    }

    await video.save();

    return res
        .status(200)
        .json(new ApiResponse(200, "Video updated successfully", video));
});

const deleteVideo = asyncHandler(async (req, res) => {
    const { videoId } = req.params;

    if (!isValidObjectId(videoId)) throw new ApiError(400, "Invalid video ID");

    const video = await Video.findById(videoId);
    if (!video) throw new ApiError(404, "Video not found");

    const channel = await Channel.findById(video.channel);
    if (!channel || channel.owner.toString() !== req.user._id.toString()) {
        throw new ApiError(403, "Unauthorized request");
    }

    const deleteVideoFile = deleteFromCloudinary(video.videoFile, "video");
    const deleteThumbnail = deleteFromCloudinary(video.thumbnail, "image");
    
    await Promise.all([deleteVideoFile, deleteThumbnail]);

    await Video.findByIdAndDelete(videoId);

    return res
        .status(200)
        .json(new ApiResponse(200, "Video deleted successfully", {}));
});

const togglePublishStatus = asyncHandler(async (req, res) => {
    const { videoId } = req.params;

    if (!isValidObjectId(videoId)) throw new ApiError(400, "Invalid video ID");

    const video = await Video.findById(videoId);
    if (!video) throw new ApiError(404, "Video not found");

    const channel = await Channel.findById(video.channel);
    if (!channel || channel.owner.toString() !== req.user._id.toString()) {
        throw new ApiError(403, "Unauthorized request");
    }

    video.isPublished = !video.isPublished;

    if(video.isPublished && !video.publishedAt) {
        video.publishedAt = new Date();
    }

    await video.save({ validateBeforeSave: false });

    return res
        .status(200)
        .json(new ApiResponse(200, "Video publish status toggled", { 
            isPublished: video.isPublished 
        }));
});

export {
    getAllVideos,
    publishAVideo,
    getVideoById,
    updateVideo,
    deleteVideo,
    togglePublishStatus,
};