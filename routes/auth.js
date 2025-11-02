import express from 'express';
import {
  signup,
  // verifyOtpAndLogin,
  login,
  forgotPassword,
  resetPassword,
} from '../controllers/authController.js';

const router = express.Router();

// @route   POST api/auth/signup
router.post('/signup', signup);

// @route   POST api/auth/verify
// router.post('/verify', verifyOtpAndLogin);

// @route   POST api/auth/login
router.post('/login', login);

// @route   POST api/auth/forgot-password
router.post('/forgot-password', forgotPassword);

// @route   POST api/auth/reset-password
router.post('/reset-password', resetPassword);

export default router;
