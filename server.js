import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import http from "http";
import path from "path";
import { fileURLToPath } from "url";
import connectDB from "./config/db.js";
import { initSocket } from "./utils/socket.js";

// Import routes
import authRoutes from "./routes/auth.js";
import projectRoutes from "./routes/ProjectRoutes.js";
import proposalRoutes from "./routes/proposalRoutes.js";
import taskRoutes from "./routes/taskRoutes.js";
import deliverableRoutes from "./routes/deliverableRoutes.js";
import messageRoutes from "./routes/messageRoutes.js";
import notificationRoutes from "./routes/notificationRoutes.js";
import userRoutes from './routes/userRoutes.js';
import paymentRoutes from "./routes/paymentRoutes.js";
import feedbackRoutes from './routes/feedbackRoutes.js';

dotenv.config();
connectDB();

const app = express();
const PORT = process.env.PORT || 8000;

// Define your allowed origins for both CORS and Socket.IO
const allowedOrigins = [
  'http://localhost:5173', // Your EC2 Public IP
  // You can add your domain name here later if you get one
  // 'http://www.yourdomain.com'
];

const corsOptions = {
  origin: (origin, callback) => {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    
    if (allowedOrigins.indexOf(origin) === -1) {
      const msg = 'The CORS policy for this site does not allow access from the specified Origin.';
      return callback(new Error(msg), false);
    }
    return callback(null, true);
  },
  credentials: true,
};

app.use(cors(corsOptions));
app.use(express.json());

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// API routes
app.use("/api/auth", authRoutes);
app.use("/api/projects", projectRoutes);
app.use("/api/proposals", proposalRoutes);
app.use("/api/tasks", taskRoutes);
app.use("/api/deliverables", deliverableRoutes);
app.use("/api/messages", messageRoutes);
app.use("/api/notifications", notificationRoutes);
app.use('/api/users', userRoutes);
app.use("/api/payment", paymentRoutes);
app.use("/api/feedback", feedbackRoutes);

const server = http.createServer(app);

// Pass the allowedOrigins to the socket initializer
initSocket(server, allowedOrigins);

server.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});
