import { Router } from "express";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import {
    getMyActivity,
    logWatchActivity,
    logLikeActivity,
    logCommentActivity,
    logPostActivity,
    deleteMyActivity,
} from "../controllers/activity.controller.js";

const router = Router();

// Protected routes
router.use(verifyJWT);

router.route("/me").get(getMyActivity);
router.route("/watch/:videoId").post(logWatchActivity);
router.route("/like").post(logLikeActivity);
router.route("/comment/:commentId").post(logCommentActivity);
router.route("/post/:postId").post(logPostActivity);
router.route("/:activityId").delete(deleteMyActivity);

export default router;
