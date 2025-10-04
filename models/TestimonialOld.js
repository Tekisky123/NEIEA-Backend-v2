import mongoose from "mongoose";
import validator from "validator";

const testimonialSchema = new mongoose.Schema({
    page: {
        type: String,
        required: [true, "Page is required"],
    },
    name:{
        type: String,
        required: [true, "Name is required"],
    },
    message:{
        type: String,
        required: [true, "Message is required"],
    },
    

},
    {
        timestamps: true,
    }
);

export default mongoose.model("Testimonial", testimonialSchema);