import { asyncHandler } from "../utils/asyncHandler";
import { ApiError } from "../utils/ApiError.js";
import { User } from "../models/user.model.js";

const getPublicProfile = asyncHandler(async (req, res) => {
    const { username } = req.params;

    if (!username?.trim()) {
        throw new ApiError(400, "Username is required");
    }

    const userProfile = await User.aggregate([
        {
            $match: {
                username: username.toLowerCase(),
            },
        },
        {
            $lookup: {
                from: "profiles",
                localField: "profile",
                foreignField: "_id",
                as: "profileData",
            },
        },
        {
            $unwind: {
                path: "$profileData",
                preserveNullAndEmptyArrays: true,
            },
        },
        {
            $project: {
                fullName: 1,
                username: 1,
                createdAt: 1,
                bio: "$profileData.bio",
                avatar: "$profileData.avatar",
                coverImage: "$profileData.coverImage",
                location: "$profileData.location",
                socialLinks: "$profileData.socialLinks",
            },
        },
    ]);

    if (!userProfile?.length) {
        throw new ApiError(404, "User not found");
    }

    return res
        .status(200)
        .json(
            new ApiResponse(
                200,
                "Public profile fetched successfully",
                userProfile[0]
            )
        );
});

const getProfile = asyncHandler(async (req, res) => {});

const updateProfile = asyncHandler(async (req, res) => {});

const updateAvatar = asyncHandler(async (req, res) => {});

const updateCoverImage = asyncHandler(async (req, res) => {});

export {
    getPublicProfile,
    getProfile,
    updateProfile,
    updateAvatar,
    updateCoverImage,
};
