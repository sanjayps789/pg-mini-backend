// backend/routes/notificationRoutes.js
import express from "express";
import auth from "../middleware/authMiddleware.js";
import { getNotifications, markRead, markAllRead } from "../controllers/notificationController.js";

const router = express.Router();

router.get("/", auth, getNotifications);
router.patch("/read-all", auth, markAllRead); // ADDED THIS ROUTE
router.patch("/:id/read", auth, markRead);

export default router;