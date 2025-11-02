// backend/controllers/paymentController.js
import BankAccount from '../models/BankAccount.js';
import Transaction from '../models/Transaction.js';
import User from '../models/User.js';
import sendEmail from '../utils/sendEmail.js';
import crypto from 'crypto';

// Create a bank account for a logged-in user
export const createBankAccount = async (req, res) => {
  try {
    const userId = req.user.id;
    const { fullName, email, phone, bankName, pin } = req.body;

    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: 'User not found' });

    const existing = await BankAccount.findOne({ user: userId });
    if (existing) return res.status(400).json({ message: 'Bank account already exists for this user' });

    const account = new BankAccount({
      user: userId,
      fullName,
      email,
      phone,
      bankName,
      balance: 0,
    });
    await account.setPin(pin);
    await account.save();

    return res.status(201).json({ message: 'Bank account created', accountId: account._id });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Server error' });
  }
};

// Request OTP for bank account login
export const requestBankLoginOtp = async (req, res) => {
  try {
    const { email } = req.body;
    const account = await BankAccount.findOne({ email });
    if (!account) return res.status(404).json({ message: 'Bank account not found' });

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    account.otp = otp;
    account.otpExpires = Date.now() + 10 * 60 * 1000; // 10 minutes
    await account.save();

    await sendEmail({
      to: account.email,
      subject: 'Your bank account OTP',
      html: `<p>Your OTP to login to your dummy bank account is <b>${otp}</b>. It expires in 10 minutes.</p>`,
    });

    return res.json({ message: 'OTP sent to email' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

// Verify OTP and PIN to log in
export const verifyBankLogin = async (req, res) => {
  try {
    const { email, otp, pin } = req.body;
    const account = await BankAccount.findOne({ email }).populate('user', 'name email role');
    if (!account) return res.status(404).json({ message: 'Account not found' });

    if (!account.otp || account.otp !== otp || account.otpExpires < Date.now()) {
      return res.status(400).json({ message: 'Invalid or expired OTP' });
    }

    const pinOk = await account.verifyPin(pin);
    if (!pinOk) return res.status(401).json({ message: 'Invalid pin' });

    account.otp = undefined;
    account.otpExpires = undefined;
    await account.save();

    return res.json({
      message: 'Login successful',
      account: {
        id: account._id,
        fullName: account.fullName,
        email: account.email,
        balance: account.balance,
        user: account.user,
      },
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

// Add money to an account (Client action)
export const addAmount = async (req, res) => {
  try {
    const userId = req.user.id;
    const { amount } = req.body;
    if (!amount || amount <= 0) return res.status(400).json({ message: 'Invalid amount' });

    const account = await BankAccount.findOne({ user: userId });
    if (!account) return res.status(404).json({ message: 'Bank account not found' });

    account.balance += Number(amount);
    await account.save();

    await Transaction.create({
      toAccount: account._id,
      amount: Number(amount),
      type: 'topup',
      status: 'completed',
      performedBy: userId,
      note: 'Client top-up',
    });

    return res.json({ message: 'Amount added', balance: account.balance });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

// --- MODIFICATION START ---
// Renamed from sendMoney to transferMoney to match frontend service call
export const transferMoney = async (req, res) => { 
// --- MODIFICATION END ---
  try {
    const fromUserId = req.user.id;
    const { toUserId, amount } = req.body; // 'toUserId' comes from the frontend
    if (!toUserId || !amount || amount <= 0) return res.status(400).json({ message: 'Invalid parameters' });

    const fromAccount = await BankAccount.findOne({ user: fromUserId });
    const toAccount = await BankAccount.findOne({ user: toUserId });

    if (!fromAccount) return res.status(404).json({ message: 'Sender bank account not found' });
    if (!toAccount) return res.status(404).json({ message: 'Recipient bank account not found' });

    if (fromAccount.balance < Number(amount)) return res.status(400).json({ message: 'Insufficient balance' });
    
    // --- ADDITION START ---
    const recipientUser = await User.findById(toUserId);
    if (!recipientUser) return res.status(404).json({ message: 'Recipient user does not exist' });
    // --- ADDITION END ---

    fromAccount.balance -= Number(amount);
    toAccount.balance += Number(amount);

    await fromAccount.save();
    await toAccount.save();

    await Transaction.create({
      fromAccount: fromAccount._id,
      toAccount: toAccount._id,
      // --- ADDITION START ---
      // Save the direct User ID of the recipient.
      recipient: toUserId, 
      // --- ADDITION END ---
      amount: Number(amount),
      type: 'transfer',
      status: 'completed',
      performedBy: fromUserId,
      note: `Payment from client to freelancer ${recipientUser.name}`,
    });

    return res.json({ message: 'Transfer successful', fromBalance: fromAccount.balance });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

// Check account balance
export const checkBalance = async (req, res) => {
  try {
    const userId = req.user.id;
    const account = await BankAccount.findOne({ user: userId });
    if (!account) return res.status(404).json({ message: 'Bank account not found' });
    return res.json({ balance: account.balance });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

// Withdraw funds (Freelancer action)
export const withdraw = async (req, res) => {
  try {
    const userId = req.user.id;
    const { amount } = req.body;
    if (!amount || amount <= 0) return res.status(400).json({ message: 'Invalid amount' });

    const account = await BankAccount.findOne({ user: userId });
    if (!account) return res.status(404).json({ message: 'Bank account not found' });

    if (account.balance < Number(amount)) return res.status(400).json({ message: 'Insufficient balance' });

    account.balance -= Number(amount);
    await account.save();

    await Transaction.create({
      fromAccount: account._id,
      amount: Number(amount),
      type: 'withdraw',
      status: 'completed',
      performedBy: userId,
      note: 'Freelancer withdrawal',
    });

    return res.json({ message: 'Withdrawal successful', balance: account.balance });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

// Get transaction history
export const getTransactions = async (req, res) => {
  try {
    const userId = req.user.id;
    const account = await BankAccount.findOne({ user: userId });
    if (!account) return res.status(404).json({ message: 'Bank account not found' });

    // --- MODIFICATION START ---
    // Modified the query to populate the recipient's name for display.
    const txs = await Transaction.find({
      $or: [{ fromAccount: account._id }, { toAccount: account._id }],
    })
    .populate('recipient', 'name') // This fetches the recipient's name
    .sort({ createdAt: -1 });
    // --- MODIFICATION END ---
    
    return res.json({ transactions: txs });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};