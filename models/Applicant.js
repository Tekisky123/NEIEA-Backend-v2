import mongoose from "mongoose";
import validator from "validator";

const applicantSchema = new mongoose.Schema({
  course: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Course",
    required: [true, "Course is required"],
  },
  fullName: {
    type: String,
    required: [true, "Full name is required"],
    trim: true,
  },
  email: {
    type: String,
    required: [true, "Email is required"],
    validate: [validator.isEmail, "Please provide a valid email"],
  },
  phone: {
    type: String,
    required: [true, "Phone number is required"],
    validate: {
      validator: function (v) {
        return /^\d{10}$/.test(v); // Simple validation for 10-digit phone number
      },
      message: props => `${props.value} is not a valid phone number!`
    },
  },
  age: {
    type: Number,
    required: [true, "Age is required"],
    min: [1, "Age must be at least 1"],
  },
  gender: {
    type: String,
    required: [true, "Gender is required"],
    enum: {
      values: ["Male", "Female", "Other"],
      message: "Gender is either: Male, Female, or Other",
    },
  },
  isStudent: {
    type: String,
    required: [true, "Student status is required"],
    enum: {
      values: ["Yes", "No"],
      message: "Student status is either: Yes or No",
    },
  },
  classStudying: {
    type: String,
    required: function () { return this.isStudent === "Yes"; },
  },
  motherTongue: {
    type: String,
    required: [true, "Mother tongue is required"],
  },
  state: {
    type: String,
    required: [true, "State is required"],
  },
  city: {
    type: String,
    required: [true, "City is required"],
  },
  whatsappNumber: {
    type: String,
    required: [true, "WhatsApp number is required"],
  },
  referredBy: {
    type: String,
    required: [true, "Referred by is required"],
  },
  convenientTimeSlot: {
    type: String,
    required: [true, "Convenient time slot is required"],
  },
  message: {
    type: String,
  },
  appliedAt: {
    type: Date,
    default: Date.now,
  },
  razorpayOrderId: { type: String },
  razorpayPaymentId: { type: String },
  razorpaySignature: { type: String },
  isVerified: { type: Boolean, default: false },
});

// Create a compound index to prevent duplicate entries based on email and course
applicantSchema.index({ email: 1, course: 1 }, { unique: true });

export default mongoose.model("Applicant", applicantSchema);
