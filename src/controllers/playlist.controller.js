import mongoose, { isValidObjectId } from "mongoose";
import { Playlist } from "../models/playlist.model.js";
import { Video } from "../models/video.model.js";
import { Channel } from "../models/channel.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { uploadOnCloudinary, deleteFromCloudinary } from "../utils/cloudinary.js";

const createPlaylist = asyncHandler(async (req, res) => {
    const { title, description, visibility, videos } = req.body;

    if (!title?.trim()) {
        throw new ApiError(400, "Title is required");
    }

    let thumbnailUrl = null;

    if (req.file?.path) {
        const uploadedThumbnail = await uploadOnCloudinary(req.file.path);

        if (!uploadedThumbnail || !uploadedThumbnail.url) {
            throw new ApiError(500, "Failed to upload playlist thumbnail");
        }

        thumbnailUrl = uploadedThumbnail.url;
    }

    const channel = await Channel.findOne({ owner: req.user._id });

    let playlistVideos = [];

    if (Array.isArray(videos) && videos.length > 0) {
        playlistVideos = await Promise.all(
            videos.map(async (videoId, index) => {
                if (!isValidObjectId(videoId)) {
                    throw new ApiError(400, "Invalid video ID in videos list");
                }

                const videoExists = await Video.exists({ _id: videoId });
                if (!videoExists) {
                    throw new ApiError(404, `Video not found: ${videoId}`);
                }

                return {
                    video: new mongoose.Types.ObjectId(videoId),
                    position: index + 1,
                    addedAt: new Date(),
                };
            })
        );
    }

    const playlist = await Playlist.create({
        title: title.trim(),
        description: description?.trim() || "",
        visibility: visibility || "PRIVATE",
        thumbnail: thumbnailUrl,
        owner: req.user._id,
        channel: channel ? channel._id : undefined,
        videos: playlistVideos,
    });

    return res
        .status(201)
        .json(new ApiResponse(201, "Playlist created successfully", playlist));
});

const getPlaylistById = asyncHandler(async (req, res) => {
    const { playlistId } = req.params;

    if (!isValidObjectId(playlistId)) {
        throw new ApiError(400, "Invalid Playlist ID");
    }

    await Playlist.findByIdAndUpdate(playlistId, {
        $inc: { viewsCount: 1 },
    });

    const playlist = await Playlist.aggregate([
        {
            $match: {
                _id: new mongoose.Types.ObjectId(playlistId),
            },
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
                            username: 1,
                            fullName: 1,
                            email: 1,
                        },
                    },
                ],
            },
        },
        { $unwind: "$ownerDetails" },
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
                            bannerImage: 1,
                            subscriberCount: 1,
                        },
                    },
                ],
            },
        },
        {
            $unwind: {
                path: "$channelDetails",
                preserveNullAndEmptyArrays: true,
            },
        },
        {
            $lookup: {
                from: "videos",
                localField: "videos.video",
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
                            channel: 1,
                            createdAt: 1,
                        },
                    },
                ],
            },
        },
        {
            $project: {
                title: 1,
                description: 1,
                thumbnail: 1,
                visibility: 1,
                viewsCount: 1,
                likesCount: 1,
                videos: 1,
                owner: "$ownerDetails",
                channel: "$channelDetails",
                videoDetails: 1,
                createdAt: 1,
                updatedAt: 1,
            },
        },
    ]);

    if (!playlist?.length) {
        throw new ApiError(404, "Playlist not found");
    }

    return res
        .status(200)
        .json(
            new ApiResponse(
                200,
                "Playlist fetched successfully",
                playlist[0]
            )
        );
});

const getUserPlaylists = asyncHandler(async (req, res) => {
    const { userId } = req.params;

    if (!isValidObjectId(userId)) {
        throw new ApiError(400, "Invalid User ID");
    }

    const playlists = await Playlist.aggregate([
        {
            $match: {
                owner: new mongoose.Types.ObjectId(userId),
                visibility: { $in: ["PUBLIC", "UNLISTED"] },
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
                            bannerImage: 1,
                        },
                    },
                ],
            },
        },
        {
            $unwind: {
                path: "$channelDetails",
                preserveNullAndEmptyArrays: true,
            },
        },
        {
            $project: {
                title: 1,
                description: 1,
                thumbnail: 1,
                visibility: 1,
                viewsCount: 1,
                likesCount: 1,
                videosCount: { $size: "$videos" },
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
                "User playlists fetched successfully",
                playlists
            )
        );
});

const getCurrentUserPlaylists = asyncHandler(async (req, res) => {
    const playlists = await Playlist.find({
        owner: req.user._id,
    }).sort({ createdAt: -1 });

    return res
        .status(200)
        .json(
            new ApiResponse(
                200,
                "Current user's playlists fetched successfully",
                playlists
            )
        );
});

const updatePlaylist = asyncHandler(async (req, res) => {
    const { playlistId } = req.params;
    const { title, description, visibility } = req.body;

    if (!isValidObjectId(playlistId)) {
        throw new ApiError(400, "Invalid Playlist ID");
    }

    const playlist = await Playlist.findById(playlistId);
    if (!playlist) {
        throw new ApiError(404, "Playlist not found");
    }

    if (playlist.owner.toString() !== req.user._id.toString()) {
        throw new ApiError(403, "You are not the owner of this playlist");
    }

    if (title) playlist.title = title.trim();
    if (description !== undefined) playlist.description = description.trim();
    if (visibility) playlist.visibility = visibility;

    if (req.file?.path) {
        const newThumbnail = await uploadOnCloudinary(req.file.path);

        if (!newThumbnail || !newThumbnail.url) {
            throw new ApiError(500, "Failed to upload new playlist thumbnail");
        }

        if (playlist.thumbnail) {
            await deleteFromCloudinary(playlist.thumbnail, "image");
        }

        playlist.thumbnail = newThumbnail.url;
    }

    await playlist.save();

    return res
        .status(200)
        .json(
            new ApiResponse(200, "Playlist updated successfully", playlist)
        );
});

const deletePlaylist = asyncHandler(async (req, res) => {
    const { playlistId } = req.params;

    if (!isValidObjectId(playlistId)) {
        throw new ApiError(400, "Invalid Playlist ID");
    }

    const playlist = await Playlist.findById(playlistId);
    if (!playlist) {
        throw new ApiError(404, "Playlist not found");
    }

    if (playlist.owner.toString() !== req.user._id.toString()) {
        throw new ApiError(403, "You are not the owner of this playlist");
    }

    if (playlist.thumbnail) {
        await deleteFromCloudinary(playlist.thumbnail, "image");
    }

    await Playlist.findByIdAndDelete(playlistId);

    return res
        .status(200)
        .json(
            new ApiResponse(
                200,
                "Playlist deleted successfully",
                {}
            )
        );
});

const addVideoToPlaylist = asyncHandler(async (req, res) => {
    const { playlistId } = req.params;
    const { videoId } = req.body;

    if (!isValidObjectId(playlistId)) {
        throw new ApiError(400, "Invalid Playlist ID");
    }

    if (!isValidObjectId(videoId)) {
        throw new ApiError(400, "Invalid Video ID");
    }

    const playlist = await Playlist.findById(playlistId);
    if (!playlist) {
        throw new ApiError(404, "Playlist not found");
    }

    if (playlist.owner.toString() !== req.user._id.toString()) {
        throw new ApiError(403, "You are not the owner of this playlist");
    }

    const video = await Video.findById(videoId);
    if (!video) {
        throw new ApiError(404, "Video not found");
    }

    const alreadyExists = playlist.videos.some(
        (entry) => entry.video.toString() === videoId
    );

    if (alreadyExists) {
        throw new ApiError(400, "Video already exists in playlist");
    }

    const position = playlist.videos.length + 1;

    playlist.videos.push({
        video: video._id,
        position,
        addedAt: new Date(),
    });

    if (!playlist.thumbnail && video.thumbnail) {
        playlist.thumbnail = video.thumbnail;
    }

    await playlist.save();

    return res
        .status(200)
        .json(
            new ApiResponse(
                200,
                "Video added to playlist successfully",
                playlist
            )
        );
});

const removeVideoFromPlaylist = asyncHandler(async (req, res) => {
    const { playlistId, videoId } = req.params;

    if (!isValidObjectId(playlistId)) {
        throw new ApiError(400, "Invalid Playlist ID");
    }

    if (!isValidObjectId(videoId)) {
        throw new ApiError(400, "Invalid Video ID");
    }

    const playlist = await Playlist.findById(playlistId);
    if (!playlist) {
        throw new ApiError(404, "Playlist not found");
    }

    if (playlist.owner.toString() !== req.user._id.toString()) {
        throw new ApiError(403, "You are not the owner of this playlist");
    }

    const initialLength = playlist.videos.length;

    playlist.videos = playlist.videos.filter(
        (entry) => entry.video.toString() !== videoId
    );

    if (playlist.videos.length === initialLength) {
        throw new ApiError(404, "Video not found in this playlist");
    }

    playlist.videos = playlist.videos.map((entry, index) => ({
        ...entry.toObject?.() ? entry.toObject() : entry,
        position: index + 1,
    }));

    await playlist.save();

    return res
        .status(200)
        .json(
            new ApiResponse(
                200,
                "Video removed from playlist successfully",
                playlist
            )
        );
});

export {
    createPlaylist,
    getPlaylistById,
    getUserPlaylists,
    getCurrentUserPlaylists,
    updatePlaylist,
    deletePlaylist,
    addVideoToPlaylist,
    removeVideoFromPlaylist,
};
