import mongoose from "mongoose";
import validator from "validator";

const subscribeSchema = new mongoose.Schema(
  {
    
    email: {
      type: String,
      required: [true, "Email is required"],
      validate: [validator.isEmail, "Please provide a valid email"],
      trim: true,
      unique:true,
    }
    
  },
  { timestamps: true }
);

const Subscribe = mongoose.model("Subscribe", subscribeSchema);

export default Subscribe;
