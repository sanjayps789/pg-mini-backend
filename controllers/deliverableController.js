// backend/controllers/deliverableController.js
import Deliverable from "../models/Deliverable.js";
import { getSocketIO } from "../utils/socket.js";
import { cloudinary } from '../config/cloudinary.js'; // ADDED: Import Cloudinary config

export const uploadDeliverable = async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: "No file uploaded." });

    const { project, description } = req.body;
    if (!project) return res.status(400).json({ error: "Project is required." });

    const uploadedBy = req.user.id;

    // MODIFIED: Get URL and public_id from Cloudinary via req.file
    const fileUrl = req.file.path;
    const public_id = req.file.filename;

    const d = await Deliverable.create({
      project,
      fileUrl,
      public_id, // ADDED
      description: description || "",
      uploadedBy,
      status: "pending",
    });

    const populated = await Deliverable.findById(d._id).populate("uploadedBy", "name _id");

    try {
      const io = getSocketIO();
      io.to(`project_${project}`).emit("deliverableUploaded", populated);
    } catch (e) {
      console.warn("Socket emit skipped (not initialized?)", e.message || e);
    }

    res.status(201).json(populated);
  } catch (err) {
    console.error("Upload Deliverable Error:", err);
    res.status(500).json({ error: err.message });
  }
};

export const getDeliverablesByProject = async (req, res) => {
  try {
    const deliverables = await Deliverable.find({ project: req.params.projectId })
      .populate("uploadedBy", "name _id")
      .sort({ createdAt: 1 });
    res.json(deliverables);
  } catch (err) {
    console.error("Get Deliverables Error:", err);
    res.status(500).json({ error: err.message });
  }
};

export const updateDeliverable = async (req, res) => {
  try {
    const deliverable = await Deliverable.findByIdAndUpdate(req.params.id, req.body, { new: true }).populate(
      "uploadedBy",
      "name _id"
    );
    if (!deliverable) return res.status(404).json({ error: "Deliverable not found" });

    try {
      const io = getSocketIO();
      io.to(`project_${deliverable.project.toString()}`).emit("deliverableUpdated", deliverable);
    } catch (e) {
      console.warn("Socket emit skipped (not initialized?)", e.message || e);
    }

    res.json(deliverable);
  } catch (err) {
    console.error("Update Deliverable Error:", err);
    res.status(500).json({ error: err.message });
  }
};

export const deleteDeliverable = async (req, res) => {
  try {
    const deliverable = await Deliverable.findById(req.params.id);
    if (!deliverable) return res.status(404).json({ error: "Deliverable not found" });

    if (deliverable.uploadedBy.toString() !== req.user.id) {
      return res.status(403).json({ error: "Only the uploader can delete this deliverable" });
    }

    const projectId = deliverable.project.toString();
    
    // MODIFIED: Remove the file from Cloudinary instead of the local filesystem
    if (deliverable.public_id) {
        await cloudinary.uploader.destroy(deliverable.public_id);
    }

    await deliverable.deleteOne();

    try {
      const io = getSocketIO();
      io.to(`project_${projectId}`).emit("deliverableDeleted", { _id: req.params.id });
    } catch (e) {
      console.warn("Socket emit skipped (not initialized?)", e.message || e);
    }

    res.json({ message: "Deliverable deleted", _id: req.params.id });
  } catch (err) {
    console.error("Delete Deliverable Error:", err);
    res.status(500).json({ error: err.message });
  }
};