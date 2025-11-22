import { Router } from "express";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import { upload } from "../middlewares/multer.middleware.js";
import {
    createPost,
    getPostById,
    getChannelPosts,
    updatePost,
    deletePost,
    togglePostPublishStatus,
} from "../controllers/post.controller.js";

const router = Router();

// Public routes
router.route("/:postId").get(getPostById);
router.route("/channel/:handle").get(getChannelPosts);

// Protected routes
router.use(verifyJWT);

router.route("/").post(upload.array("media", 5), createPost);

router
    .route("/:postId")
    .patch(upload.array("media", 5), updatePost)
    .delete(deletePost);

router.route("/toggle/publish/:postId").patch(togglePostPublishStatus);

export default router;
