// backend/models/Review.js
import mongoose from 'mongoose';

const ReviewSchema = new mongoose.Schema({
  project: { type: mongoose.Schema.Types.ObjectId, ref: 'Project', required: true },
  reviewer: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  reviewee: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  rating: { type: Number, required: true, min: 1, max: 5 },
  comment: { type: String, required: true, trim: true },
  reviewerRole: { type: String, enum: ['client', 'freelancer'], required: true }
}, { timestamps: true });

// Ensure a user can only review another user once per project
ReviewSchema.index({ project: 1, reviewer: 1 }, { unique: true });

const Review = mongoose.model('Review', ReviewSchema);
export default Review;