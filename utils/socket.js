import { Server } from "socket.io";

let io;

export const initSocket = (server, allowedOrigins = "*") => {
  io = new Server(server, {
    cors: {
      origin: allowedOrigins,
      methods: ["GET", "POST"],
      credentials: true,
    },
  });

  io.on("connection", (socket) => {
    console.log("✅ Socket connected:", socket.id);

    // Join a project room
    socket.on("joinProject", ({ projectId }) => {
      try {
        if (!projectId) return;
        const room = `project_${projectId}`;
        socket.join(room);
        console.log(`Socket ${socket.id} joined room ${room}`);
      } catch (e) {
        console.error("joinProject error", e);
      }
    });

    // Join a user room for direct messages
    socket.on("joinUser", ({ userId }) => {
      try {
        if (!userId) return;
        const room = `user_${userId}`;
        socket.join(room);
        console.log(`Socket ${socket.id} joined user room ${room}`);
      } catch (e) {
        console.error("joinUser error", e);
      }
    });

    // Leave a project room
    socket.on("leaveProject", ({ projectId }) => {
      try {
        if (!projectId) return;
        const room = `project_${projectId}`;
        socket.leave(room);
        console.log(`Socket ${socket.id} left room ${room}`);
      } catch (e) {
        console.error("leaveProject error", e);
      }
    });

    // Leave a user room
    socket.on("leaveUser", ({ userId }) => {
      try {
        if (!userId) return;
        const room = `user_${userId}`;
        socket.leave(room);
        console.log(`Socket ${socket.id} left user room ${room}`);
      } catch (e) {
        console.error("leaveUser error", e);
      }
    });

    socket.on("disconnect", () => {
      console.log("❌ Socket disconnected:", socket.id);
    });
  });

  return io;
};

export const getSocketIO = () => {
  if (!io) {
    throw new Error("Socket.io not initialized!");
  }
  return io;
};