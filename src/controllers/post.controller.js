import mongoose, { isValidObjectId } from "mongoose";
import { Post } from "../models/post.model.js";
import { Channel } from "../models/channel.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import {
    uploadOnCloudinary,
    deleteFromCloudinary,
} from "../utils/cloudinary.js";

const createPost = asyncHandler(async (req, res) => {
    const { content, visibility } = req.body;

    if (!content?.trim()) {
        throw new ApiError(400, "Content is required");
    }

    const channel = await Channel.findOne({ owner: req.user._id });
    if (!channel) {
        throw new ApiError(403, "You must create a channel before posting");
    }

    let mediaUrls = [];

    if (req.files && req.files.length > 0) {
        for (const file of req.files) {
            const uploaded = await uploadOnCloudinary(file.path);
            if (!uploaded || !uploaded.url) {
                throw new ApiError(500, "Failed to upload media");
            }
            mediaUrls.push(uploaded.url);
        }
    }

    const post = await Post.create({
        content: content.trim(),
        visibility: visibility || "PUBLIC",
        media: mediaUrls,
        author: channel._id,
    });

    return res
        .status(201)
        .json(new ApiResponse(201, "Post created successfully", post));
});

const getPostById = asyncHandler(async (req, res) => {
    const { postId } = req.params;

    if (!isValidObjectId(postId)) {
        throw new ApiError(400, "Invalid Post ID");
    }

    await Post.findByIdAndUpdate(postId, { $inc: { viewsCount: 1 } });

    const post = await Post.aggregate([
        {
            $match: {
                _id: new mongoose.Types.ObjectId(postId),
            },
        },
        {
            $lookup: {
                from: "channels",
                localField: "author",
                foreignField: "_id",
                as: "authorDetails",
                pipeline: [
                    {
                        $project: {
                            name: 1,
                            handle: 1,
                            bannerImage: 1,
                            subscriberCount: 1,
                        },
                    },
                ],
            },
        },
        { $unwind: "$authorDetails" },
        {
            $project: {
                content: 1,
                media: 1,
                visibility: 1,
                likesCount: 1,
                commentsCount: 1,
                viewsCount: 1,
                sharesCount: 1,
                isEnabled: 1,
                createdAt: 1,
                updatedAt: 1,
                author: "$authorDetails",
            },
        },
    ]);

    if (!post?.length) {
        throw new ApiError(404, "Post not found");
    }

    return res
        .status(200)
        .json(new ApiResponse(200, "Post fetched successfully", post[0]));
});

const getChannelPosts = asyncHandler(async (req, res) => {
    const { handle } = req.params;

    if (!handle?.trim()) throw new ApiError(400, "Handle is required");

    const channel = await Channel.findOne({ handle: handle.toLowerCase() });
    if (!channel) throw new ApiError(404, "Channel not found");

    const posts = await Post.aggregate([
        {
            $match: {
                author: channel._id,
                visibility: "PUBLIC",
            },
        },
        {
            $project: {
                content: 1,
                media: 1,
                createdAt: 1,
                likesCount: 1,
                commentsCount: 1,
                viewsCount: 1,
            },
        },
        { $sort: { createdAt: -1 } },
    ]);

    return res
        .status(200)
        .json(
            new ApiResponse(200, "Channel posts fetched successfully", posts)
        );
});

const updatePost = asyncHandler(async (req, res) => {
    const { postId } = req.params;
    const { content, visibility } = req.body;

    if (!isValidObjectId(postId)) {
        throw new ApiError(400, "Invalid Post ID");
    }

    const post = await Post.findById(postId);
    if (!post) {
        throw new ApiError(404, "Post not found");
    }

    const channel = await Channel.findOne({ _id: post.author });
    if (!channel || channel.owner.toString() !== req.user._id.toString()) {
        throw new ApiError(403, "You are not authorized to update this post");
    }

    if (content !== undefined) post.content = content.trim();
    if (visibility) post.visibility = visibility;

    if (req.files?.length > 0) {
        for (const media of post.media) {
            await deleteFromCloudinary(media, "image");
        }

        let newMediaUrls = [];
        for (const file of req.files) {
            const uploaded = await uploadOnCloudinary(file.path);
            if (!uploaded || !uploaded.url) {
                throw new ApiError(500, "Failed to upload media");
            }
            newMediaUrls.push(uploaded.url);
        }

        post.media = newMediaUrls;
    }

    await post.save();

    return res
        .status(200)
        .json(new ApiResponse(200, "Post updated successfully", post));
});

const deletePost = asyncHandler(async (req, res) => {
    const { postId } = req.params;

    if (!isValidObjectId(postId)) {
        throw new ApiError(400, "Invalid Post ID");
    }

    const post = await Post.findById(postId);
    if (!post) {
        throw new ApiError(404, "Post not found");
    }

    const channel = await Channel.findById(post.author);
    if (!channel || channel.owner.toString() !== req.user._id.toString()) {
        throw new ApiError(403, "You are not authorized to delete this post");
    }

    for (const media of post.media) {
        await deleteFromCloudinary(media, "image");
    }

    await Post.findByIdAndDelete(postId);

    return res
        .status(200)
        .json(new ApiResponse(200, "Post deleted successfully", {}));
});

const togglePostPublishStatus = asyncHandler(async (req, res) => {
    const { postId } = req.params;

    if (!isValidObjectId(postId)) {
        throw new ApiError(400, "Invalid Post ID");
    }

    const post = await Post.findById(postId);
    if (!post) {
        throw new ApiError(404, "Post not found");
    }

    const channel = await Channel.findOne({ _id: post.author });
    if (!channel || channel.owner.toString() !== req.user._id.toString()) {
        throw new ApiError(403, "Unauthorized request");
    }

    post.visibility = post.visibility === "PUBLIC" ? "PRIVATE" : "PUBLIC";

    await post.save({ validateBeforeSave: false });

    return res.status(200).json(
        new ApiResponse(200, "Post visibility updated", {
            visibility: post.visibility,
        })
    );
});

export {
    createPost,
    getPostById,
    getChannelPosts,
    updatePost,
    deletePost,
    togglePostPublishStatus,
};
