import { Router } from "express";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import {
    addComment,
    replyToComment,
    getCommentsForVideo,
    getCommentsForPost,
    updateComment,
    deleteComment,
    pinComment,
} from "../controllers/comment.controller.js";

const router = Router();

// Public Routes
router.route("/video/:videoId").get(getCommentsForVideo);
router.route("/post/:postId").get(getCommentsForPost);

// Protected Routes
router.use(verifyJWT);

router.route("/video/:videoId").post(addComment);
router.route("/post/:postId").post(addComment);

router.route("/reply/:commentId").post(replyToComment);

router.route("/:commentId").patch(updateComment).delete(deleteComment);

router.route("/pin/:commentId").patch(pinComment);

export default router;
