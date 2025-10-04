// scripts/seedTestimonials.js
// run command: node scripts/seedTestimonials.js
import mongoose from 'mongoose';
import { CardTestimonial, VideoTestimonial } from '../models/Testimonial.js';
import dotenv from "dotenv";
dotenv.config();

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI);

const seedCardTestimonials = [
  {
    name: "Jaswinder Kaur",
    role: "Student",
    location: "Nagpur, Maharashtra",
    image: "/assets/images/DOP_Images/Testimonials/Jaswinder kaur  (1).jpg",
    content: "As a 59-year-old from Nagpur, I'm thrilled to have discovered NEIEA. Thanks to Niloufer Ma'am's excellent teaching and patience, I've been able to overcome my doubts and learn effectively.",
    display_order: 1,
    is_active: true
  },
  {
    name: "Mohan",
    role: "Student",
    location: "Hyderabad, Telangana",
    image: "/assets/images/DOP_Images/Testimonials/Mohan .jpg",
    content: "I had to leave my education earlier due to personal reasons, but thanks to NEIEA's free online classes, I've been able to continue learning in new ways.",
    display_order: 2,
    is_active: true
  }
];

const seedVideoTestimonials = [
  {
    title: "From Hesitation to Confidence: My English Journey",
    description: "Watch how NEIEA's English course transformed a student's communication skills and boosted their confidence in speaking.",
    type: "Success Story",
    duration: "Video",
    videoUrl: "https://youtu.be/bqnhdq5MqkA",
    display_order: 1,
    is_active: true
  },
  {
    title: "Breaking Language Barriers with NEIEA",
    description: "A heartfelt story of overcoming language challenges and achieving fluency through dedicated learning.",
    type: "Inspiring Journey",
    duration: "Short",
    videoUrl: "https://youtube.com/shorts/S52K-BLtv9Y",
    display_order: 2,
    is_active: true
  }
];

const seedDatabase = async () => {
  try {
    // Clear existing data
    // await CardTestimonial.deleteMany({});
    // await VideoTestimonial.deleteMany({});

    // Insert seed data
    await CardTestimonial.insertMany(seedCardTestimonials);
    await VideoTestimonial.insertMany(seedVideoTestimonials);

    console.log('Database seeded successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Error seeding database:', error);
    process.exit(1);
  }
};

seedDatabase();