// backend/routes/ProjectRoutes.js
import express from "express";
import {
  createProject,
  getProjects,
  getMyProjects,
  updateProject,
  deleteProject,
  getProjectById,
  getFreelancerProjects
} from "../controllers/projectController.js";
import auth from "../middleware/authMiddleware.js";

const router = express.Router();

router.post("/", auth, createProject);
router.get("/", auth, getProjects);
router.get("/my-projects", auth, getMyProjects);
router.get("/freelancer-projects", auth, getFreelancerProjects);
router.get("/:id", auth, getProjectById);

router.put("/:id", auth, updateProject);
router.delete("/:id", auth, deleteProject);

export default router;