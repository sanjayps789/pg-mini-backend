// backend/controllers/taskController.js
import Task from "../models/Task.js";
import { getSocketIO } from "../utils/socket.js";

export const createTask = async (req, res) => {
  try {
    const { project, title, description, assignedTo } = req.body;
    if (!project || !title) {
      return res.status(400).json({ error: "project and title are required" });
    }

    const createdBy = req.user.id;
    const task = await Task.create({
      project,
      title,
      description: description || "",
      assignedTo: assignedTo || null,
      createdBy,
      status: "todo",
    });

    const populated = await Task.findById(task._id)
      .populate("createdBy", "name _id")
      .populate("assignedTo", "name _id");

    try {
      const io = getSocketIO();
      io.to(`project_${project}`).emit("taskCreated", populated);
    } catch (e) {
      console.warn("Socket emit skipped (not initialized?)", e.message || e);
    }

    res.status(201).json(populated);
  } catch (err) {
    console.error("Create Task Error:", err);
    res.status(500).json({ error: err.message });
  }
};

export const getTasksByProject = async (req, res) => {
  try {
    const tasks = await Task.find({ project: req.params.projectId })
      .populate("createdBy", "name _id")
      .populate("assignedTo", "name _id")
      .sort({ createdAt: 1 });
    res.json(tasks);
  } catch (err) {
    console.error("Get Tasks Error:", err);
    res.status(500).json({ error: err.message });
  }
};

export const updateTask = async (req, res) => {
  try {
    const updates = {};
    const allowed = ["title", "description", "status", "assignedTo"];
    allowed.forEach((k) => {
      if (req.body[k] !== undefined) updates[k] = req.body[k];
    });

    const task = await Task.findByIdAndUpdate(req.params.id, updates, { new: true })
      .populate("createdBy", "name _id")
      .populate("assignedTo", "name _id");

    if (!task) return res.status(404).json({ error: "Task not found" });

    try {
      const io = getSocketIO();
      io.to(`project_${task.project.toString()}`).emit("taskUpdated", task);
    } catch (e) {
      console.warn("Socket emit skipped (not initialized?)", e.message || e);
    }

    res.json(task);
  } catch (err) {
    console.error("Update Task Error:", err);
    res.status(500).json({ error: err.message });
  }
};

export const deleteTask = async (req, res) => {
  try {
    const task = await Task.findById(req.params.id);
    if (!task) return res.status(404).json({ error: "Task not found" });

    if (task.createdBy.toString() !== req.user.id) {
      return res.status(403).json({ error: "Only the task creator can delete this task" });
    }

    await task.deleteOne();

    try {
      const io = getSocketIO();
      io.to(`project_${task.project.toString()}`).emit("taskDeleted", { _id: req.params.id });
    } catch (e) {
      console.warn("Socket emit skipped (not initialized?)", e.message || e);
    }

    res.json({ message: "Task deleted", _id: req.params.id });
  } catch (err) {
    console.error("Delete Task Error:", err);
    res.status(500).json({ error: err.message });
  }
};

export const updateTaskStatus = async (req, res) => {
    try {
        const { status } = req.body;
        const task = await Task.findByIdAndUpdate(req.params.id, { status }, { new: true })
            .populate("createdBy", "name _id")
            .populate("assignedTo", "name _id");

        if (!task) return res.status(404).json({ error: "Task not found" });

        try {
            const io = getSocketIO();
            io.to(`project_${task.project.toString()}`).emit("taskUpdated", task);
        } catch (e) {
            console.warn("Socket emit skipped (not initialized?)", e.message || e);
        }

        res.json(task);
    } catch (err) {
        console.error("Update Task Status Error:", err);
        res.status(500).json({ error: err.message });
    }
};