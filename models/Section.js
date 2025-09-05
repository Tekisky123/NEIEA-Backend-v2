import mongoose from "mongoose";
import validator from "validator";

const sectionSchema = new mongoose.Schema({
    page: {
        type: String,
        required: [true, "Page is required"],
    },
    heading: {
        type: String,
        required: [true, "Title is required"],
    },
    subHeading: {
        type: String,
    },
    body: {
        type: String,
        required: [true, "Body text is required"],
    },
    imageUrl: {
        type: String,
        required: false, // Made optional for flexibility
    }, // optional for blocks that have images

    orientation: { type: String, enum: ['left', 'right'], required: true }, // for alternation
}, { timestamps: true });

export default mongoose.model("Section", sectionSchema);