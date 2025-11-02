// backend/routes/paymentRoutes.js
import express from 'express';
import auth from '../middleware/authMiddleware.js';
import {
    createBankAccount,
    requestBankLoginOtp,
    verifyBankLogin,
    addAmount,
    transferMoney,
    checkBalance,
    withdraw,
    getTransactions,
} from '../controllers/paymentController.js';

const router = express.Router();

// Public routes for account creation and login
router.post('/create-account', auth, createBankAccount);
router.post('/login/request-otp', auth, requestBankLoginOtp);
router.post('/login/verify', auth, verifyBankLogin);

// Protected routes (require user to be logged into the main app)
router.post('/add-amount', auth, addAmount);
router.post('/transfer', auth, transferMoney);
router.get('/balance', auth, checkBalance); // Correct route is /balance
router.post('/withdraw', auth, withdraw);
router.get('/transactions', auth, getTransactions);

export default router;