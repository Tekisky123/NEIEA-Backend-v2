import mongoose from "mongoose";
import validator from "validator";

const subPageSchema = new mongoose.Schema({
    page: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Page",
        required: [true, "Page is required"],
    },
    subPageName: {
        type: String,
        required: [true, "Title is required"],
    },
    subPageSlug: {
        type: String,
        required: [true, "Page slug is required"],
    },

},
    {
        timestamps: true,
    }
);

export default mongoose.model("SubPage", subPageSchema);