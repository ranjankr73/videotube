import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

const userSchema = new mongoose.Schema(
    {
        fullName: {
            type: String,
            required: true,
            trim: true,
        },
        email: {
            type: String,
            required: true,
            unique: true,
            trim: true,
            lowercase: true,
            match: [/^\S+@\S+\.\S+$/, "Invalid Email Format"]
        },
        username: {
            type: String,
            required: true,
            unique: true,
            lowercase: true,
            trim: true,
            match: [/^[a-zA-Z0-9_]+$/, "Invalid Username Format"]
        },
        password: {
            type: String,
            required: true,
            trim: true,
            minLength: 8,
        },
        profile: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Profile",
        },
        role: {
            type: String,
            enum: ["user", "creator", "admin"],
            default: "user",
        },
        status: {
            type: String,
            enum: ["active", "suspended", "banned"],
            default: "active",
        },
        refreshToken: {
            type: String,
            default: null,
        },
    },
    { timestamps: true }
);

userSchema.pre("save", async function (next) {
    if (!this.isModified("password")) return next();

    const salt = await bcrypt.genSalt(parseInt(process.env.SALT_ROUNDS) || 10);
    this.password = await bcrypt.hash(this.password, salt);

    return next();
});

userSchema.methods.isPasswordCorrect = async function (userPassword) {
    return await bcrypt.compare(userPassword, this.password);
};

userSchema.methods.generateAccessToken = function () {
    return jwt.sign(
        {
            _id: this._id,
            fullName: this.fullName,
            email: this.email,
            username: this.username,
        },
        process.env.ACCESS_TOKEN_SECRET,
        {
            expiresIn: process.env.ACCESS_TOKEN_EXPIRY || "15m",
            algorithm: "HS256",
        }
    );
};

userSchema.methods.generateRefreshToken = function () {
    return jwt.sign(
        {
            _id: this._id,
        },
        process.env.REFRESH_TOKEN_SECRET,
        {
            expiresIn: process.env.REFRESH_TOKEN_EXPIRY || "30d",
            algorithm: "HS256",
        }
    );
};

userSchema.set("toJSON", {
    transform: (_doc, ret) => {
        delete ret.password;
        delete ret.refreshToken;
        delete ret.__v;
        return ret;
    },
});

userSchema.index({ fullName: 1 });
userSchema.index({ email: 1 });
userSchema.index({ username: 1 });

export const User = mongoose.model("User", userSchema);
