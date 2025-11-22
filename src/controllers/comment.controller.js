import mongoose, { isValidObjectId } from "mongoose";
import { Comment } from "../models/comment.model.js";
import { Video } from "../models/video.model.js";
import { Post } from "../models/post.model.js";
import { Channel } from "../models/channel.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const addComment = asyncHandler(async (req, res) => {
    const { videoId, postId } = req.params;
    const { content } = req.body;

    if (!content?.trim()) {
        throw new ApiError(400, "Content is required");
    }

    let targetType = null;

    if (videoId) {
        if (!isValidObjectId(videoId)) {
            throw new ApiError(400, "Invalid Video ID");
        }
        const video = await Video.findById(videoId);
        if (!video?.isPublished || video.visibility !== "PUBLIC") {
            throw new ApiError(403, "You cannot comment on this video");
        }
        targetType = "VIDEO";
    }

    if (postId) {
        if (!isValidObjectId(postId)) {
            throw new ApiError(400, "Invalid Post ID");
        }
        const post = await Post.findById(postId);
        if (!post || post.visibility !== "PUBLIC") {
            throw new ApiError(403, "You cannot comment on this post");
        }
        targetType = "POST";
    }

    if (!targetType) {
        throw new ApiError(400, "Invalid comment target");
    }

    const commentData = {
        author: req.user._id,
        content: content.trim(),
    };

    if (targetType === "VIDEO") commentData.video = videoId;
    if (targetType === "POST") commentData.post = postId;

    const comment = await Comment.create(commentData);

    if (videoId) {
        await Video.findByIdAndUpdate(videoId, { $inc: { commentsCount: 1 } });
    }

    if (postId) {
        await Post.findByIdAndUpdate(postId, { $inc: { commentsCount: 1 } });
    }

    return res
        .status(201)
        .json(new ApiResponse(201, "Comment added successfully", comment));
});

const replyToComment = asyncHandler(async (req, res) => {
    const { commentId } = req.params;
    const { content } = req.body;

    if (!isValidObjectId(commentId)) {
        throw new ApiError(400, "Invalid Comment ID");
    }

    if (!content?.trim()) {
        throw new ApiError(400, "Reply content is required");
    }

    const parentComment = await Comment.findById(commentId);
    if (!parentComment) {
        throw new ApiError(404, "Parent comment not found");
    }

    if (parentComment.isDeleted) {
        throw new ApiError(400, "Cannot reply to a deleted comment");
    }

    const reply = await Comment.create({
        content: content.trim(),
        author: req.user._id,
        parentComment: parentComment._id,
        video: parentComment.video,
        post: parentComment.post,
    });

    if (parentComment.video) {
        await Video.findByIdAndUpdate(parentComment.video, {
            $inc: { commentsCount: 1 },
        });
    }

    if (parentComment.post) {
        await Post.findByIdAndUpdate(parentComment.post, {
            $inc: { commentsCount: 1 },
        });
    }

    return res
        .status(201)
        .json(new ApiResponse(201, "Reply added successfully", reply));
});

const getCommentsForVideo = asyncHandler(async (req, res) => {
    const { videoId } = req.params;

    if (!isValidObjectId(videoId)) {
        throw new ApiError(400, "Invalid Video ID");
    }

    const comments = await Comment.aggregate([
        {
            $match: {
                video: new mongoose.Types.ObjectId(videoId),
                parentComment: null,
                isDeleted: false,
            },
        },
        {
            $lookup: {
                from: "comments",
                localField: "_id",
                foreignField: "parentComment",
                as: "replies",
                pipeline: [
                    { $match: { isDeleted: false } },
                    {
                        $lookup: {
                            from: "users",
                            localField: "author",
                            foreignField: "_id",
                            as: "authorDetails",
                            pipeline: [
                                { $project: { username: 1, fullName: 1 } },
                            ],
                        },
                    },
                    { $unwind: "$authorDetails" },
                ],
            },
        },
        {
            $lookup: {
                from: "users",
                localField: "author",
                foreignField: "_id",
                as: "authorDetails",
                pipeline: [{ $project: { username: 1, fullName: 1 } }],
            },
        },
        { $unwind: "$authorDetails" },
        {
            $project: {
                content: 1,
                likesCount: 1,
                isPinned: 1,
                createdAt: 1,
                author: "$authorDetails",
                replies: 1,
            },
        },
        { $sort: { isPinned: -1, createdAt: -1 } },
    ]);

    return res
        .status(200)
        .json(
            new ApiResponse(
                200,
                "Video comments fetched successfully",
                comments
            )
        );
});

const getCommentsForPost = asyncHandler(async (req, res) => {
    const { postId } = req.params;

    if (!isValidObjectId(postId)) {
        throw new ApiError(400, "Invalid Post ID");
    }

    const comments = await Comment.aggregate([
        {
            $match: {
                post: new mongoose.Types.ObjectId(postId),
                parentComment: null,
                isDeleted: false,
            },
        },
        {
            $lookup: {
                from: "comments",
                localField: "_id",
                foreignField: "parentComment",
                as: "replies",
                pipeline: [
                    { $match: { isDeleted: false } },
                    {
                        $lookup: {
                            from: "users",
                            localField: "author",
                            foreignField: "_id",
                            as: "authorDetails",
                            pipeline: [
                                { $project: { username: 1, fullName: 1 } },
                            ],
                        },
                    },
                    { $unwind: "$authorDetails" },
                ],
            },
        },
        {
            $lookup: {
                from: "users",
                localField: "author",
                foreignField: "_id",
                as: "authorDetails",
                pipeline: [{ $project: { username: 1, fullName: 1 } }],
            },
        },
        { $unwind: "$authorDetails" },
        {
            $project: {
                content: 1,
                likesCount: 1,
                isPinned: 1,
                createdAt: 1,
                author: "$authorDetails",
                replies: 1,
            },
        },
        { $sort: { isPinned: -1, createdAt: -1 } },
    ]);

    return res
        .status(200)
        .json(
            new ApiResponse(200, "Post comments fetched successfully", comments)
        );
});

const updateComment = asyncHandler(async (req, res) => {
    const { commentId } = req.params;
    const { content } = req.body;

    if (!isValidObjectId(commentId)) {
        throw new ApiError(400, "Invalid Comment ID");
    }

    const comment = await Comment.findById(commentId);
    if (!comment) throw new ApiError(404, "Comment not found");

    if (comment.author.toString() !== req.user._id.toString()) {
        throw new ApiError(403, "You cannot edit this comment");
    }

    if (content !== undefined) comment.content = content.trim();

    await comment.save();

    return res
        .status(200)
        .json(new ApiResponse(200, "Comment updated successfully", comment));
});

const deleteComment = asyncHandler(async (req, res) => {
    const { commentId } = req.params;

    if (!isValidObjectId(commentId)) {
        throw new ApiError(400, "Invalid Comment ID");
    }

    const comment = await Comment.findById(commentId);
    if (!comment) throw new ApiError(404, "Comment not found");

    const isOwner = comment.author.toString() === req.user._id.toString();

    let isChannelOwner = false;

    if (comment.video) {
        const video = await Video.findById(comment.video);
        const channel = await Channel.findById(video.channel);
        if (channel.owner.toString() === req.user._id.toString()) {
            isChannelOwner = true;
        }
    }

    if (comment.post) {
        const post = await Post.findById(comment.post);
        const channel = await Channel.findById(post.author);
        if (channel.owner.toString() === req.user._id.toString()) {
            isChannelOwner = true;
        }
    }

    if (!isOwner && !isChannelOwner) {
        throw new ApiError(403, "Unauthorized to delete this comment");
    }

    comment.isDeleted = true;
    await comment.save();

    return res
        .status(200)
        .json(new ApiResponse(200, "Comment deleted successfully", {}));
});

const pinComment = asyncHandler(async (req, res) => {
    const { commentId } = req.params;

    if (!isValidObjectId(commentId)) {
        throw new ApiError(400, "Invalid Comment ID");
    }

    const comment = await Comment.findById(commentId);
    if (!comment) throw new ApiError(404, "Comment not found");

    let channel = null;

    if (comment.video) {
        const video = await Video.findById(comment.video);
        channel = await Channel.findById(video.channel);
    }

    if (comment.post) {
        channel = await Channel.findById(comment.post.author);
    }

    if (!channel || channel.owner.toString() !== req.user._id.toString()) {
        throw new ApiError(403, "Only channel owner can pin a comment");
    }

    await Comment.updateMany(
        {
            $or: [{ video: comment.video }, { post: comment.post }],
        },
        { $set: { isPinned: false } }
    );

    comment.isPinned = true;
    await comment.save();

    return res
        .status(200)
        .json(new ApiResponse(200, "Comment pinned successfully", comment));
});

export {
    addComment,
    replyToComment,
    getCommentsForVideo,
    getCommentsForPost,
    updateComment,
    deleteComment,
    pinComment,
};
