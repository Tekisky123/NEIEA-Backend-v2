import mongoose from "mongoose";
import validator from "validator";

const referredBySchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
    },
},
    {
        timestamps: true,
    }
);

export default mongoose.model("ReferredByName", referredBySchema);
