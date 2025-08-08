import mongoose from "mongoose";

const supportSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  phone: { type: String, required: true },
  city: { type: String, required: false },
  balance: { type: Number, default: 0 },
  commission: { type: Number, default: 0 },
  role: {
    type: String,
    enum: ["agent", "super-agent"],
    default: "agent",
  },
  superAgentName: { type: String, required:false },
  bingoCardType: {
    type: String,
    enum: ["A100", "A200", "W60", "R250"],
    default: "A100",
  },
  currentToken: { type: String, default: null },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Founder",
    required: true,
  },
  createdAt: { type: Date, default: Date.now },
});

export default mongoose.model("Support", supportSchema);
