// backend/models/BankAccount.js
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const BankAccountSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
    fullName: { type: String, required: true },
    email: { type: String, required: true },
    phone: { type: String, required: true },
    bankName: { type: String, required: true },
    pinHash: { type: String, required: true },
    balance: { type: Number, default: 0 },
    otp: { type: String },
    otpExpires: { type: Date },
  },
  { timestamps: true }
);

// Method to set and hash the pin
BankAccountSchema.methods.setPin = async function (plainPin) {
  const salt = await bcrypt.genSalt(10);
  this.pinHash = await bcrypt.hash(plainPin, salt);
};

// Method to verify the pin
BankAccountSchema.methods.verifyPin = async function (plainPin) {
  return await bcrypt.compare(plainPin, this.pinHash);
};

const BankAccount = mongoose.model('BankAccount', BankAccountSchema);
export default BankAccount;