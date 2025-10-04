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
    required: true,
    trim: true
  },
  image: {
    type: String,
    required: true,
    trim: true
  },
  hasImage: { 
    type: Boolean,
    default: true
  },
  category: {
    type: String,
    required: true,
    enum: ['directors', 'advisors', 'staff'],
    default: 'directors'
  },
  display_order: {
    type: Number,
    default: 0
  },
  is_active: {
    type: Boolean,
    default: true
  },
  fullBio: {
    type: String,
    default: ''
  },
  slug: {
    type: String,
    unique: true,
    sparse: true
  }
}, {
  timestamps: true
});

// Generate slug before saving
leadershipSchema.pre('save', function(next) {
  if (this.isModified('name')) {
    this.slug = this.name
      .toLowerCase()
      .replace(/\s+/g, '-')
      .replace(/\./g, '')
      .replace(/[^\w\-]+/g, '')
      .replace(/\-\-+/g, '-')
      .replace(/^-+/, '')
      .replace(/-+$/, '');
  }
  next();
});

// Index for better performance
leadershipSchema.index({ category: 1, display_order: 1 });
leadershipSchema.index({ is_active: 1 });
leadershipSchema.index({ slug: 1 });

export default mongoose.model('Leadership', leadershipSchema);