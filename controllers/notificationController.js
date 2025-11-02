// backend/controllers/notificationController.js
import Notification from "../models/Notification.js";
import User from "../models/User.js";

/**
 * Get notifications for logged-in user
 * GET /api/notifications
 */
export const getNotifications = async (req, res) => {
  try {
    const userId = req.user.id;
    const notes = await Notification.find({ user: userId }).sort({ createdAt: -1 });
    res.json(notes);
  } catch (err) {
    console.error("getNotifications:", err);
    res.status(500).send("Server Error");
  }
};

/**
 * Mark notification as read
 * PATCH /api/notifications/:id/read
 */
export const markRead = async (req, res) => {
  try {
    const n = await Notification.findById(req.params.id);
    if (!n) return res.status(404).json({ msg: "Not found" });
    if (String(n.user) !== String(req.user.id)) return res.status(403).json({ msg: "Forbidden" });
    n.read = true;
    await n.save();
    res.json(n);
  } catch (err) {
    console.error("markRead:", err);
    res.status(500).send("Server Error");
  }
};

/**
 * Mark all notifications as read for the logged-in user
 * PATCH /api/notifications/read-all
 */
export const markAllRead = async (req, res) => {
  try {
    await Notification.updateMany(
      { user: req.user.id, read: false },
      { $set: { read: true } }
    );
    res.status(200).json({ msg: "All notifications marked as read." });
  } catch (err) {
    console.error("markAllRead:", err);
    res.status(500).send("Server Error");
  }
};