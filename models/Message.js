import mongoose from "mongoose";

const messageSchema = new mongoose.Schema(
  {
    project: { type: mongoose.Schema.Types.ObjectId, ref: "Project" }, 
    sender: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    receiver: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    content: { type: String, required: true },
    read: { type: Boolean, default: false }, // ADDED: Read status for messages
  },
  { timestamps: true }
);

export default mongoose.model("Message", messageSchema);