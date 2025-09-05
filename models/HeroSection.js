import mongoose from "mongoose";
import validator from "validator";

const heroSectionSchema = new mongoose.Schema({
    page: {
        type: String,
        required: [true, "Page is required"],
    },
    h1: {
        type: String,
        required: [true, "Heading1 is required"],
    },
    h2: {
        type: String,
        required: [true, "Heading2 is required"],
    },

},
    {
        timestamps: true,
    }
);

export default mongoose.model("HeroSection", heroSectionSchema);