import mongoose from "mongoose";

const DonationSchema = new mongoose.Schema({
  firstName: { type: String, required: true },
  lastName: { type: String, required: true },
  email: { type: String, required: true },
  phone: { type: String, required: true },
  address: { type: String},
  city: { type: String },
  state: { type: String },
  zipCode: { type: String},
  country: { type: String },
  amount: { type: Number, required: true },
  panCard: { type: String },
  donorType: {
    type: String,
    default: "Regular",
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "DonorUser",
  },
  frequency: {
    type: String,
    enum: ["once", "monthly", "quarterly", "annually"],
    default: "once",
  },
  razorpayOrderId: { type: String },
  razorpayPaymentId: { type: String },
  razorpaySignature: { type: String },
  isVerified: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now },
});

// Add indexes for better query performance
DonationSchema.index({ email: 1 });
DonationSchema.index({ donorType: 1 });
DonationSchema.index({ createdAt: -1 });

const Donation = mongoose.model("Donation", DonationSchema);

export default Donation;
