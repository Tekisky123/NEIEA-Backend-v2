import mongoose from "mongoose";
import validator from "validator";

const bulletPointSchema = new mongoose.Schema({
    page: {
        type: String,
        required: [true, "Page is required"],
    },
    points: {
        type: [String],
        required: [true, "Bullet point is required"],
    }

},
    {
        timestamps: true,
    }
);

export default mongoose.model("BulletPoint", bulletPointSchema);