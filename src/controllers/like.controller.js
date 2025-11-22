import mongoose, { isValidObjectId } from "mongoose";
import { Like } from "../models/like.model.js";
import { Video } from "../models/video.model.js";
import { Comment } from "../models/comment.model.js";
import { Post } from "../models/post.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const toggleVideoLike = asyncHandler(async (req, res) => {
    const { videoId } = req.params;

    if (!isValidObjectId(videoId)) {
        throw new ApiError(400, "Invalid Video ID");
    }

    const video = await Video.findById(videoId);
    if (!video || !video.isPublished || video.visibility !== "PUBLIC") {
        throw new ApiError(404, "Video not available for liking");
    }

    const existingLike = await Like.findOne({
        author: req.user._id,
        video: videoId,
    });

    if (existingLike) {
        await Like.findByIdAndDelete(existingLike._id);

        await Video.findByIdAndUpdate(videoId, {
            $inc: { likesCount: -1 },
        });

        return res.status(200).json(
            new ApiResponse(200, "Video unliked successfully", {
                liked: false,
            })
        );
    }

    await Like.create({
        author: req.user._id,
        targetType: "VIDEO",
        video: videoId,
    });

    await Video.findByIdAndUpdate(videoId, {
        $inc: { likesCount: 1 },
    });

    return res.status(200).json(
        new ApiResponse(200, "Video liked successfully", {
            liked: true,
        })
    );
});

const togglePostLike = asyncHandler(async (req, res) => {
    const { postId } = req.params;

    if (!isValidObjectId(postId)) {
        throw new ApiError(400, "Invalid Post ID");
    }

    const post = await Post.findById(postId);
    if (!post || post.visibility !== "PUBLIC") {
        throw new ApiError(404, "Post not available for liking");
    }

    const existingLike = await Like.findOne({
        author: req.user._id,
        post: postId,
    });

    if (existingLike) {
        await Like.findByIdAndDelete(existingLike._id);

        await Post.findByIdAndUpdate(postId, {
            $inc: { likesCount: -1 },
        });

        return res.status(200).json(
            new ApiResponse(200, "Post unliked successfully", {
                liked: false,
            })
        );
    }

    await Like.create({
        author: req.user._id,
        targetType: "POST",
        post: postId,
    });

    await Post.findByIdAndUpdate(postId, {
        $inc: { likesCount: 1 },
    });

    return res.status(200).json(
        new ApiResponse(200, "Post liked successfully", {
            liked: true,
        })
    );
});

const toggleCommentLike = asyncHandler(async (req, res) => {
    const { commentId } = req.params;

    if (!isValidObjectId(commentId)) {
        throw new ApiError(400, "Invalid Comment ID");
    }

    const comment = await Comment.findById(commentId);
    if (!comment || comment.isDeleted) {
        throw new ApiError(404, "Comment not available for liking");
    }

    const existingLike = await Like.findOne({
        author: req.user._id,
        comment: commentId,
    });

    if (existingLike) {
        await Like.findByIdAndDelete(existingLike._id);

        await Comment.findByIdAndUpdate(commentId, {
            $inc: { likesCount: -1 },
        });

        return res.status(200).json(
            new ApiResponse(200, "Comment unliked successfully", {
                liked: false,
            })
        );
    }

    await Like.create({
        author: req.user._id,
        targetType: "COMMENT",
        comment: commentId,
    });

    await Comment.findByIdAndUpdate(commentId, {
        $inc: { likesCount: 1 },
    });

    return res.status(200).json(
        new ApiResponse(200, "Comment liked successfully", {
            liked: true,
        })
    );
});

const getLikedVideos = asyncHandler(async (req, res) => {
    const likes = await Like.aggregate([
        {
            $match: {
                author: new mongoose.Types.ObjectId(req.user._id),
                targetType: "VIDEO",
            },
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
                            views: 1,
                            likesCount: 1,
                            createdAt: 1,
                        },
                    },
                ],
            },
        },
        { $unwind: "$videoDetails" },
        {
            $project: {
                _id: 0,
                video: "$videoDetails",
            },
        },
    ]);

    return res
        .status(200)
        .json(new ApiResponse(200, "Liked videos fetched", likes));
});

const getLikedPosts = asyncHandler(async (req, res) => {
    const likes = await Like.aggregate([
        {
            $match: {
                author: new mongoose.Types.ObjectId(req.user._id),
                targetType: "POST",
            },
        },
        {
            $lookup: {
                from: "posts",
                localField: "post",
                foreignField: "_id",
                as: "postDetails",
                pipeline: [
                    {
                        $project: {
                            content: 1,
                            media: 1,
                            likesCount: 1,
                            commentsCount: 1,
                            createdAt: 1,
                        },
                    },
                ],
            },
        },
        { $unwind: "$postDetails" },
        {
            $project: {
                _id: 0,
                post: "$postDetails",
            },
        },
    ]);

    return res
        .status(200)
        .json(new ApiResponse(200, "Liked posts fetched", likes));
});

const getLikedComments = asyncHandler(async (req, res) => {
    const likes = await Like.aggregate([
        {
            $match: {
                author: new mongoose.Types.ObjectId(req.user._id),
                targetType: "COMMENT",
            },
        },
        {
            $lookup: {
                from: "comments",
                localField: "comment",
                foreignField: "_id",
                as: "commentDetails",
                pipeline: [
                    {
                        $project: {
                            content: 1,
                            likesCount: 1,
                            createdAt: 1,
                        },
                    },
                ],
            },
        },
        { $unwind: "$commentDetails" },
        {
            $project: {
                _id: 0,
                comment: "$commentDetails",
            },
        },
    ]);

    return res
        .status(200)
        .json(new ApiResponse(200, "Liked comments fetched", likes));
});

export {
    toggleVideoLike,
    togglePostLike,
    toggleCommentLike,
    getLikedVideos,
    getLikedPosts,
    getLikedComments,
};
