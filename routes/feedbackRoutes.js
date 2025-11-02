// backend/routes/feedbackRoutes.js
import express from 'express';
import auth from '../middleware/authMiddleware.js';
import { submitFeedback, getReviewsForUser } from '../controllers/feedbackController.js';

const router = express.Router();

// @route   POST api/feedback
// @desc    Submit feedback for a completed project
router.post('/', auth, submitFeedback);

// @route   GET api/feedback/user/:userId
// @desc    Get all reviews for a specific user
router.get('/user/:userId', auth, getReviewsForUser);

export default router;