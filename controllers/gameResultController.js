import WinnerCard from '../models/WinnerCard.js';
import GameSummary from '../models/GameSummary.js';

// ✅ Save Winning Card
export const saveWinningCard = async (req, res) => {
  try {
    const { cardId, userId, calledNumbers, winnerAmount, eachCardAmount } = req.body;

    const newWinner = new WinnerCard({
      cardId,
      userId,
      calledNumbers,
      winnerAmount,
      eachCardAmount,
      recordedBy: req.user._id, // from token
      // No need for savedAt — use timestamps
    });

    await newWinner.save();

    res.status(201).json({ message: 'Winning card saved successfully' });
  } catch (err) {
    res.status(500).json({ message: 'Failed to save winning card', error: err.message });
  }
};

export const getAllSupportGameResults = async (req, res) => {
  try {
    const results = await GameResult.find({})
      .sort({ createdAt: -1 })
      .populate("supportId", "name email"); // optional: show support name/email

    res.status(200).json(results);
  } catch (err) {
    console.error("Error fetching all support game results:", err);
    res.status(500).json({ message: "Server error" });
  }
};
// ✅ Get All Game Results Created By Support Agents (for Founder dashboard)
export const getFounderSupportResults = async (req, res) => {
  try {
    if (req.user.role !== "founder") {
      return res.status(403).json({ message: "Unauthorized access" });
    }

    const results = await GameSummary.find({ initial: false })
      .populate({
        path: "recordedBy",
        select: "name commission role",
        match: { role: "support" }, // only show if created by support
      })
      .sort({ createdAt: -1 })
      .lean();

    // Filter out any without recordedBy populated (null)
    const formatted = results
      .filter(r => r.recordedBy)
      .map(r => ({
        supportId: r.recordedBy._id,
        supportName: r.recordedBy.name,
        commission: r.recordedBy.commission ?? r.commissionPercent, // fallback
        amount: r.cardCount * r.eachCardAmount,
        createdAt: r.createdAt,
      }));

    res.status(200).json(formatted);
  } catch (err) {
    console.error("Founder support results error:", err);
    res.status(500).json({ message: "Server error", error: err.message });
  }
};



// ✅ Save Game Summary (initial or updated)
export const saveGameSummary = async (req, res) => {
  try {
    const {
      cardCount,
      commissionPercent,
      eachCardAmount,
      calledNumbers,
      winningCardIds = [],
      initial = false,
      userId = null,
    } = req.body;

    if (
      cardCount === undefined ||
      commissionPercent === undefined ||
      eachCardAmount === undefined ||
      userId === undefined ||
      !Array.isArray(calledNumbers)
    ) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    const totalAmount = cardCount * eachCardAmount;
    const deductedCommission = totalAmount * (commissionPercent / 100);
    const winnerAmount = totalAmount - deductedCommission;

    if (initial) {
      // ✅ Phase 1: Save initial blank game summary
      const newSummary = new GameSummary({
        cardCount,
        commissionPercent,
        eachCardAmount,
        calledNumbers: [],
        winningCardIds: [],
        winnerAmount: 0,
        deductedCommission,
        recordedBy: req.user._id,
        userId,
        initial: true,
      });

      await newSummary.save();
      return res.status(201).json({ message: "Initial game summary saved" });
    }

    // ✅ Phase 2: Update the previous initial game
    const updated = await GameSummary.findOneAndUpdate(
      { recordedBy: req.user._id, userId, initial: true },
      {
        $set: {
          calledNumbers,
          winningCardIds,
          winnerAmount,
          deductedCommission,
          initial: false,
        },
      },
      { new: true }
    );

    if (!updated) {
      return res.status(404).json({ message: "Initial summary not found to update" });
    }

    res.status(200).json({ message: "Game summary updated successfully" });
  } catch (err) {
    console.error("Game summary error:", err);
    res.status(500).json({ message: "Failed to save game summary", error: err.message });
  }
};

// ✅ Fetch Support's Game Results
export const getSupportGameResults = async (req, res) => {
  try {
    const supportId = req.user._id;

    const results = await GameSummary.find({ recordedBy: supportId })
      .sort({ createdAt: -1 }) 
      .select('winnerAmount deductedCommission commissionPercent cardCount createdAt'); // ← include createdAt

    res.json(results);
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch game results.', error: err.message });
  }
};

