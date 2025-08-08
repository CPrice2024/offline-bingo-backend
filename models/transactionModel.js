import mongoose from "mongoose";

const transactionSchema = new mongoose.Schema({
  senderId: { type: mongoose.Schema.Types.ObjectId, ref: "Founder", required: true },
  receiverId: { type: mongoose.Schema.Types.ObjectId, ref: "Support", required: true },
  senderEmail: { type: String, required: true },
  receiverEmail: { type: String, required: true },
  amount: { type: Number, required: true },
  read: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now },
});

export default mongoose.model("Transaction", transactionSchema);
