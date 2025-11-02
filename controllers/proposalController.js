// backend/controllers/proposalController.js
import Proposal from "../models/Proposal.js";
import Project from "../models/Project.js";
import Notification from "../models/Notification.js";
import User from "../models/User.js";
import { getSocketIO } from "../utils/socket.js";

/**
 * Freelancer creates a proposal for a project
 */
export const createProposal = async (req, res) => {
  try {
    const { projectId, coverLetter = "", bidAmount = 0 } = req.body;
    const freelancerId = req.user.id;

    const project = await Project.findById(projectId).populate("client", "name email");
    if (!project) return res.status(404).json({ msg: "Project not found" });

    if (String(project.client?._id || project.client) === String(freelancerId)) {
      return res.status(400).json({ msg: "Cannot apply to your own project" });
    }

    const already = await Proposal.findOne({ project: projectId, freelancer: freelancerId });
    if (already) {
      return res.status(400).json({ msg: "You already applied to this project" });
    }

    const proposal = new Proposal({
      project: projectId,
      freelancer: freelancerId,
      coverLetter,
      bidAmount,
      status: "pending",
    });
    await proposal.save();

    const freelancer = await User.findById(freelancerId).select("name email");

    const notification = await Notification.create({
      user: project.client._id || project.client,
      type: "proposal_received",
      payload: {
        projectId: project._id,
        projectTitle: project.title,
        proposalId: proposal._id,
        freelancerId: freelancer._id,
        freelancerName: freelancer.name,
      },
    });

    try {
      const io = getSocketIO();
      if (io) {
        io.to(`user_${String(project.client._id || project.client)}`).emit("notification", {
          id: notification._id,
          type: notification.type,
          payload: notification.payload,
          createdAt: notification.createdAt,
        });
      }
    } catch (emitErr) {
      console.error("Error emitting notification via socket:", emitErr);
    }

    const populatedProposal = await Proposal.findById(proposal._id)
      .populate("freelancer", "name email")
      .populate("project", "title");

    res.status(201).json(populatedProposal);
  } catch (err) {
    console.error("createProposal:", err);
    res.status(500).send("Server Error");
  }
};

/**
 * Client fetch proposals for their own projects
 */
export const getProposalsForClient = async (req, res) => {
  try {
    const clientId = req.user.id;
    const proposals = await Proposal.find()
      .populate({
        path: "project",
        match: { client: clientId },
        select: "title client",
      })
      .populate("freelancer", "name email")
      .sort({ createdAt: -1 });

    const ownProposals = proposals.filter((p) => p.project);
    res.json(ownProposals);
  } catch (err) {
    console.error("getProposalsForClient:", err);
    res.status(500).send("Server Error");
  }
};

/**
 * Freelancer fetch proposals they submitted
 */
export const getProposalsForFreelancer = async (req, res) => {
  try {
    const freelancerId = req.user.id;
    const proposals = await Proposal.find({ freelancer: freelancerId })
      .populate("project", "title budget status client")
      .sort({ createdAt: -1 });

    res.json(proposals);
  } catch (err) {
    console.error("getProposalsForFreelancer:", err);
    res.status(500).send("Server Error");
  }
};

export const acceptProposal = async (req, res) => {
  try {
    const proposalId = req.params.id;
    const proposal = await Proposal.findById(proposalId).populate("project");
    if (!proposal) return res.status(404).json({ msg: "Proposal not found" });

    if (String(proposal.project.client) !== String(req.user.id)) {
      return res.status(403).json({ msg: "Forbidden" });
    }

    // --- AUTOMATION LOGIC ---
    // 1. Update the accepted proposal's status
    proposal.status = "accepted";
    await proposal.save();

    // 2. Update the project's status and assign the freelancer
    await Project.findByIdAndUpdate(proposal.project._id, {
        status: 'in-progress',
        assignedFreelancer: proposal.freelancer
    });

    // 3. Find and reject all other pending proposals for this project
    const otherProposals = await Proposal.find({
        project: proposal.project._id,
        _id: { $ne: proposalId }, // Exclude the accepted proposal
        status: 'pending'
    }).populate('project');

    for (const p of otherProposals) {
        p.status = 'rejected';
        await p.save();
        
        const rejectNotif = await Notification.create({
            user: p.freelancer,
            type: "proposal_rejected",
            payload: {
                projectId: p.project._id,
                projectTitle: p.project.title,
                proposalId: p._id,
                reason: "Another proposal was accepted for this project."
            },
        });
        
        try {
            const io = getSocketIO();
            if (io) {
                io.to(`user_${String(p.freelancer)}`).emit("notification", rejectNotif);
            }
        } catch (e) {
            console.error("Error emitting auto-reject notification:", e);
        }
    }
    // --- END AUTOMATION ---

    const notif = await Notification.create({
      user: proposal.freelancer,
      type: "proposal_accepted",
      payload: {
        projectId: proposal.project._id,
        projectTitle: proposal.project.title,
        proposalId: proposal._id,
      },
    });

    try {
      const io = getSocketIO();
      if (io) {
        io.to(`user_${String(proposal.freelancer)}`).emit("notification", {
          id: notif._id,
          type: notif.type,
          payload: notif.payload,
          createdAt: notif.createdAt,
        });
      }
    } catch (e) {
      console.error("Error emitting accept notification:", e);
    }

    res.json(proposal);
  } catch (err) {
    console.error("acceptProposal:", err);
    res.status(500).send("Server Error");
  }
};

export const rejectProposal = async (req, res) => {
  try {
    const proposalId = req.params.id;
    const proposal = await Proposal.findById(proposalId).populate("project");
    if (!proposal) return res.status(404).json({ msg: "Proposal not found" });

    if (String(proposal.project.client) !== String(req.user.id)) {
      return res.status(403).json({ msg: "Forbidden" });
    }

    proposal.status = "rejected";
    await proposal.save();

    await Notification.create({
      user: proposal.freelancer,
      type: "proposal_rejected",
      payload: {
        projectId: proposal.project._id,
        projectTitle: proposal.project.title,
        proposalId: proposal._id,
      },
    });

    res.json(proposal);
  } catch (err) {
    console.error("rejectProposal:", err);
    res.status(500).send("Server Error");
  }
};

export const withdrawProposal = async (req, res) => {
    try {
        const proposalId = req.params.id;
        const proposal = await Proposal.findById(proposalId).populate('project');

        if (!proposal) {
            return res.status(404).json({ msg: 'Proposal not found' });
        }

        if (String(proposal.freelancer) !== String(req.user.id)) {
            return res.status(403).json({ msg: 'Forbidden' });
        }

        if (proposal.status !== 'pending') {
            return res.status(400).json({ msg: 'Cannot withdraw a proposal that is not pending' });
        }

        await Proposal.findByIdAndDelete(proposalId);

        // Notify client
        const notification = await Notification.create({
            user: proposal.project.client,
            type: 'proposal_withdrawn',
            payload: {
                projectId: proposal.project._id,
                projectTitle: proposal.project.title,
                proposalId: proposal._id,
                freelancerName: req.user.name
            },
        });

        const io = getSocketIO();
        if (io) {
            io.to(`user_${String(proposal.project.client)}`).emit('notification', notification);
        }

        res.json({ msg: 'Proposal withdrawn' });
    } catch (err) {
        console.error('withdrawProposal:', err);
        res.status(500).send('Server Error');
    }
};


export default {
  createProposal,
  getProposalsForClient,
  getProposalsForFreelancer,
  acceptProposal,
  rejectProposal,
  withdrawProposal,
};