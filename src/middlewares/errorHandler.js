import { ApiError } from "../utils/ApiError.js";

export const errorHandler = (err, req, res, next) => {
    console.error("ERROR: ", err);

    if (!(err instanceof ApiError)) {
        err = new ApiError(
            err.statusCode || 500,
            err.message || "Internal Server Error",
            [],
            err.stack,
            false
        );
    }

    const statusCode = err.statusCode || 500;

    const responseBody = {
        success: false,
        message: err.message,
        errors: err.errors || [],
        data: null,
    };

    if (process.env.NODE_ENV !== "production") {
        responseBody.stack = err.stack;
    }

    return res.status(statusCode).json(responseBody);
};
