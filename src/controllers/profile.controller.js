import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { User } from "../models/user.model.js";
import { Profile } from "../models/profile.model.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";

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

    return res.status(200).json(
        new ApiResponse(200, "Public profile fetched successfully", {
            profile: userProfile[0],
        })
    );
});

const getProfile = asyncHandler(async (req, res) => {
    const user = await User.aggregate([
        {
            $match: {
                _id: new mongoose.Types.ObjectId(req.user._id),
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
                email: 1,
                createdAt: 1,
                updatedAt: 1,
                bio: "$profileData.bio",
                avatar: "$profileData.avatar",
                coverImage: "$profileData.coverImage",
                location: "$profileData.location",
                socialLinks: "$profileData.socialLinks",
                subscribedChannels: "$profileData.subscribedChannels",
            },
        },
    ]);

    if (!user?.length) {
        throw new ApiError(404, "User profile not found");
    }

    return res.status(200).json(
        new ApiResponse(200, "User profile fetched successfully", {
            profile: user[0],
        })
    );
});

const updateProfile = asyncHandler(async (req, res) => {
    const { bio, location, socialLinks } = req.body;

    const user = await User.findById(req.user._id);

    const updateData = {};

    if (bio) updateData.bio = bio;
    if (location) updateData.location = location;
    if (socialLinks) updateData.socialLinks = socialLinks;

    const updatedProfile = await Profile.findByIdAndUpdate(
        user.profile,
        {
            $set: updateData,
        },
        { new: true }
    );

    return res.status(200).json(
        new ApiResponse(200, "Profile updated successfully", {
            updatedProfile,
        })
    );
});

const updateAvatar = asyncHandler(async (req, res) => {
    const avatarLocalPath = req.file?.path;
    if (!avatarLocalPath) {
        throw new ApiError(400, "Avatar file is missing");
    }

    const user = await User.findById(req.user._id);
    const profile = await Profile.findById(user.profile);

    const avatar = await uploadOnCloudinary(avatarLocalPath);

    if (!avatar.url) {
        throw new ApiError(500, "Error while uploading avatar");
    }

    if (profile.avatar) {
        // ✅ TODO:
        // await deleteFromCloudinary(profile.avatar);
    }

    profile.avatar = avatar.url;
    await profile.save();

    return res.status(200).json(
        new ApiResponse(200, "Avatar updated successfully", {
            avatar: profile.avatar,
        })
    );
});

const updateCoverImage = asyncHandler(async (req, res) => {
    const coverLocalPath = req.file?.path;

    if (!coverLocalPath) {
        throw new ApiError(400, "Cover image file is missing");
    }

    const user = await User.findById(req.user._id);
    const profile = await Profile.findById(user.profile);

    const coverImage = await uploadOnCloudinary(coverLocalPath);

    if (!coverImage.url) {
        throw new ApiError(500, "Error while uploading cover image");
    }

    if (profile.coverImage) {
        // ✅ TODO:
        // await deleteFromCloudinary(profile.coverImage);
    }

    profile.coverImage = coverImage.url;
    await profile.save();

    return res.status(200).json(
        new ApiResponse(200, "Cover image updated successfully", {
            coverImage: profile.coverImage,
        })
    );
});

export {
    getPublicProfile,
    getProfile,
    updateProfile,
    updateAvatar,
    updateCoverImage,
};
