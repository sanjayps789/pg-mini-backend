// backend/models/Deliverable.js
import mongoose from "mongoose";

const deliverableSchema = new mongoose.Schema(
  {
    project: { type: mongoose.Schema.Types.ObjectId, ref: "Project", required: true },
    fileUrl: { type: String, required: true },
    public_id: { type: String, required: true }, // ADDED: To store Cloudinary public ID
    description: { type: String },
    status: { type: String, enum: ["pending", "approved", "rejected"], default: "pending" },
    uploadedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  },
  { timestamps: true }
);

export default mongoose.model("Deliverable", deliverableSchema);