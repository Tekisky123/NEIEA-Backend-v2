import mongoose from "mongoose";
import validator from "validator";

const pageSchema = new mongoose.Schema({
    
    pageName: {
        type: String,
        required: [true, "Title is required"],
    },
    pageSlug: {
        type: String,
        required: [true, "Page slug is required"],
    },

});

export default mongoose.model("Page", pageSchema);