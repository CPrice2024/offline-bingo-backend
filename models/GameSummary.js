import mongoose from 'mongoose';

const gameSummarySchema = new mongoose.Schema({
  winnerAmount: Number,
  deductedCommission: Number,
  commissionPercent: Number,
  cardCount: Number,
  eachCardAmount: Number,
  calledNumbers: [Number],
  winningCardIds: [Number],
  recordedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'Support' },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
}, { timestamps: true }); // ✅ enables createdAt and updatedAt

const GameSummary = mongoose.model('GameSummary', gameSummarySchema);
export default GameSummary; // ✅ THIS FIXES THE ERROR
