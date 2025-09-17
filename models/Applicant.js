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
  country: {
    type: String,
    required: [true, "Country is required"],
    default: "India" // Defaulting to India as per your context
  },
  phone: {
    type: String,
    required: [true, "Phone number is required"],
    validate: {
      validator: function(v) {
        // Allows numbers with optional country code (e.g., +91, +1, etc.)
        return /^(\+\d{1,3}[- ]?)?\d{10}$/.test(v);
      },
      message: props => `${props.value} is not a valid phone number!`
    },
  },
  address: {
    type: String,
    required: function() { return this.country !== "India"; }
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
    required: function() { return this.isStudent === "Yes"; },
  },
  motherTongue: {
    type: String,
    required: [true, "Mother tongue is required"],
  },
  state: {
    type: String,
    required: function() { return this.country === "India"; }
  },
  city: {
    type: String,
    required: function() { return this.country === "India"; }
  },
  whatsappNumber: {
    type: String,
    required: [true, "WhatsApp number is required"],
    validate: {
      validator: function(v) {
        return /^(\+\d{1,3}[- ]?)?\d{10}$/.test(v);
      },
      message: props => `${props.value} is not a valid WhatsApp number!`
    },
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
