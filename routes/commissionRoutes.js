import express from 'express';
import Support from '../models/supportModel.js';

import { protect } from "../middleware/authMiddleware.js";


const router = express.Router();

router.post('/deduct', protect, async (req, res) => {
  const { userId } = req.body;
  const amount = Number(req.body.amount);

  if (!userId || isNaN(amount) || amount <= 0) {
    console.warn("❌ Invalid request payload:", { userId, amount });
    return res.status(400).json({ message: "Invalid request. userId and positive amount are required." });
  }

  try {
    console.log("Commission deduction request:", { userId, amount });

    const user = await Support.findById(userId);
    if (!user) {
      console.error("❌ Support user not found:", userId);
      return res.status(404).json({ message: "User not found." });
    }

    if (user.balance < amount) {
      console.warn("❌ Insufficient balance for user:", { balance: user.balance, amount });
      return res.status(400).json({ message: "Insufficient balance." });
    }

    user.balance -= amount;

    console.log("🧪 Before save: balance =", user.balance);

    await user.save();

    console.log("✅ Commission deducted. New balance:", user.balance);

    res.status(200).json({
      message: "Commission deducted successfully.",
      newBalance: user.balance
    });

  } catch (err) {
    console.error("❌ Server error during commission deduction:", err.message, err.stack);
    res.status(500).json({ message: `Server error: ${err.message}` });
  }
});


export default router;
