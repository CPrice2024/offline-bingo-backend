import Payment from '../models/paymentModel.js';

export const createPayment = async (req, res) => {
  try {
    const { fullName, paymentCode, subscriptionPlan, paymentMethod } = req.body;

    const payment = await Payment.create({
      fullName,
      paymentCode,
      subscriptionPlan,
      paymentMethod,
    });

    res.status(201).json({
      success: true,
      message: 'Payment created successfully',
      data: payment,
    });
  } catch (error) {
    console.error('Create Payment Error:', error);
    res.status(500).json({
      success: false,
      message: 'Server Error',
    });
  }
};
