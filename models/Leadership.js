import mongoose from "mongoose";

const leadershipSchema = new mongoose.Schema({
  name: {
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
    default: ''
  },
  image: {
    type: String,
    default: ''
  },
  category: {
    type: String,
    enum: ['directors', 'advisors', 'staff'],
    required: true
  },
  
  // Bio-specific fields
  fullBio: {
    type: String,
    default: ''
  },
  bioImages: [{
    url: String,
    caption: String,
    displayOrder: Number
  }],
  achievements: [{
    title: String,
    description: String,
    year: String
  }],
  education: [{
    degree: String,
    institution: String,
    year: String
  }],
  experience: [{
    position: String,
    organization: String,
    duration: String,
    description: String
  }],
  
  // SEO and routing
  slug: {
    type: String,
    unique: true,
    required: true
  },
  
  // Management fields
  display_order: {
    type: Number,
    default: 0
  },
  is_active: {
    type: Boolean,
    default: true
  },
  show_bio: {
    type: Boolean,
    default: true
  },
  
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Auto-generate slug
leadershipSchema.pre('save', function(next) {
  if (this.isModified('name')) {
    this.slug = this.name.toLowerCase()
      .replace(/\s+/g, '-')
      .replace(/\./g, '')
      .replace(/[^\w\-]+/g, '');
  }
  next();
});

export default mongoose.model('Leadership', leadershipSchema);