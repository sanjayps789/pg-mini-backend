// backend/controllers/projectController.js
import Project from "../models/Project.js";
import Proposal from "../models/Proposal.js";

export const createProject = async (req, res) => {
  try {
    const { title, description, budget } = req.body;
    const project = new Project({
      client: req.user.id,
      title,
      description,
      budget,
      status: "open",
    });
    await project.save();

    await project.populate("client", "name email");
    res.status(201).json(project);
  } catch (err) {
    console.error("createProject:", err);
    res.status(500).send("Server Error");
  }
};

export const getProjects = async (req, res) => {
  try {
    const projects = await Project.find({})
      .populate("client", "name email rating") // MODIFIED: Added rating
      .populate("assignedFreelancer", "_id name");
    res.json(projects);
  } catch (err) {
    console.error("getProjects:", err);
    res.status(500).send("Server Error");
  }
};

export const getMyProjects = async (req, res) => {
  try {
    const projects = await Project.find({ client: req.user.id })
      .populate("client", "name email")
      .populate("assignedFreelancer", "name email");
    res.json(projects);
  } catch (err) {
    console.error("getMyProjects:", err);
    res.status(500).send("Server Error");
  }
};

export const getProjectById = async (req, res) => {
  try {
    const project = await Project.findById(req.params.id)
      .populate("client", "name email")
      .populate("assignedFreelancer", "name email");

    if (!project) {
      return res.status(404).json({ msg: "Project not found" });
    }
    res.json(project);
  } catch (err) {
    console.error("getProjectById Error:", err.message);
    res.status(500).send("Server Error");
  }
};

export const updateProject = async (req, res) => {
  try {
    const projectId = req.params.id;
    const updates = req.body;

    const project = await Project.findById(projectId);
    if (!project) return res.status(404).json({ msg: "Project not found" });

    if (String(project.client) !== String(req.user.id)) {
      return res.status(403).json({ msg: "Forbidden: not your project" });
    }

    const allowed = ["title", "description", "budget", "status", "assignedFreelancer"];
    allowed.forEach((k) => {
      if (updates[k] !== undefined) project[k] = updates[k];
    });

    await project.save();
    const populated = await Project.findById(projectId).populate("client", "name email").populate("assignedFreelancer", "name email");
    res.json(populated);
  } catch (err) {
    console.error("updateProject:", err);
    res.status(500).send("Server Error");
  }
};

export const deleteProject = async (req, res) => {
  try {
    const projectId = req.params.id;
    const project = await Project.findById(projectId);
    if (!project) return res.status(404).json({ msg: "Project not found" });

    if (String(project.client) !== String(req.user.id)) {
      return res.status(403).json({ msg: "Forbidden: not your project" });
    }

    await Project.findByIdAndDelete(projectId);
    res.json({ msg: "Project deleted" });
  } catch (err) {
    console.error("deleteProject:", err);
    res.status(500).send("Server Error");
  }
};

export const getFreelancerProjects = async (req, res) => {
    try {
        const proposals = await Proposal.find({ freelancer: req.user.id, status: 'accepted' }).populate({
            path: 'project',
            populate: [
                { path: 'client', select: 'name email' },
                { path: 'assignedFreelancer', select: 'name email' }
            ]
        });
        const projects = proposals.map(p => p.project);
        res.json(projects);
    } catch (err) {
        console.error("getFreelancerProjects:", err);
        res.status(500).send("Server Error");
    }
};