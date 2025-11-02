// backend/routes/taskRoutes.js
import express from "express";
import auth from "../middleware/authMiddleware.js";
import { createTask, getTasksByProject, updateTask, deleteTask, updateTaskStatus } from "../controllers/taskController.js";

const router = express.Router();

router.post("/", auth, createTask);
router.get("/project/:projectId", auth, getTasksByProject);
router.put("/:id", auth, updateTask);
router.delete("/:id", auth, deleteTask);
router.patch("/:id/status", auth, updateTaskStatus);

export default router;