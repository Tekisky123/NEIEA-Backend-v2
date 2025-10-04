// models/Testimonial.js
import mongoose from 'mongoose';

// Card Testimonials Schema (unchanged)
const cardTestimonialSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  role: {
    type: String,
    trim: true,
    default: ''
  },
  location: {
    type: String,
    trim: true,
    default: ''
  },
  image: {
    type: String,
    required: true,
    trim: true
  },
  content: {
    type: String,
    required: true,
    trim: true
  },
  display_order: {
    type: Number,
    default: 0
  },
  is_active: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// Video Testimonials Schema (UPDATED)
const videoTestimonialSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    trim: true,
    default: ''
  },
  type: {
    type: String,
    trim: true,
    default: ''
  },
  duration: {
    type: String,
    trim: true,
    default: ''
  },
  videoUrl: {
    type: String,
    required: true,
    trim: true
  },
  // NEW FIELDS
  videoType: {
    type: String,
    enum: ['Video', 'Short'], // Restrict to these values
    required: true,
    default: 'Video'
  },
  videoTag: {
    type: String,
    trim: true,
    default: ''
  },
  rating: {
    type: Number,
    min: 0,
    max: 5,
    default: 0
  },
  display_order: {
    type: Number,
    default: 0
  },
  is_active: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// Create models
export const CardTestimonial = mongoose.model('CardTestimonial', cardTestimonialSchema);
export const VideoTestimonial = mongoose.model('VideoTestimonial', videoTestimonialSchema);
