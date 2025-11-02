import Message from "../models/Message.js";
import User from "../models/User.js"; // ADDED: Import User model
import { getSocketIO } from "../utils/socket.js";

export const getMessagesByProject = async (req, res) => {
  try {
    const messages = await Message.find({ project: req.params.projectId })
      .populate("sender", "name _id")
      .sort({ createdAt: 1 });
    res.json(messages);
  } catch (err) {
    console.error("Get messages error:", err);
    res.status(500).send("Server Error");
  }
};

export const createMessage = async (req, res) => {
  try {
    const { project, content } = req.body;
    if (!project || !content) return res.status(400).json({ error: "project and content required" });
    const sender = req.user.id;
    let message = new Message({ project, content, sender });
    await message.save();
    message = await Message.findById(message._id).populate("sender", "name _id");
    try {
      const io = getSocketIO();
      io.to(`project_${project}`).emit("messageCreated", message);
    } catch (e) {
      console.warn("Socket emit skipped (not initialized?)", e.message || e);
    }
    res.status(201).json(message);
  } catch (err) {
    console.error("Create message error:", err);
    res.status(500).send("Server Error");
  }
};

export const getDirectMessages = async (req, res) => {
  try {
    const currentUser = req.user.id;
    const otherUser = req.params.userId;

    const messages = await Message.find({
      $or: [
        { sender: currentUser, receiver: otherUser },
        { sender: otherUser, receiver: currentUser }
      ],
      project: null
    })
    .populate("sender", "name _id profilePicture")
    .populate("receiver", "name _id profilePicture")
    .sort({ createdAt: 1 });

    res.json(messages);
  } catch (err) {
    console.error("Get direct messages error:", err);
    res.status(500).send("Server Error");
  }
};

export const createDirectMessage = async (req, res) => {
  try {
    const { receiver, content } = req.body;
    if (!receiver || !content) {
      return res.status(400).json({ error: "Receiver and content are required" });
    }

    const sender = req.user.id;
    let message = new Message({
      sender,
      receiver,
      content,
      project: null
    });
    await message.save();

    message = await Message.findById(message._id)
      .populate("sender", "name _id profilePicture")
      .populate("receiver", "name _id profilePicture");
    
    const io = getSocketIO();
    io.to(`user_${receiver}`).emit("directMessageCreated", message);
    io.to(`user_${sender}`).emit("directMessageCreated", message);

    res.status(201).json(message);
  } catch (err) {
    console.error("Create direct message error:", err);
    res.status(500).send("Server Error");
  }
};

// ADDED: Get user's conversations
export const getConversations = async (req, res) => {
  try {
    const currentUser = req.user.id;
    
    // Find all unique users that the current user has messaged with
    const conversations = await Message.aggregate([
      {
        $match: {
          $or: [
            { sender: currentUser },
            { receiver: currentUser }
          ],
          project: null
        }
      },
      {
        $group: {
          _id: {
            $cond: [
              { $eq: ["$sender", currentUser] },
              "$receiver",
              "$sender"
            ]
          },
          lastMessage: { $last: "$$ROOT" },
          unreadCount: {
            $sum: {
              $cond: [
                { $and: [
                  { $eq: ["$receiver", currentUser] },
                  { $eq: ["$read", false] }
                ]},
                1,
                0
              ]
            }
          }
        }
      },
      {
        $lookup: {
          from: "users",
          localField: "_id",
          foreignField: "_id",
          as: "user"
        }
      },
      {
        $unwind: "$user"
      },
      {
        $project: {
          _id: 0,
          user: {
            _id: "$user._id",
            name: "$user.name",
            profilePicture: "$user.profilePicture",
            role: "$user.role"
          },
          lastMessage: 1,
          unreadCount: 1
        }
      },
      {
        $sort: { "lastMessage.createdAt": -1 }
      }
    ]);

    res.json(conversations);
  } catch (err) {
    console.error("Get conversations error:", err);
    res.status(500).send("Server Error");
  }
};