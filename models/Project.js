// backend/models/Project.js
import mongoose from "mongoose";

const ProjectSchema = new mongoose.Schema(
  {
    client: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    title: { type: String, required: true },
    description: { type: String, default: "" },
    budget: { type: Number, default: 0 },
    status: { type: String, default: "open" }, // open, allocated, in-progress, completed
    assignedFreelancer: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
  },
  { timestamps: true }
);

export default mongoose.model("Project", ProjectSchema);
