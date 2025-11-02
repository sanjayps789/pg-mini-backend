// backend/routes/userRoutes.js
import express from 'express';
import { 
  getProfile, 
  updateProfile, 
  uploadProfilePicture, 
  getAllClients, 
  getAllFreelancers,
  getAllUsers,
  changePassword,
  updateNotificationPreferences,
  getCollaboratedUsers,
  getUserProfileById // IMPORTED
} from '../controllers/userController.js';
import auth from '../middleware/authMiddleware.js';
import multer from 'multer';

const router = express.Router();
const upload = multer({ dest: 'uploads/' });

router.get('/profile', auth, getProfile);
router.put('/profile', auth, updateProfile);
router.post('/profile/picture', auth, upload.single('profilePicture'), uploadProfilePicture);
router.put('/profile/change-password', auth, changePassword);
router.put('/profile/notification-preferences', auth, updateNotificationPreferences);

router.get('/collaborated', auth, getCollaboratedUsers);

router.get('/clients', auth, getAllClients);
router.get('/freelancers', auth, getAllFreelancers);
router.get('/', auth, getAllUsers);

// NEW ROUTE: Must be last to avoid overriding other routes like /profile
router.get('/:id', auth, getUserProfileById);

export default router;