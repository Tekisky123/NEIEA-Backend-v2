import mongoose from 'mongoose';

const videoCardSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String, required: true },
  thumbnail: { type: String, required: true },
  duration: { type: String, required: true },
  videoUrl: { type: String, required: true },
  page: { type: String, required: true }, // e.g., 'introduction'
}, { timestamps: true });

export default mongoose.model('VideoCard', videoCardSchema);