import { Router } from "express";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import {
    toggleVideoLike,
    togglePostLike,
    toggleCommentLike,
    getLikedVideos,
    getLikedPosts,
    getLikedComments,
} from "../controllers/like.controller.js";

const router = Router();

// Protected Routes
router.use(verifyJWT);

router.route("/video/:videoId").post(toggleVideoLike);
router.route("/post/:postId").post(togglePostLike);
router.route("/comment/:commentId").post(toggleCommentLike);

router.route("/videos").get(getLikedVideos);
router.route("/posts").get(getLikedPosts);
router.route("/comments").get(getLikedComments);

export default router;
