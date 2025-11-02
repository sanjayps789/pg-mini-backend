import express from "express";
import { 
  createMessage, 
  getMessagesByProject, 
  getDirectMessages, 
  createDirectMessage,
  getConversations // ADDED: New function to get conversations
} from "../controllers/messageController.js";
import auth from "../middleware/authMiddleware.js";

const router = express.Router();

// Project messages
router.post("/", auth, createMessage);
router.get("/project/:projectId", auth, getMessagesByProject);

// Direct messages
router.get("/direct/:userId", auth, getDirectMessages);
router.post("/direct", auth, createDirectMessage);

// ADDED: Route to get user's conversations
router.get("/conversations", auth, getConversations);

export default router;