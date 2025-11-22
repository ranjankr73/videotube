import { Router } from "express";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import { upload } from "../middlewares/multer.middleware.js";
import {
    createPlaylist,
    updatePlaylist,
    deletePlaylist,
    addVideoToPlaylist,
    removeVideoFromPlaylist,
    getPlaylistById,
    getUserPlaylists,
    getCurrentUserPlaylists,
} from "../controllers/playlist.controller.js";

const router = Router();

// Public routes
router.route("/:playlistId").get(getPlaylistById);
router.route("/u/:userId").get(getUserPlaylists);

// Protected routes
router.use(verifyJWT);

router.route("/").post(upload.single("thumbnail"), createPlaylist);

router.route("/me").get(getCurrentUserPlaylists);

router
    .route("/:playlistId")
    .patch(upload.single("thumbnail"), updatePlaylist)
    .delete(deletePlaylist);

router.route("/:playlistId/videos").post(addVideoToPlaylist);

router.route("/:playlistId/videos/:videoId").delete(removeVideoFromPlaylist);

export default router;
