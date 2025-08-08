import mongoose from 'mongoose';

const paymentSchema = new mongoose.Schema(
  {
    fullName: {
      type: String,
      required: true,
      trim: true,
    },
    paymentCode: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    subscriptionPlan: {
      type: String,
      required: true,
      enum: ['Basic', 'Standard', 'Premium'], // Optional: restrict to known plans
    },
    paymentMethod: {
      type: String,
      required: true,
      enum: ['Credit Card', 'PayPal', 'Bank Transfer'], // Optional
    },
  },
  {
    timestamps: true, // adds createdAt and updatedAt fields
  }
);

const Payment = mongoose.model('Payment', paymentSchema);

export default Payment;
