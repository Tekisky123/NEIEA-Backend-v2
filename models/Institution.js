import mongoose from "mongoose";
import validator from "validator";

const institutionSchema = new mongoose.Schema({
    email: {
        type: String,
        required: [true, "Email is required"],
        validate: [validator.isEmail, "Please provide a valid email"],
    },
    appliedCourses: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Course',
    }],
    institutionName: {
        type: String,
        required: [true, "Institution name is required"],
        trim: true,
    },
    howDidYouFindUs: {
        type: String,
    },
    referredBy: {
        type: String,
    },
    coordinatorName: {
        type: String,
        required: [true, "Coordinator name is required"],
        trim: true,
    },
    coordinatorContactNumber1: {
        type: String,
        required: [true, "Contact number 1 is required"],
        validate: {
            validator: function (v) {
                return /^\d{10}$/.test(v); // Simple validation for 10-digit phone number
            },
            message: (props) => `${props.value} is not a valid phone number!`,
        },
    },
    coordinatorEmail: {
        type: String,
        required: [true, "Coordinator email is required"],
        validate: [validator.isEmail, "Please provide a valid email"],
    },
    coordinatorContactNumber2: {
        type: String,
        validate: {
            validator: function (v) {
                return v === undefined || /^\d{10}$/.test(v); // Optional field, validate if provided
            },
            message: (props) => `${props.value} is not a valid phone number!`,
        },
    },
    coordinatorEmail2: {
        type: String,
        validate: [validator.isEmail, "Please provide a valid email"],
    },
    state: {
        type: String,
        required: [true, "State is required"],
    },
    city: {
        type: String,
        required: [true, "City is required"],
    },
    address: {
        type: String,
        required: [true, "Address is required"],
    },
    numberOfStudents: {
        type: Number,
        required: [true, "Number of students is required"],
        min: [1, "Number of students must be at least 1"],
    },
    startMonth: {
        type: String,
        required: [true, "Earliest start date is required"],
    },
    studentList: {
        type: String, // Assuming you store a URL or path to the uploaded file
    },
    institutionLogo: {
        type: String, // Assuming you store a URL or path to the uploaded file
    },
    suitableTime: {
        type: String,
        required: [true, "Suitable time is required"],
    },
    appliedAt: {
        type: Date,
        default: Date.now,
    },
});

// Create a compound index to prevent duplicate entries based on email and institution name
institutionSchema.index({ email: 1 }, { unique: true });

export default mongoose.model("Institution", institutionSchema);
