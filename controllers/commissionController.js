const SupportUser = require('../models/SupportUser');

const deductCommission = async (req, res) => {
  const { userId, amount } = req.body;
  const numericAmount = Number(amount);

  if (!userId || isNaN(numericAmount) || numericAmount <= 0) {
    return res.status(400).json({ message: 'Missing or invalid userId or amount' });
  }

  try {
    const supportUser = await SupportUser.findById(userId);
    if (!supportUser) {
      return res.status(404).json({ message: 'Support user not found' });
    }

    supportUser.balance = Math.max(0, supportUser.balance - numericAmount);
    await supportUser.save();

    return res.status(200).json({
      message: 'Commission deducted successfully',
      newBalance: supportUser.balance
    });
  } catch (err) {
    console.error('Commission deduction error:', err);
    res.status(500).json({ message: 'Internal server error' });
  }
};

module.exports = {
  deductCommission,
};
