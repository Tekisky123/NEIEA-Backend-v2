// models/Student.js
import mongoose from "mongoose";

const StudentSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  age: {
    type: Number,
    required: true,
  },
  class: {
    type: String,
    required: true,
  },
  donor: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "DonorUser",
    required: true,
  },
  progress: [
    {
      details: String,
      date: { type: Date, default: Date.now },
    },
  ],
});

const Student = mongoose.model("Student", StudentSchema);

export default Student;
