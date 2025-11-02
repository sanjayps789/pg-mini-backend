// backend/models/User.js
import mongoose from 'mongoose';

const UserSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    role: {
      type: String,
      enum: ['client', 'freelancer'],
      required: true,
    },
    otp: { type: String },
    otpExpires: { type: Date },
    skills: { type: [String], default: [] },
    bio: { type: String, default: '' },
    rating: { type: Number, default: 0 },
    reviews: [
      {
        client: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        rating: Number,
        comment: String,
      },
    ],
    profilePicture: { type: String, default: '' },
    position: { type: String, default: '' }, // ADDED: Position for clients
    // --- FIELD ADDED ---
    emailNotificationsEnabled: { type: Boolean, default: true },
  },
  { timestamps: true }
);

const User = mongoose.model('User', UserSchema);

export default User;