// backend/routes/deliverableRoutes.js
import express from "express";
import multer from "multer";
import auth from "../middleware/authMiddleware.js";
import {
  uploadDeliverable,
  getDeliverablesByProject,
  updateDeliverable,
  deleteDeliverable,
} from "../controllers/deliverableController.js";
import { storage } from '../config/cloudinary.js'; // MODIFIED: Import Cloudinary storage

const router = express.Router();

// MODIFIED: Set up multer to use Cloudinary storage instead of local disk
const upload = multer({ storage });

// Protected endpoints
router.post("/", auth, upload.single("file"), uploadDeliverable);
router.get("/project/:projectId", auth, getDeliverablesByProject);
router.put("/:id", auth, updateDeliverable);
router.delete("/:id", auth, deleteDeliverable);

export default router;