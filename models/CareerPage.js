import mongoose from "mongoose";

const benefitItemSchema = new mongoose.Schema({
  icon: {
    type: String,
    required: true,
    trim: true
  },
  title: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    required: true,
    trim: true
  },
  display_order: {
    type: Number,
    default: 0
  }
}, { _id: true });

const careerPageSchema = new mongoose.Schema({
  introduction: {
    heading: {
      type: String,
      required: true,
      trim: true
    },
    description: {
      type: String,
      required: true,
      trim: true
    }
  },
  whyWorkSection: {
    heading: {
      type: String,
      required: true,
      trim: true
    },
    benefits: [benefitItemSchema]
  },
  openingsSection: {
    heading: {
      type: String,
      required: true,
      trim: true
    },
    description: {
      type: String,
      trim: true
    },
    jobCategories: [{
      type: String,
      trim: true
    }],
    contactInfo: {
      icon: {
        type: String,
        trim: true
      },
      heading: {
        type: String,
        required: true,
        trim: true
      },
      description: {
        type: String,
        trim: true
      },
      email: {
        type: String,
        required: true,
        trim: true
      }
    }
  },
  closingSection: {
    heading: {
      type: String,
      required: true,
      trim: true
    },
    description: {
      type: String,
      required: true,
      trim: true
    }
  },
  is_active: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// Index for better performance
careerPageSchema.index({ is_active: 1 });

export default mongoose.model('CareerPage', careerPageSchema);

