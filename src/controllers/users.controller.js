import mongoose from "mongoose";
import jwt from "jsonwebtoken";
import { User } from "../models/user.model.js";
import { Profile } from "../models/profile.model.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { OPTIONS } from "../constants.js";

const registerUser = asyncHandler(async (req, res) => {
    const { fullName, email, username, password } = req.body;

    if (
        [fullName, email, username, password].some(
            (field) => field?.trim() === ""
        )
    ) {
        throw new ApiError(400, "All fields are required");
    }

    const existingUser = await User.findOne({
        $or: [{ email }, { username }],
    });

    if (existingUser) {
        throw new ApiError(409, "User with email or username already exists");
    }

    const session = await mongoose.startSession();
    session.startTransaction();

    try {
        const profile = await Profile.create([{}], { session });

        if (!profile || profile.length === 0) {
            throw new ApiError(500, "Failed to create user profile");
        }

        const [user] = await User.create(
            [
                {
                    fullName,
                    email,
                    username: username.toLowerCase(),
                    password,
                    profile: profile[0]._id,
                },
            ],
            { session }
        );

        const accessToken = user.generateAccessToken();
        const refreshToken = user.generateRefreshToken();

        user.refreshToken = refreshToken;

        await user.save({ validateBeforeSave: false, session });

        await session.commitTransaction();

        return res
            .status(201)
            .cookie("refreshToken", refreshToken, OPTIONS)
            .cookie("accessToken", accessToken, {
                ...OPTIONS,
                maxAge: 15 * 60 * 1000,
            })
            .json(
                new ApiResponse(201, "User registered successfully", {
                    user,
                })
            );
    } catch (error) {
        await session.abortTransaction();
        throw error;
    } finally {
        session.endSession();
    }
});

const loginUser = asyncHandler(async (req, res) => {
    const { email, username, password } = req.body;

    if (!email && !username) {
        throw new ApiError(400, "Email or Username is required");
    }

    const user = await User.findOne({
        $or: [{ email }, { username }],
    });

    if (!user) {
        throw new ApiError(404, "User not found");
    }

    if (user.status !== "active") {
        throw new ApiError(
            403,
            "Your account has been suspended or banned. Contact support."
        );
    }

    const isPasswordValid = await user.isPasswordCorrect(password);

    if (!isPasswordValid) {
        throw new ApiError(401, "Password is incorrect");
    }

    const accessToken = user.generateAccessToken();
    const refreshToken = user.generateRefreshToken();

    user.refreshToken = refreshToken;

    await user.save({ validateBeforeSave: false });

    return res
        .status(200)
        .cookie("refreshToken", refreshToken, OPTIONS)
        .cookie("accessToken", accessToken, {
            ...OPTIONS,
            maxAge: 15 * 60 * 1000,
        })
        .json(
            new ApiResponse(200, "User logged in successfully", {
                user,
            })
        );
});

const logoutUser = asyncHandler(async (req, res) => {
    const userId = req.user._id;

    await User.findByIdAndUpdate(
        userId,
        {
            $unset: {
                refreshToken: 1,
            },
        },
        {
            new: true,
        }
    );

    return res
        .status(200)
        .clearCookie("refreshToken", OPTIONS)
        .clearCookie("accessToken", OPTIONS)
        .json(new ApiResponse(200, "User logged out successfully", {}));
});

const refreshAccessToken = asyncHandler(async (req, res) => {
    const token = req.cookies?.refreshToken || req.body.refreshToken;

    if (!token) {
        throw new ApiError(401, "Unauthorized request");
    }

    try {
        const decodedToken = jwt.verify(
            token,
            process.env.REFRESH_TOKEN_SECRET
        );

        const user = await User.findById(decodedToken?._id);

        if (!user) {
            throw new ApiError(401, "Invalid refresh token");
        }

        if (token !== user?.refreshToken) {
            throw new ApiError(401, "Refresh Token is expired or used");
        }

        const accessToken = user.generateAccessToken();
        const refreshToken = user.generateRefreshToken();

        user.refreshToken = refreshToken;
        await user.save({ validateBeforeSave: false });

        return res
            .status(200)
            .cookie("refreshToken", refreshToken, OPTIONS)
            .cookie("accessToken", accessToken, {
                ...OPTIONS,
                maxAge: 15 * 60 * 1000,
            })
            .json(
                new ApiResponse(200, "Access Token refreshed successfully", {})
            );
    } catch (error) {
        if (error instanceof ApiError) {
            throw error;
        }

        if (
            error.name === "TokenExpiredError" ||
            error.name === "JsonWebTokenError"
        ) {
            throw new ApiError(401, "Invalid or expired refresh token");
        }

        throw new ApiError(
            500,
            error?.message || "Internal server error during token refresh"
        );
    }
});

const changeCurrentPassword = asyncHandler(async (req, res) => {
    const { oldPassword, newPassword } = req.body;

    if (!oldPassword || !newPassword) {
        throw new ApiError(400, "Old password and new password are required");
    }

    const user = await User.findById(req.user._id);

    const isPasswordValid = await user.isPasswordCorrect(oldPassword);

    if (!isPasswordValid) {
        throw new ApiError(400, "Invalid old password");
    }

    user.password = newPassword;

    await user.save();

    return res
        .status(200)
        .json(new ApiResponse(200, "Password changed successfully", {}));
});

const getCurrentUser = asyncHandler(async (req, res) => {
    const user = await User.findById(req.user._id).populate("profile");

    return res
        .status(200)
        .json(
            new ApiResponse(200, "Current user fetched successfully", { user })
        );
});

const updateAccountDetails = asyncHandler(async (req, res) => {
    const { fullName, email, username } = req.body;

    if (!fullName && !email && !username) {
        throw new ApiError(
            400,
            "At least one field (fullName, email, username) is required to update"
        );
    }

    if (email || username) {
        const existingUser = await User.findOne({
            $or: [{ email: email }, { username: username }],
            _id: { $ne: req.user?._id },
        });

        if (existingUser) {
            throw new ApiError(
                409,
                "Email or Username is already taken by another user"
            );
        }
    }

    const updatedData = {};
    if (fullName) updatedData.fullName = fullName;
    if (email) updatedData.email = email;
    if (username) updatedData.username = username.toLowerCase();

    const user = await User.findByIdAndUpdate(
        req.user?._id,
        {
            $set: updatedData,
        },
        { new: true }
    );

    return res.status(200).json(
        new ApiResponse(200, "Account details updated successfully", {
            user,
        })
    );
});

const deleteAccount = asyncHandler(async (req, res) => {
    const user = await User.findById(req.user?._id);

    if (!user) {
        throw new ApiError(404, "User not found");
    }

    user.status = "suspended";
    user.refreshToken = null;

    await user.save({ validateBeforeSave: false });

    return res
        .status(200)
        .clearCookie("refreshToken", OPTIONS)
        .clearCookie("accessToken", OPTIONS)
        .json(new ApiResponse(200, "Account deleted successfully", {}));
});

export {
    registerUser,
    loginUser,
    logoutUser,
    refreshAccessToken,
    changeCurrentPassword,
    getCurrentUser,
    updateAccountDetails,
    deleteAccount,
};
