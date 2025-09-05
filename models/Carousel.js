import mongoose from 'mongoose';

const carouselImageSchema = new mongoose.Schema({
  url: {
    type: String,
    required: [true, 'Image URL is required']
  },
  heading: {
    type: String,
    default: null
  },
  subText: {
    type: String,
    default: null
  },
  ctaText: {
    type: String,
    default: null
  },
  ctaUrl: {
    type: String,
    default: null
  }
});

const carouselSchema = new mongoose.Schema({
  page: {
    type: String,
    required: [true, 'Page name is required'],
    unique: true,
    trim: true
  },
  images: {
    type: [carouselImageSchema],
    validate: {
      validator: function(images) {
        return images.length <= 3;
      },
      message: 'Carousel cannot have more than 3 images'
    }
  }
}, {
  timestamps: true
});

// Update the updatedAt field whenever the document is modified
carouselSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

const Carousel = mongoose.model('Carousel', carouselSchema);

export default Carousel; 