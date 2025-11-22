import mongoose, { isValidObjectId } from "mongoose";
import { Activity } from "../models/activity.model.js";
import { Video } from "../models/video.model.js";
import { Post } from "../models/post.model.js";
import { Comment } from "../models/comment.model.js";
import { Like } from "../models/like.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const logWatchActivity = asyncHandler(async (req, res) => {
    const { videoId } = req.params;

    if (!isValidObjectId(videoId)) {
        throw new ApiError(400, "Invalid Video ID");
    }

    const video = await Video.findById(videoId);
    if (!video || !video.isPublished) {
        throw new ApiError(404, "Video not available");
    }

    await Activity.create({
        user: req.user._id,
        targetType: "WATCH",
        video: videoId,
    });

    return res
        .status(201)
        .json(new ApiResponse(201, "Watch activity logged"));
});

const logLikeActivity = asyncHandler(async (req, res) => {
    const { type, targetId } = req.body;

    if (!["VIDEO", "COMMENT", "POST"].includes(type)) {
        throw new ApiError(400, "Invalid like type");
    }

    if (!isValidObjectId(targetId)) {
        throw new ApiError(400, "Invalid target ID");
    }

    if (type === "VIDEO") {
        const video = await Video.findById(targetId);
        if (!video) throw new ApiError(404, "Video not found");
    }

    if (type === "POST") {
        const post = await Post.findById(targetId);
        if (!post) throw new ApiError(404, "Post not found");
    }

    if (type === "COMMENT") {
        const comment = await Comment.findById(targetId);
        if (!comment) throw new ApiError(404, "Comment not found");
    }

    const like = await Like.findOne({
        author: req.user._id,
        [type.toLowerCase()]: targetId,
    });

    await Activity.create({
        user: req.user._id,
        targetType: "LIKE",
        [type.toLowerCase()]: targetId,
        likes: like ? like._id : null,
    });

    return res
        .status(201)
        .json(new ApiResponse(201, "Like activity logged"));
});

const logCommentActivity = asyncHandler(async (req, res) => {
    const { commentId } = req.params;

    if (!isValidObjectId(commentId)) {
        throw new ApiError(400, "Invalid Comment ID");
    }

    const comment = await Comment.findById(commentId);
    if (!comment || comment.isDeleted) {
        throw new ApiError(404, "Comment not found");
    }

    await Activity.create({
        user: req.user._id,
        targetType: "COMMENT",
        comments: commentId,
        video: comment.video,
        post: comment.post,
    });

    return res
        .status(201)
        .json(new ApiResponse(201, "Comment activity logged"));
});

const logPostActivity = asyncHandler(async (req, res) => {
    const { postId } = req.params;

    if (!isValidObjectId(postId)) {
        throw new ApiError(400, "Invalid Post ID");
    }

    const post = await Post.findById(postId);
    if (!post) throw new ApiError(404, "Post not found");

    await Activity.create({
        user: req.user._id,
        targetType: "POST",
        posts: postId,
    });

    return res
        .status(201)
        .json(new ApiResponse(201, "Post activity logged"));
});

const getMyActivity = asyncHandler(async (req, res) => {
    const { type } = req.query;

    let matchQuery = { user: new mongoose.Types.ObjectId(req.user._id) };

    if (type) {
        if (!["WATCH", "LIKE", "COMMENT", "POST"].includes(type)) {
            throw new ApiError(400, "Invalid activity type");
        }
        matchQuery.targetType = type;
    }

    const activities = await Activity.aggregate([
        {
            $match: matchQuery,
        },
        {
            $sort: { createdAt: -1 },
        },
        {
            $lookup: {
                from: "videos",
                localField: "video",
                foreignField: "_id",
                as: "videoDetails",
                pipeline: [
                    {
                        $project: {
                            title: 1,
                            thumbnail: 1,
                            duration: 1,
                        },
                    },
                ],
            },
        },
        {
            $lookup: {
                from: "posts",
                localField: "posts",
                foreignField: "_id",
                as: "postDetails",
                pipeline: [
                    {
                        $project: {
                            content: 1,
                            media: 1,
                        },
                    },
                ],
            },
        },
        {
            $lookup: {
                from: "comments",
                localField: "comments",
                foreignField: "_id",
                as: "commentDetails",
                pipeline: [
                    {
                        $project: {
                            content: 1,
                            likesCount: 1,
                        },
                    },
                ],
            },
        },
        {
            $lookup: {
                from: "likes",
                localField: "likes",
                foreignField: "_id",
                as: "likeDetails",
                pipeline: [
                    {
                        $project: {
                            targetType: 1,
                            video: 1,
                            post: 1,
                            comment: 1,
                        },
                    },
                ],
            },
        },
        {
            $project: {
                targetType: 1,
                createdAt: 1,
                video: { $arrayElemAt: ["$videoDetails", 0] },
                post: { $arrayElemAt: ["$postDetails", 0] },
                comment: { $arrayElemAt: ["$commentDetails", 0] },
                like: { $arrayElemAt: ["$likeDetails", 0] },
            },
        },
    ]);

    return res
        .status(200)
        .json(
            new ApiResponse(200, "Activity fetched successfully", activities)
        );
});

const deleteMyActivity = asyncHandler(async (req, res) => {
    const { activityId } = req.params;

    if (!isValidObjectId(activityId)) {
        throw new ApiError(400, "Invalid Activity ID");
    }

    const activity = await Activity.findOne({
        _id: activityId,
        user: req.user._id,
    });

    if (!activity) {
        throw new ApiError(404, "Activity not found or you don't own it");
    }

    await Activity.findByIdAndDelete(activityId);

    return res
        .status(200)
        .json(new ApiResponse(200, "Activity deleted successfully"));
});

export {
    logWatchActivity,
    logLikeActivity,
    logCommentActivity,
    logPostActivity,
    getMyActivity,
    deleteMyActivity,
};
