import { ApiError } from "../utils/ApiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { User } from "../models/user.model.js";
import { Profile } from "../models/profile.model.js";
import mongoose from "mongoose";
import { ApiResponse } from "../utils/ApiResponse.js";

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

        const options = {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: process.env.NODE_ENV === "production" ? "None" : "Lax",
        };

        return res
            .status(201)
            .cookie("accessToken", accessToken, options)
            .cookie("refreshToken", refreshToken, options)
            .json(
                new ApiResponse(201, "User registered successfully", {
                    user,
                    accessToken,
                    refreshToken,
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

});

export { registerUser, loginUser };
