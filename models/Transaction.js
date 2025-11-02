// backend/models/Transaction.js
import mongoose from 'mongoose';

const TransactionSchema = new mongoose.Schema(
  {
    fromAccount: { type: mongoose.Schema.Types.ObjectId, ref: 'BankAccount' }, // null for top-up
    toAccount: { type: mongoose.Schema.Types.ObjectId, ref: 'BankAccount' }, // null for withdraw
    
    // --- ADDITION START ---
    // Added a direct reference to the recipient User for easier lookup and display.
    recipient: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    // --- ADDITION END ---

    amount: { type: Number, required: true },
    type: { type: String, enum: ['topup', 'transfer', 'withdraw'], required: true },
    status: { type: String, enum: ['pending', 'completed', 'failed'], default: 'completed' },
    note: { type: String },
    performedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
);

const Transaction = mongoose.model('Transaction', TransactionSchema);
export default Transaction;