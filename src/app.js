import express from "express";
import cookieParser from "cookie-parser";
import cors from "cors";
import { ApiError } from "./utils/ApiError.js";
import { errorHandler } from "./middlewares/errorHandler.middleware.js";

const app = express();

app.use(
    cors({
        origin: process.env.CORS_ORIGIN,
        credentials: true,
    })
);

app.use(express.json({ limit: "16kb" }));
app.use(express.urlencoded({ extended: true, limit: "16kb" }));
app.use(express.static("public"));
app.use(cookieParser());

//import routes
import userRouter from "./routes/user.route.js";
import profileRouter from "./routes/profile.route.js";

app.use("/api/v1/users", userRouter);
app.use("/api/v1/profiles", profileRouter);

app.use((req, res, next) => {
    next(new ApiError(404, `Route ${req.originalUrl} not found!`));
});

app.use(errorHandler);

export default app;
