import mongoose from 'mongoose';

const winnerCardSchema = new mongoose.Schema({
  cardId: { type: Number, required: true },
  userId: { type: String, required: true },
  calledNumbers: { type: [Number], required: true },
  winnerAmount: { type: Number, required: true },
  savedAt: { type: Date, default: Date.now },
});

const WinnerCard = mongoose.model('WinnerCard', winnerCardSchema);
export default WinnerCard;