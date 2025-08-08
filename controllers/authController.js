import Founder from "../models/founderModel.js";
import Support from "../models/supportModel.js";
import Transaction from "../models/transactionModel.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { generateToken } from "../utils/generateToken.js";

const cookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "none",
  maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
}; 

// ----------- Founder -----------
export const signupFounder = async (req, res) => {
  const { name, email, password } = req.body;
  const existingFounder = await Founder.findOne({ email });
  if (existingFounder) return res.status(400).json({ message: "Email already in use." });

  const hashedPassword = await bcrypt.hash(password, 10);
  const founder = await Founder.create({ name, email, password: hashedPassword });

  res.status(201).json({ message: "Founder registered." });
};

export const signinFounder = async (req, res) => {
  const { email, password } = req.body;
  const founder = await Founder.findOne({ email });
  if (!founder || !(await bcrypt.compare(password, founder.password)))
    return res.status(400).json({ message: "Invalid credentials." });

  const token = generateToken(founder, "founder");
  res.cookie("token", token, cookieOptions);
  res.status(200).json({ message: "Founder logged in successfully." });
};

export const getFounders = async (req, res) => {
  const founders = await Founder.find().select("-password");
  res.json(founders);
};

export const deleteFounder = async (req, res) => {
  const { id } = req.params;
  await Founder.findByIdAndDelete(id);
  res.json({ message: "Founder deleted successfully." });
};
// ----------- Edit Support (Update) -----------
export const updateSupport = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, email, phone, password, commission, city, superAgentName, bingoCardType  } = req.body;

    const support = await Support.findById(id);
    if (!support) return res.status(404).json({ message: "Support not found." });

    // 🔐 Check if current founder is the owner
    if (support.createdBy.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: "You are not authorized to update this support." });
    }

    const updateFields = {
      name,
      email,
      phone,
      commission,
      city,
      superAgentName,
      bingoCardType: bingoCardType || support.bingoCardType,
    };

    if (password) {
      updateFields.password = await bcrypt.hash(password, 10);
    }

    const updated = await Support.findByIdAndUpdate(id, updateFields, { new: true });

    res.status(200).json({ message: "Support updated successfully.", support: updated });
  } catch (error) {
    console.error("Update support failed:", error);
    res.status(500).json({ message: "Failed to update support.", error: error.message });
  }
};

// ----------- Support -----------
export const signupSupport = async (req, res) => {
  try {
    const {
      name,
      email,
      password,
      phone,
      city,
      commission,
      bingoCardType,
      role = "agent",
      superAgentName = "", 
    } = req.body;

    const existingSupport = await Support.findOne({ email });
    if (existingSupport) {
      return res.status(400).json({ message: "Email already in use." });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const support = new Support({
      name,
      email,
      password: hashedPassword,
      phone,
      city,
      commission: commission || 0,
      bingoCardType: bingoCardType || "A100",
      createdBy: req.user._id,
      role,
      superAgentName,
    });

    await support.save();

    res.status(201).json({ message: "Support registered." });
  } catch (error) {
    console.error("🔥 signupSupport failed:", error);
    res.status(500).json({ message: "Internal server error", error: error.message });
  }
};

// In authController.js
export const getSuperAgents = async (req, res) => {
  try {
    const superAgents = await Support.find({ role: "super-agent" }).select("name _id");
    res.status(200).json(superAgents);
  } catch (error) {
    console.error("Failed to fetch super agents", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};


export const getSupportById = async (req, res) => {
  try {
    const { id } = req.params;
    const support = await Support.findById(id).select("-password");
    if (!support) {
      return res.status(404).json({ message: "Support not found" });
    }

    res.json(support);
  } catch (error) {
    console.error("Error fetching support by ID:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};


export const signinSupport = async (req, res) => {
  const { email, password } = req.body;

  const support = await Support.findOne({ email });
  if (!support || !(await bcrypt.compare(password, support.password))) {
    return res.status(400).json({ message: "Check Email or Password" });
  }

  const token = generateToken(support, "support");
  res.cookie("token", token, cookieOptions);

  const { name, _id, email: supportEmail } = support;

  console.log("✅ Support object:", { name, _id, email: supportEmail });

  res.status(200).json({
    message: "Support logged in successfully.",
    name,
    _id,
    email, // ✅ THIS MUST BE PRESENT!
  });
};
export const resetSupportBalance = async (req, res) => {
  const { userId } = req.body;

  if (!userId) {
    return res.status(400).json({ message: "User ID is required" });
  }

  try {
    const support = await Support.findById(userId);
    if (!support) {
      return res.status(404).json({ message: "Support user not found" });
    }

    support.balance = 0;
    await support.save();

    res.status(200).json({ message: "Balance reset to 0" });
  } catch (error) {
    console.error("❌ Error resetting balance:", error);
    res.status(500).json({ message: "Server error" });
  }
};

export const syncBalance = async (req, res) => {
  try {
    const { balance } = req.body;
    const userId = req.user._id;

    const support = await Support.findById(userId);
    if (!support) {
      return res.status(404).json({ message: "Support user not found" });
    }

    support.balance = balance;
    await support.save();

    res.status(200).json({ message: "Balance synced successfully", balance });
  } catch (error) {
    console.error("❌ syncBalance error:", error);
    res.status(500).json({ message: "Server error" });
  }
};


// controllers/transferController.js
export const markNotificationAsRead = async (req, res) => {
  try {
    const { id } = req.params;
    const tx = await Transaction.findById(id);

    if (!tx || tx.receiverId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: "Unauthorized" });
    }

    tx.read = true;
    await tx.save();

    res.status(200).json({ message: "Marked as read" });
  } catch (err) {
    res.status(500).json({ message: "Failed to mark notification" });
  }
};
export const getSupportTransactions = async (req, res) => {
  try {
    const { page = 1, limit = 5, email, startDate, endDate } = req.query;

    const query = { receiverId: req.user._id };

    if (email) {
      query.senderEmail = { $regex: email, $options: "i" };
    }

    if (startDate || endDate) {
      query.createdAt = {};
      if (startDate) query.createdAt.$gte = new Date(startDate);
      if (endDate) query.createdAt.$lte = new Date(endDate);
    }

    const transactions = await Transaction.find(query)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    const total = await Transaction.countDocuments(query);

    res.status(200).json({ transactions, total });
  } catch (err) {
    console.error("❌ Error fetching transactions:", err);
    res.status(500).json({ message: "Server error" });
  }
};


export const getSupports = async (req, res) => {
  try {
    const supports = await Support.find({ createdBy: req.user._id }).select("-password");
    res.json(supports);
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch supports", error: error.message });
  }
};

export const deleteSupport = async (req, res) => {
  try {
    const { id } = req.params;
    const support = await Support.findById(id);
    if (!support) return res.status(404).json({ message: "Support not found." });

    // 🔐 Ownership check
    if (support.createdBy.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: "You are not authorized to delete this support." });
    }

    await Support.findByIdAndDelete(id);
    res.json({ message: "Support deleted successfully." });
  } catch (error) {
    console.error("❌ Delete error:", error);
    res.status(500).json({ message: "Server error" });
  }
};


// ----------- Credit Transfer -----------
export const getFounderProfile = async (req, res) => {
  try {
    const founder = await Founder.findById(req.user._id).select("-password");
    if (!founder) return res.status(404).json({ message: "Founder not found" });

    res.json({
      balance: founder.balance || 0,
      name: founder.name,
      email: founder.email,
    });
  } catch (error) {
    console.error("Fetch founder profile failed:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

// In authController.js
export const getSupportCardType = async (req, res) => {
  try {
    const supportId = req.params.id;
    const support = await Support.findById(supportId);

    if (!support) {
      return res.status(404).json({ message: "Support not found" });
    }

    res.status(200).json({ bingoCardType: support.bingoCardType });
  } catch (error) {
    console.error("getSupportCardType error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// ----------- Credit Transfer (Properly defined) -----------
export const transferCredit = async (req, res) => {
  try {
    const { receiverEmail, amount } = req.body;
    const parsedAmount = Number(amount);

    if (!receiverEmail || isNaN(parsedAmount) || parsedAmount === 0) {
      return res.status(400).json({ message: "Invalid email or amount" });
    }

    const founder = await Founder.findById(req.user._id);
    const support = await Support.findOne({ email: receiverEmail });

    if (!founder) return res.status(404).json({ message: "Founder not found" });
    if (!support) return res.status(404).json({ message: "Support not found" });

    // 💡 If amount is positive, check and deduct founder balance
    if (parsedAmount > 0) {
      if (founder.balance < parsedAmount) {
        return res.status(400).json({ message: "Insufficient balance" });
      }

      founder.balance -= parsedAmount;
      await founder.save();
      console.log("✅ Founder balance deducted:", founder.balance);
    }

    // ✅ Always update support balance
    await Support.updateOne(
      { _id: support._id },
      { $inc: { balance: parsedAmount } }
    );
    console.log("✅ Support balance updated with $inc");

    // ✅ Record transaction
    const transaction = await Transaction.create({
      senderId: founder._id,
      receiverId: support._id,
      senderEmail: founder.email,
      receiverEmail: support.email,
      amount: parsedAmount,
    });

    console.log("✅ Transaction recorded");

    res.status(200).json({
      message: `Transferred ${parsedAmount} birr to ${receiverEmail}`,
      transaction,
    });
  } catch (error) {
    console.error("❌ Credit transfer failed:", error);
    res.status(500).json({ message: "Internal server error", error: error.message });
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

export const getFounderTransactions = async (req, res) => {
  try {
    const { page = 1, limit = 20, email, startDate, endDate } = req.query;

    const query = {
      senderId: req.user._id, // 🔒 Only transactions made by this founder
    };

    if (email) {
      query.$or = [
        { senderEmail: { $regex: email, $options: "i" } },
        { receiverEmail: { $regex: email, $options: "i" } },
      ];
    }

    if (startDate) {
      query.createdAt = { ...query.createdAt, $gte: new Date(startDate) };
    }
    if (endDate) {
      query.createdAt = { ...query.createdAt, $lte: new Date(endDate) };
    }

    const transactions = await Transaction.find(query)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(Number(limit));

    const total = await Transaction.countDocuments(query);

    return res.json({ transactions, total });
  } catch (err) {
    console.error("Fetch Transactions Error:", err);
    return res.status(500).json({ message: "Failed to fetch transactions" });
  }
};


// ----------- Support Profile -----------
export const getSupportProfile = async (req, res) => {
  try {
    console.log("🔑 Token payload (req.user):", req.user);

    const support = await Support.findById(req.user._id).select("-password");
    if (!support) {
      console.error("❌ Support not found for ID:", req.user._id);
      return res.status(404).json({ message: "Support not found" });
    }

    console.log("✅ Support profile fetched:", {
      id: support._id,
      email: support.email,
      bingoCardType: support.bingoCardType,
    });

    res.json({
      balance: support.balance || 0,
      name: support.name,
      email: support.email,
      bingoCardType: support.bingoCardType || "default",
    });
  } catch (err) {
    console.error("❌ getSupportProfile error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

export const getSupportBalance = async (req, res) => {
  try {
    const support = await Support.findById(req.user._id);
    if (!support) {
      return res.status(404).json({ message: "Support user not found" });
    }
    res.status(200).json({ balance: support.balance });
  } catch (error) {
    console.error("getSupportBalance error:", error);
    res.status(500).json({ message: "Server error" });
  }
};


export const syncOfflineCommissions = async (req, res) => {
  try {
    const { commissions } = req.body;
    // Save them however you need: DB insert, summary, etc.
    console.log("✅ Synced commissions:", commissions.length);
    res.status(200).json({ message: "Commissions synced" });
  } catch (err) {
    console.error("Sync commissions failed:", err);
    res.status(500).json({ message: "Error syncing commissions" });
  }
};

export const syncOfflineSummaries = async (req, res) => {
  try {
    const { summaries } = req.body;
    // Save summaries
    console.log("✅ Synced summaries:", summaries.length);
    res.status(200).json({ message: "Game summaries synced" });
  } catch (err) {
    console.error("Sync summaries failed:", err);
    res.status(500).json({ message: "Error syncing summaries" });
  }
};


// ----------- Notifications -----------
export const getNotifications = async (req, res) => {
  try {
    const transactions = await Transaction.find({
      receiverId: req.user._id,
      read: false, // only unread
    }).sort({ createdAt: -1 });

    const formatted = transactions.map(tx => ({
      _id: tx._id,
      senderEmail: tx.senderEmail,
      amount: tx.amount,
      time: new Date(tx.createdAt).toLocaleString(),
    }));

    res.json(formatted);
  } catch {
    res.status(500).json([]);
  }
};

// ----------- Logout -----------
export const logout = (req, res) => {
  res.clearCookie("token", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "none",
  });

  res.status(200).json({ message: "Logged out successfully." });
};

export const deductCommission = async (req, res) => {
  const { userId, amount } = req.body;

  // Validate the input
  if (!userId || typeof amount !== "number" || amount <= 0) {
    return res.status(400).json({ message: "Invalid userId or amount." });
  }

  try {
    const support = await Support.findById(userId);
    if (!support) return res.status(404).json({ message: "Support user not found." });

    // Deduct balance safely (prevent negative numbers)
    support.balance = Math.max(0, support.balance - amount);

    await support.save();

    res.status(200).json({
      message: "Commission deducted successfully",
      newBalance: support.balance,
    });
  } catch (error) {
    console.error("❌ Deduct error:", error);
    res.status(500).json({ message: "Server error" });
  }
};
