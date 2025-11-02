// backend/controllers/feedbackController.js
import Review from '../models/Review.js';
import Project from '../models/Project.js';
import User from '../models/User.js';

// Function to calculate and update a user's average rating
const updateUserRating = async (userId) => {
    const reviews = await Review.find({ reviewee: userId });
    if (reviews.length > 0) {
        const totalRating = reviews.reduce((acc, item) => acc + item.rating, 0);
        const averageRating = totalRating / reviews.length;
        await User.findByIdAndUpdate(userId, { rating: averageRating.toFixed(1) });
    }
};

export const submitFeedback = async (req, res) => {
    const { projectId, rating, comment } = req.body;
    const reviewerId = req.user.id;
    const reviewerRole = req.user.role;

    try {
        const project = await Project.findById(projectId);
        if (!project) {
            return res.status(404).json({ msg: "Project not found." });
        }

        // --- REMOVED THIS CHECK to allow feedback at any time ---
        // if (project.status !== 'completed') {
        //     return res.status(400).json({ msg: "Feedback can only be submitted for completed projects." });
        // }

        const revieweeId = reviewerRole === 'client' ? project.assignedFreelancer : project.client;
        if (!revieweeId) {
            return res.status(400).json({ msg: "This project does not have an assigned user to review." });
        }

        const existingReview = await Review.findOne({ project: projectId, reviewer: reviewerId });
        if (existingReview) {
            return res.status(400).json({ msg: "You have already submitted feedback for this project." });
        }

        const review = new Review({
            project: projectId,
            reviewer: reviewerId,
            reviewee: revieweeId,
            rating,
            comment,
            reviewerRole
        });

        await review.save();
        await updateUserRating(revieweeId);

        res.status(201).json(review);
    } catch (err) {
        console.error("submitFeedback Error:", err.message);
        res.status(500).send("Server Error");
    }
};

// Get all reviews for a specific user
export const getReviewsForUser = async (req, res) => {
    try {
        const { userId } = req.params;
        const reviews = await Review.find({ reviewee: userId })
            .populate('reviewer', 'name profilePicture')
            .sort({ createdAt: -1 });
            
        res.json(reviews);
    } catch (err) {
        console.error("getReviewsForUser Error:", err.message);
        res.status(500).send("Server Error");
    }
};