import mongoose from 'mongoose';
import validator from 'validator';

const galleryItemSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Title is required'],
    trim: true,
    maxlength: [255, 'Title cannot exceed 255 characters'],
    validate: {
      validator: function(v) {
        return v && v.length > 0;
      },
      message: 'Title cannot be empty'
    }
  },
  description: {
    type: String,
    required: [true, 'Description is required'],
    trim: true,
    maxlength: [1000, 'Description cannot exceed 1000 characters']
  },
  image: {
    type: String,
    required: [true, 'Image URL is required'],
    validate: {
      validator: function(v) {
        return validator.isURL(v) || v.includes('amazonaws.com');
      },
      message: 'Invalid image URL'
    }
  },
  category: {
    type: String,
    required: [true, 'Category is required'],
    enum: {
      values: ['events', 'leadership', 'partnerships', 'workshops', 'digital'],
      message: 'Category must be one of: events, leadership, partnerships, workshops, digital'
    }
  },
  year: {
    type: String,
    required: [true, 'Year is required'],
    validate: {
      validator: function(v) {
        const year = parseInt(v);
        return year >= 2000 && year <= 2030;
      },
      message: 'Year must be between 2000 and 2030'
    }
  },
  display_order: {
    type: Number,
    default: 0,
    min: [0, 'Display order cannot be negative']
  },
  is_active: {
    type: Boolean,
    default: true
  },
  created_at: {
    type: Date,
    default: Date.now
  },
  updated_at: {
    type: Date,
    default: Date.now
  }
});

// Update the updated_at field before saving
galleryItemSchema.pre('save', function(next) {
  this.updated_at = Date.now();
  next();
});

// Index for better query performance
galleryItemSchema.index({ category: 1, display_order: 1 });
galleryItemSchema.index({ created_at: -1 });
galleryItemSchema.index({ is_active: 1 });

export default mongoose.model('GalleryItem', galleryItemSchema);