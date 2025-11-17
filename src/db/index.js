import mongoose from "mongoose";
import { DB_NAME } from "../constants.js";

const connectDB = async () => {
    if (mongoose.connection.readyState >= 1) {
        console.log("MongoDB already connected.");
        return mongoose.connection;
    }

    const MONGODB_URI = `${process.env.MONGODB_URI}/${DB_NAME}`;

    try {
        const connectionInstance = await mongoose.connect(MONGODB_URI, {
            autoIndex: false,
            serverSelectionTimeoutMS: 5000,
        });

        console.log(
            `MongoDB connected ! Host: ${connectionInstance.connection.host}`
        );

        return connectionInstance;
    } catch (error) {
        console.error("MongoDB connection failed!");
        console.error(error.message || error);
        process.exit(1);
    }
};

export default connectDB;
