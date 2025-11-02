// backend/controllers/userController.js
import User from '../models/User.js';
import Project from '../models/Project.js';
import Review from '../models/Review.js';
import bcrypt from 'bcryptjs';
import { cloudinary } from '../config/cloudinary.js';

// --- HELPER FUNCTION TO HIDE CLOUDINARY URL ---
const transformUser = (user) => {
  if (user && user.profilePicture && user.profilePicture.startsWith('https://res.cloudinary.com/')) {
    // Ensure we are working with a plain object
    const transformedUser = user.toObject ? user.toObject() : { ...user };
    transformedUser.profilePicture = transformedUser.profilePicture.replace('https://res.cloudinary.com/daxvjw2au/image/upload/', '/images/');
    return transformedUser;
  }
  return user;
};

// --- Get Logged In User Profile ---
export const getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password');
    res.json(transformUser(user)); // USE TRANSFORM
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
};

// --- Update Logged In User Profile ---
export const updateProfile = async (req, res) => {
  const { name, bio, skills, position } = req.body;
  try {
    let user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ msg: 'User not found' });
    }
    user.name = name || user.name;
    user.bio = bio || user.bio;
    user.position = position || user.position;
    if (skills) {
      user.skills = Array.isArray(skills) ? skills : skills.split(',').map(skill => skill.trim());
    }
    await user.save();
    res.json(transformUser(user)); // USE TRANSFORM
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
};

// --- MODIFIED: UPLOAD PROFILE PICTURE TO CLOUDINARY ---
export const uploadProfilePicture = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ msg: 'No file uploaded' });
    }
    const result = await cloudinary.uploader.upload(req.file.path, {
      folder: 'profile_pictures',
      transformation: [{ width: 200, height: 200, crop: "fill" }]
    });
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ msg: 'User not found' });
    }
    user.profilePicture = result.secure_url;
    await user.save();
    res.json(transformUser(user)); // USE TRANSFORM
  } catch (err) {
    console.error('Cloudinary Upload Error:', err);
    res.status(500).send('Server error during file upload');
  }
};

// --- Get Public User Profile by ID ---
export const getUserProfileById = async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select('-password -otp -otpExpires');
    if (!user) {
      return res.status(404).json({ msg: 'User not found' });
    }

    const reviews = await Review.find({ reviewee: req.params.id })
      .populate('reviewer', 'name profilePicture')
      .sort({ createdAt: -1 });

    let projects;
    if (user.role === 'client') {
      projects = await Project.find({ client: req.params.id })
        .populate('assignedFreelancer', 'name')
        .sort({ createdAt: -1 });
    } else { // freelancer
      projects = await Project.find({ assignedFreelancer: req.params.id })
        .populate('client', 'name')
        .sort({ createdAt: -1 });
    }

    // Transform user and reviewers in the response
    const transformedReviews = reviews.map(review => {
        const transformedReview = review.toObject();
        if (transformedReview.reviewer) {
            transformedReview.reviewer = transformUser(transformedReview.reviewer);
        }
        return transformedReview;
    });

    res.json({
      user: transformUser(user),
      reviews: transformedReviews,
      projects
    });
  } catch (err) {
    console.error(err.message);
    if (err.kind === 'ObjectId') {
        return res.status(404).json({ msg: 'User not found' });
    }
    res.status(500).send('Server Error');
  }
};


// --- OTHER FUNCTIONS ---

export const changePassword = async (req, res) => {
    const { currentPassword, newPassword } = req.body;
    try {
        const user = await User.findById(req.user.id);
        if (!user) return res.status(404).json({ msg: 'User not found' });
        const isMatch = await bcrypt.compare(currentPassword, user.password);
        if (!isMatch) return res.status(400).json({ msg: 'Incorrect current password' });
        const salt = await bcrypt.genSalt(10);
        user.password = await bcrypt.hash(newPassword, salt);
        await user.save();
        res.json({ msg: 'Password updated successfully' });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
};

export const updateNotificationPreferences = async (req, res) => {
    const { enabled } = req.body;
    try {
        const user = await User.findByIdAndUpdate(
            req.user.id,
            { emailNotificationsEnabled: !!enabled },
            { new: true }
        ).select('-password');
        res.json(transformUser(user)); // USE TRANSFORM
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
};

export const getCollaboratedUsers = async (req, res) => {
    try {
        let projects;
        if (req.user.role === 'client') {
            projects = await Project.find({ client: req.user.id, assignedFreelancer: { $exists: true } }).populate('assignedFreelancer', 'name email profilePicture');
            const freelancers = projects.map(p => p.assignedFreelancer).filter(Boolean);
            const uniqueFreelancers = freelancers.filter((freelancer, index, self) =>
                index === self.findIndex((f) => f._id.toString() === freelancer._id.toString())
            );
            return res.json(uniqueFreelancers.map(transformUser)); // USE TRANSFORM
        } else { // 'freelancer'
            projects = await Project.find({ assignedFreelancer: req.user.id }).populate('client', 'name email profilePicture');
            const clients = projects.map(p => p.client).filter(Boolean);
            const uniqueClients = clients.filter((client, index, self) =>
                index === self.findIndex((c) => c._id.toString() === client._id.toString())
            );
            return res.json(uniqueClients.map(transformUser)); // USE TRANSFORM
        }
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
};

export const getAllClients = async (req, res) => {
    try {
        const clients = await User.find({ role: 'client' }).select('-password');
        res.json(clients.map(transformUser)); // USE TRANSFORM
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
};

export const getAllFreelancers = async (req, res) => {
    try {
        const freelancers = await User.find({ role: 'freelancer' }).select('-password');
        res.json(freelancers.map(transformUser)); // USE TRANSFORM
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
};

export const getAllUsers = async (req, res) => {
  try {
    const users = await User.find().select('-password');
    res.json(users.map(transformUser)); // USE TRANSFORM
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
};
