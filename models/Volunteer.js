import mongoose from "mongoose";

const languageProficiencySchema = new mongoose.Schema({
  speaking: { type: Boolean, default: false },
  writing: { type: Boolean, default: false },
  reading: { type: Boolean, default: false },
  none: { type: Boolean, default: false },
});

const addressSchema = new mongoose.Schema({
  city: { type: String, required: true },
  state: { type: String, required: true },
  country: { type: String, required: true },
});

const socialMediaSchema = new mongoose.Schema({
  facebook: { type: String, enum: ["Expert", "Intermediate", "Beginner", "No Experience", ""], default:"", required: false },
  linkedIn: { type: String, enum: ["Expert", "Intermediate", "Beginner", "No Experience", ""], default:"", required: false },
  instagram: { type: String, enum: ["Expert", "Intermediate", "Beginner", "No Experience", ""], default:"", required: false },
  twitter: { type: String, enum: ["Expert", "Intermediate", "Beginner", "No Experience", ""], default:"", required: false },
  youTube: { type: String, enum: ["Expert", "Intermediate", "Beginner", "No Experience", ""], default:"", required: false },
});

const contentCreationSchema = new mongoose.Schema({
  hasExperience: { type: Boolean, required: false },
  createdBefore: { type: [String], required: false },
  toolsUsed: { type: [String], required: false },
});

const outreachSchema = new mongoose.Schema({
  hasOutreachExperience: { type: Boolean, required: false },
  outreachActivities: { type: [String], required: false },
});

const fundraisingSchema = new mongoose.Schema({
  hasFundraisingExperience: { type: Boolean, required: false },
  fundraisingTypes: { type: [String], required: false },
});

const volunteerSchema = new mongoose.Schema(
  {
    firstName: { type: String, required: true },
    lastName: { type: String, required: true },
    dob: { type: Date, required: true },
    gender: { type: String, required: true, enum: ["Male", "Female"] },
    phone: { type: String, required: true },
    emergencyPhone: { type: String },
    email: { type: String, required: true, unique: true },
    address: { type: addressSchema, required: true },
    languageProficiency: {
      english: { type: languageProficiencySchema, required: true },
      hindi: { type: languageProficiencySchema, required: true },
      urdu: { type: languageProficiencySchema, required: true },
      bengali: { type: languageProficiencySchema, required: true },
      telugu: { type: languageProficiencySchema, required: true },
      kannada: { type: languageProficiencySchema, required: true },
      marathi: { type: languageProficiencySchema, required: true },
      otherLanguage: { type: String },
    },
    dailyCommitment: { type: String, required: true },
    availability: { type: [String], required: true },
    volunteerField: { type: String, required: true },
    socialMedia: { type: socialMediaSchema, required: false },
    contentCreation: { type: contentCreationSchema, required: false },
    outreach: { type: outreachSchema, required: false },
    fundraising: { type: fundraisingSchema, required: false },
    teachingExperience: { type: String, required: false },
    onlineTeachingYears: { type: String, required: false },
    ageGroups: { type: [String], required: false },
    confidentSubjects: { type: [String], required: false },
    relevantExperience: { type: String, required: true },
    motivation: { type: String, required: true },
    commitmentDuration: { type: String, required: true },
    dateOfJoining: { type: Date, required: true },
  },
  { timestamps: true }
);

export default mongoose.model("Volunteer", volunteerSchema);
