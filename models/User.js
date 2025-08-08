import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
  name: String,
  email: { type: String, unique: true },
  role: String,
  credit: { type: Number, default: 0 },
  notifications: [
    {
      message: String,
      date: { type: Date, default: Date.now },
    }
  ]
});

export default mongoose.model("User", userSchema);
