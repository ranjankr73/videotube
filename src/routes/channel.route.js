import { Router } from "express";
import {
    createChannel,
    deleteChannel,
    getChannelByHandle,
    getChannelStats,
    updateChannelBanner,
    updateChannelDetails,
} from "../controllers/channel.controller.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import { upload } from "../middlewares/multer.middleware.js";

const router = Router();

router.route("/u/:handle").get(getChannelByHandle);

router.use(verifyJWT);

router
    .route("/")
    .post(createChannel)
    .patch(updateChannelDetails)
    .delete(deleteChannel);
router.route("/stats").get(getChannelStats);
router
    .route("/banner")
    .patch(upload.single("bannerImage"), updateChannelBanner);

export default router;
