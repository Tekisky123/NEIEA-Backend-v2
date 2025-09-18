import mongoose from "mongoose";
import validator from "validator";

const contactSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Name is required"],
      trim: true,
    },
    email: {
      type: String,
      required: [true, "Email is required"],
      validate: [validator.isEmail, "Please provide a valid email"],
      trim: true,
    },
    affiliation: {
      type: String,
      default: "",
      trim: true,
    },
    inquiryType: {
      type: String,
      required: [true, "Inquiry type is required"],
      enum: {
        values: ["Press", "Donation", "Partnership", "Membership", "Feedback", "Other"],
        message: "Please select a valid inquiry type",
      },
    },
    message: {
      type: String,
      required: [true, "Message is required"],
      trim: true,
    },
  },
  { timestamps: true } // This automatically adds `createdAt` and `updatedAt`
);

const Contact = mongoose.model("Contact", contactSchema);
export default Contact;
