import { Router } from "express";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import {
    getProfile,
    getPublicProfile,
    updateAvatar,
    updateCoverImage,
    updateProfile,
} from "../controllers/profile.controller.js";

const router = Router();

router.route("/:username").get(getPublicProfile);

router.route("/me").get(verifyJWT, getProfile);
router.route("/").patch(verifyJWT, updateProfile);
router.route("/avatar").patch(verifyJWT, updateAvatar);
router.route("/cover-image").patch(verifyJWT, updateCoverImage);

export default router;
