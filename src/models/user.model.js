import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import jwt from 'jsonwebtoken';

const userSchema = new mongoose.Schema(
    {
        fullName: {
            type: String,
            required: true,
            trim: true,
            index: true,
        },
        email: {
            type: String,
            required: true,
            unique: true,
            trim: true,
            lowercase: true,
        },
        username: {
            type: String,
            required: true,
            unique: true,
            lowercase: true,
            trim: true,
        },
        password: {
            type: String,
            required: true,
            trim: true,
        },
        profile: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Profile',
        },
        refreshToken: {
            type: String,
            required: true,
        }
    }, 
    { timestamps: true }
);

userSchema.pre('save', async function(_req, _res, next){
    if(!this.isModified("password")) return next();

    this.password = await bcrypt.hash(this.password, 10);

    return next();
});

userSchema.methods.isPasswordCorrect = async function(password) {
    return await bcrypt.compare(this.password, password);
};

userSchema.methods.generateAccessToken = function() {
    return jwt.sign(
        {
            _id: this._id,
            fullName: this.fullName,
            email: this.email,
            username: this.username
        },
        process.env.ACCESS_TOKEN_SECRET,
        {
            expiresIn: process.env.ACCESS_TOKEN_EXPIRY
        }
    );
};

userSchema.methods.generateRefreshToken = function() {
    return jwt.sign(
        {
            _id: this._id
        },
        process.env.REFRESH_TOKEN_SECRET,
        {
            expiresIn: process.env.REFRESH_TOKEN_EXPIRY
        }
    )
};

export const User = mongoose.model("User", userSchema);