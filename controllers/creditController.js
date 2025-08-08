import Transaction from "../models/transactionModel.js";
import Support from "../models/supportModel.js";
import Founder from "../models/founderModel.js";
import mongoose from "mongoose";

export const transferCredit = async (req, res) => {
  const { receiverEmail, amount } = req.body;
  const senderId = req.user._id;

  if (req.user.role !== "founder") return res.status(403).json({ message: "Only founders can transfer." });

  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const sender = await Founder.findById(senderId).session(session);
    const receiver = await Support.findOne({ email: receiverEmail }).session(session);

    if (!sender || !receiver) throw new Error("Sender or receiver not found.");
    if (sender.balance < amount) throw new Error("Insufficient balance.");

    sender.balance -= amount;
    receiver.balance += amount;

    await sender.save({ session });
    await receiver.save({ session });

    await Transaction.create([{
      senderId: sender._id,
      receiverId: receiver._id,
      senderEmail: sender.email,
      receiverEmail: receiver.email,
      amount,
    }], { session });

    await session.commitTransaction();
    session.endSession();

    res.status(200).json({ message: `Sent ${amount} birr`, updatedBalance: sender.balance });
  } catch (err) {
    await session.abortTransaction();
    session.endSession();
    console.error("Transfer error:", err.message);
    res.status(500).json({ message: err.message });
  }
};
export const getFounderBalance = async (req, res) => {
  try {
    const founder = await Founder.findById(req.user._id);
    if (!founder) {
      return res.status(404).json({ message: "Founder not found" });
    }
    res.json({ balance: founder.balance });
  } catch (error) {
    console.error("Error fetching balance:", error);
    res.status(500).json({ message: "Server error" });
  }
};


export const getNotifications = async (req, res) => {
  try {
    const transactions = await Transaction.find({ receiverId: req.user._id }).sort({ createdAt: -1 });

    const formatted = transactions.map(tx => ({
      senderEmail: tx.senderEmail,
      amount: tx.amount,
      time: new Date(tx.createdAt).toLocaleString(),
    }));

    res.json(formatted);
  } catch {
    res.status(500).json([]);
  }
};

export const getFounderTransactions = async (req, res) => {
  const { page = 1, limit = 5, email, startDate, endDate } = req.query;

  const query = { senderId: req.user._id };

  if (email) {
    query.receiverEmail = { $regex: email, $options: "i" };
  }

  if (startDate || endDate) {
    query.createdAt = {};
    if (startDate) query.createdAt.$gte = new Date(startDate);
    if (endDate) query.createdAt.$lte = new Date(endDate);
  }

  try {
    const transactions = await Transaction.find(query)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    const enrichedTransactions = await Promise.all(
      transactions.map(async (tx) => {
        let commission = null;
        try {
          const receiver = await Support.findOne({ email: tx.receiverEmail });
          if (receiver) commission = receiver.commission;
        } catch (err) {
          console.warn("⚠️ Failed to fetch support for:", tx.receiverEmail);
        }

        return {
          ...tx.toObject(),
          commission: commission ?? null,
        };
      })
    );

    const total = await Transaction.countDocuments(query);

    res.status(200).json({ transactions: enrichedTransactions, total });
  } catch (err) {
    console.error("❌ Error fetching transactions:", err);
    res.status(500).json({ message: "Server error while fetching transactions" });
  }
};



export const getSentTransactions = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 5,
      email = "",
      startDate,
      endDate,
    } = req.query;

    const query = { senderId: req.user._id };

    // Filter by receiverEmail
    if (email) {
      query.receiverEmail = { $regex: email, $options: "i" };
    }

    // Filter by date range
    if (startDate || endDate) {
      query.createdAt = {};
      if (startDate) query.createdAt.$gte = new Date(startDate);
      if (endDate) query.createdAt.$lte = new Date(endDate);
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const [transactions, total] = await Promise.all([
      Transaction.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit)),

      Transaction.countDocuments(query),
    ]);

    res.status(200).json({ transactions, total });
  } catch (err) {
    console.error("❌ Error fetching transactions:", err);
    res.status(500).json({ message: "Server error while fetching transactions" });
  }
};

